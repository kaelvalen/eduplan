import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendPushNotification, broadcastPushNotification } from '../push/route';
import type { NotificationCreate } from '@/types';

// GET /api/notifications - Get all notifications for current user
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const category = searchParams.get('category');

    const whereClause: any = {
      OR: [
        { userId: user.id },
        { userId: null },
      ],
    };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (category) {
      whereClause.category = category;
    }

    const rawNotifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    const notifications = rawNotifications.map((n) => ({
      id: n.id,
      userId: n.userId,
      title: n.title,
      message: n.message,
      type: n.type,
      category: n.category,
      isRead: n.isRead,
      actionUrl: n.actionUrl,
      createdAt: n.createdAt.toISOString(),
    }));

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Get notifications error:', error);
    return NextResponse.json(
      { detail: 'Bildirimler yüklenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user || !isAdmin(user)) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const body: NotificationCreate = await request.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { detail: 'Başlık ve mesaj zorunludur' },
        { status: 400 }
      );
    }

    const rawNotification = await prisma.notification.create({
      data: {
        userId: body.userId || null,
        title: body.title,
        message: body.message,
        type: body.type || 'info',
        category: body.category || 'general',
        actionUrl: body.actionUrl || null,
        isRead: false,
      },
    });

    const notification = {
      id: rawNotification.id,
      userId: rawNotification.userId,
      title: rawNotification.title,
      message: rawNotification.message,
      type: rawNotification.type,
      category: rawNotification.category,
      isRead: rawNotification.isRead,
      actionUrl: rawNotification.actionUrl,
      createdAt: rawNotification.createdAt.toISOString(),
    };

    // Send push notification if userId is specified
    if (body.userId) {
      try {
        await sendPushNotification(body.userId, body.title, body.message, {
          type: body.type || 'info',
          category: body.category || 'general',
          actionUrl: body.actionUrl
        });
      } catch (pushError) {
        console.error('Push notification error:', pushError);
        // Don't fail the request if push notification fails
      }
    } else {
      // Broadcast to all users if no specific user
      try {
        await broadcastPushNotification(body.title, body.message, {
          type: body.type || 'info',
          category: body.category || 'general',
          actionUrl: body.actionUrl
        });
      } catch (pushError) {
        console.error('Broadcast push notification error:', pushError);
        // Don't fail the request if push notification fails
      }
    }

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Create notification error:', error);
    return NextResponse.json(
      { detail: 'Bildirim oluşturulurken bir hata oluştu' },
      { status: 500 }
    );
  }
}