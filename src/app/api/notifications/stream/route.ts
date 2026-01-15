import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getAllNotifications } from '@/lib/turso-helpers';

// Simple in-memory store for SSE connections (in production, use Redis or similar)
const clients = new Map<number, { controller: ReadableStreamDefaultController; lastNotificationId: number }>();

// GET /api/notifications/stream - Server-Sent Events stream for real-time notifications
export async function GET(request: Request) {
  try {
    const user = await getCurrentUser(request);
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user's last seen notification ID
    const { searchParams } = new URL(request.url);
    const lastNotificationId = parseInt(searchParams.get('lastId') || '0');

    // Create ReadableStream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Store client connection
        clients.set(user.id, { controller, lastNotificationId });

        // Send initial connection confirmation
        const initialData = {
          type: 'connected',
          userId: user.id,
          timestamp: new Date().toISOString()
        };
        controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`);

        // Clean up on client disconnect
        request.signal.addEventListener('abort', () => {
          clients.delete(user.id);
        });
      },
      cancel() {
        clients.delete(user.id);
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });
  } catch (error) {
    console.error('SSE connection error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

// Function to broadcast notifications to connected clients
export async function broadcastNotification(notification: any) {
  const message = {
    type: 'notification',
    data: notification,
    timestamp: new Date().toISOString()
  };

  // Send to specific user if notification has userId, otherwise send to all clients
  if (notification.userId) {
    const client = clients.get(notification.userId);
    if (client && client.controller) {
      try {
        client.controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        console.error('Error sending notification to client:', error);
        clients.delete(notification.userId);
      }
    }
  } else {
    // Send to all connected clients
    for (const [userId, client] of clients.entries()) {
      try {
        client.controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
      } catch (error) {
        console.error('Error sending notification to client:', error);
        clients.delete(userId);
      }
    }
  }
}

// Function to broadcast system updates (like stats changes, schedule updates)
export async function broadcastSystemUpdate(updateType: string, data: any) {
  const message = {
    type: 'system_update',
    updateType,
    data,
    timestamp: new Date().toISOString()
  };

  // Send to all connected clients
  for (const [userId, client] of clients.entries()) {
    try {
      client.controller.enqueue(`data: ${JSON.stringify(message)}\n\n`);
    } catch (error) {
      console.error('Error sending system update to client:', error);
      clients.delete(userId);
    }
  }
}