import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/notifications/[id] - Get a single notification
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;
    const rawNotification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!rawNotification) {
      return NextResponse.json({ detail: 'Bildirim bulunamadı' }, { status: 404 });
    }

    // Check if user can access this notification
    if (rawNotification.userId && rawNotification.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ detail: 'Bu bildirime erişim yetkiniz yok' }, { status: 403 });
    }

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

    return NextResponse.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    return NextResponse.json(
      { detail: 'Bildirim bilgileri alınamadı' },
      { status: 500 }
    );
  }
}

// PUT /api/notifications/[id] - Mark notification as read
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return NextResponse.json({ detail: 'Bildirim bulunamadı' }, { status: 404 });
    }

    // Check if user can access this notification
    if (notification.userId && notification.userId !== user.id && !isAdmin(user)) {
      return NextResponse.json({ detail: 'Bu bildirime erişim yetkiniz yok' }, { status: 403 });
    }

    await prisma.notification.update({
      where: { id: parseInt(id) },
      data: { isRead: true },
    });

    return NextResponse.json({ message: 'Bildirim okundu olarak işaretlendi' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return NextResponse.json(
      { detail: 'Bildirim güncellenirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/notifications/[id] - Delete a notification
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const { id } = await params;
    const notification = await prisma.notification.findUnique({
      where: { id: parseInt(id) },
    });

    if (!notification) {
      return NextResponse.json({ detail: 'Bildirim bulunamadı' }, { status: 404 });
    }

    // Only admin can delete notifications, or the notification belongs to the user
    if (!isAdmin(user) && notification.userId !== user.id) {
      return NextResponse.json({ detail: 'Bu bildirimi silme yetkiniz yok' }, { status: 403 });
    }

    await prisma.notification.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ message: 'Bildirim silindi' });
  } catch (error) {
    console.error('Delete notification error:', error);
    return NextResponse.json(
      { detail: 'Bildirim silinirken bir hata oluştu' },
      { status: 500 }
    );
  }
}