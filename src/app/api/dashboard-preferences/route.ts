import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import type { UserDashboardPreferenceCreate } from '@/types';

// GET /api/dashboard-preferences - Get current user's dashboard preferences
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const rawPreference = await prisma.userDashboardPreference.findUnique({
      where: { userId: user.id },
    });

    const preferences = rawPreference ? {
      id: rawPreference.id,
      userId: rawPreference.userId,
      widgets: rawPreference.widgets as any,
      layout: rawPreference.layout as any,
      theme: rawPreference.theme,
      createdAt: rawPreference.createdAt.toISOString(),
      updatedAt: rawPreference.updatedAt.toISOString(),
    } : null;

    // If no preferences exist, return default configuration
    if (!preferences) {
      const defaultPreferences = {
        id: 0,
        userId: user.id,
        widgets: [
          {
            id: 'stats',
            type: 'stats' as const,
            title: 'İstatistikler',
            position: { x: 0, y: 0 },
            size: { width: 3, height: 1 },
            visible: true,
            order: 0
          },
          {
            id: 'actions',
            type: 'actions' as const,
            title: 'Hızlı İşlemler',
            position: { x: 0, y: 1 },
            size: { width: 1, height: 1 },
            visible: true,
            order: 1
          },
          {
            id: 'activity',
            type: 'activity' as const,
            title: 'Son Aktiviteler',
            position: { x: 1, y: 1 },
            size: { width: 1, height: 1 },
            visible: true,
            order: 2
          },
          {
            id: 'scheduler',
            type: 'scheduler' as const,
            title: 'Program Durumu',
            position: { x: 2, y: 1 },
            size: { width: 1, height: 1 },
            visible: true,
            order: 3
          },
          {
            id: 'navigation',
            type: 'navigation' as const,
            title: 'Hızlı Erişim',
            position: { x: 0, y: 2 },
            size: { width: 3, height: 1 },
            visible: true,
            order: 4
          }
        ],
        layout: {
          columns: 3,
          gap: 6,
          padding: 0
        },
        theme: 'default' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json(defaultPreferences);
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Get dashboard preferences error:', error);
    return NextResponse.json(
      { detail: 'Dashboard tercihleri yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard-preferences - Update current user's dashboard preferences
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body: Partial<UserDashboardPreferenceCreate> = await request.json();

    // Validate widgets structure if provided
    if (body.widgets) {
      for (const widget of body.widgets) {
        if (!widget.id || !widget.type || !widget.position || !widget.size) {
          return NextResponse.json(
            { detail: 'Widget yapılandırması geçersiz' },
            { status: 400 }
          );
        }
      }
    }

    const existingPreference = await prisma.userDashboardPreference.findUnique({
      where: { userId: user.id },
    });

    let updatedPreference;
    if (existingPreference) {
      updatedPreference = await prisma.userDashboardPreference.update({
        where: { userId: user.id },
        data: {
          widgets: body.widgets as any,
          layout: body.layout as any,
          theme: body.theme,
        },
      });
    } else {
      updatedPreference = await prisma.userDashboardPreference.create({
        data: {
          userId: user.id,
          widgets: body.widgets as any,
          layout: body.layout as any,
          theme: body.theme || 'default',
        },
      });
    }

    const preferences = {
      id: updatedPreference.id,
      userId: updatedPreference.userId,
      widgets: updatedPreference.widgets as any,
      layout: updatedPreference.layout as any,
      theme: updatedPreference.theme,
      createdAt: updatedPreference.createdAt.toISOString(),
      updatedAt: updatedPreference.updatedAt.toISOString(),
    };

    return NextResponse.json(preferences);
  } catch (error) {
    console.error('Update dashboard preferences error:', error);
    return NextResponse.json(
      { detail: 'Dashboard tercihleri güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}