import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

// In-memory store for push subscriptions (in production, store in database)
const pushSubscriptions = new Map<number, PushSubscriptionJSON>();

// POST /api/push - Subscribe to push notifications
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    const subscription: PushSubscriptionJSON = await request.json();

    // Validate subscription
    if (!subscription.endpoint || !subscription.keys?.p256dh || !subscription.keys?.auth) {
      return NextResponse.json(
        { detail: 'Geçersiz push subscription' },
        { status: 400 }
      );
    }

    // Store subscription (in production, save to database)
    pushSubscriptions.set(user.id, subscription);

    // TODO: Save to database in production
    // await prisma.pushSubscription.upsert({
    //   where: { userId: user.id },
    //   update: { subscription: JSON.stringify(subscription) },
    //   create: { userId: user.id, subscription: JSON.stringify(subscription) }
    // });

    return NextResponse.json({ message: 'Push notification subscription başarıyla kaydedildi' });
  } catch (error) {
    console.error('Push subscription error:', error);
    return NextResponse.json(
      { detail: 'Push subscription kaydedilirken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// DELETE /api/push - Unsubscribe from push notifications
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return NextResponse.json({ detail: 'Yetkisiz erişim' }, { status: 401 });
    }

    // Remove subscription
    pushSubscriptions.delete(user.id);

    // TODO: Remove from database in production
    // await prisma.pushSubscription.deleteMany({
    //   where: { userId: user.id }
    // });

    return NextResponse.json({ message: 'Push notification subscription kaldırıldı' });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    return NextResponse.json(
      { detail: 'Push subscription kaldırılırken bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Function to send push notification to a user
export async function sendPushNotification(userId: number, title: string, body: string, data?: any) {
  try {
    const subscription = pushSubscriptions.get(userId);
    if (!subscription) {
      console.log(`No push subscription found for user ${userId}`);
      return false;
    }

    // In production, you would use a service like Firebase Cloud Messaging,
    // Web Push API with VAPID keys, or similar service
    // For demo purposes, we'll simulate the push notification

    console.log(`Push notification sent to user ${userId}:`, { title, body, data });

    // Simulate sending push notification
    // In production, you would use web-push library:
    // const webpush = require('web-push');
    // await webpush.sendNotification(subscription, JSON.stringify({ title, body, data }));

    return true;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return false;
  }
}

// Function to broadcast push notification to all users
export async function broadcastPushNotification(title: string, body: string, data?: any) {
  const results = [];
  for (const [userId] of pushSubscriptions.entries()) {
    const result = await sendPushNotification(userId, title, body, data);
    results.push({ userId, success: result });
  }
  return results;
}