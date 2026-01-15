import { NextResponse } from 'next/server';
import { getCurrentUser, isAdmin } from '@/lib/auth';
import { getAllNotifications, createNotification } from '@/lib/turso-helpers';
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

    let notifications = await getAllNotifications(user.id);

    // Filter by unread status
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.isRead);
    }

    // Filter by category
    if (category) {
      notifications = notifications.filter(n => n.category === category);
    }

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

    const notification = await createNotification(body);

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