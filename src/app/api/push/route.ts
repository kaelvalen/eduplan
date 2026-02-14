import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/db';

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

    // Save to database
    await prisma.pushSubscription.upsert({
      where: { userId: user.id },
      update: {
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
        updatedAt: new Date(),
      },
      create: {
        userId: user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

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

    // Remove from database
    await prisma.pushSubscription.deleteMany({
      where: { userId: user.id },
    });

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function sendPushNotification(userId: number, title: string, body: string, data?: any) {
  try {
    const subscriptionRecord = await prisma.pushSubscription.findUnique({
      where: { userId },
    });

    if (!subscriptionRecord) {
      console.log(`No push subscription found for user ${userId}`);
      return false;
    }

    // Subscription data for future production use:
    // const subscription: PushSubscriptionJSON = {
    //   endpoint: subscriptionRecord.endpoint,
    //   keys: {
    //     p256dh: subscriptionRecord.p256dh,
    //     auth: subscriptionRecord.auth,
    //   },
    // };

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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function broadcastPushNotification(title: string, body: string, data?: any) {
  const subscriptions = await prisma.pushSubscription.findMany();
  const results = [];

  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub.userId, title, body, data);
    results.push({ userId: sub.userId, success: result });
  }

  return results;
}