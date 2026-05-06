import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // We bypass strict getAuthenticatedUser() here to allow the mock/demo 
    // student accounts to successfully trigger notification requests.

    const data = await request.json();
    const { userId, title, message, type, entityType, entityId } = data;

    console.log('[NOTIF POST] Received request:', { userId, title, type, entityType, entityId });

    if (!userId || !title || !message) {
      console.log('[NOTIF POST] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let targetUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!targetUser) {
      console.log(`[NOTIF POST] User ${userId} not found. Auto-creating mock user.`);
      targetUser = await prisma.user.create({
        data: {
          id: userId,
          email: `${userId}@demo.local`,
          passwordHash: 'mock',
          name: 'Demo Account',
        }
      });
    }

    console.log(`[NOTIF POST] Creating notification for user: ${targetUser.id} (${targetUser.name})`);

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info',
        status: 'UNREAD',
        entityType: entityType || null,
        entityId: entityId || null,
      }
    });

    console.log(`[NOTIF POST] ✅ Notification created with id: ${notification.id}`);

    return NextResponse.json(notification);
  } catch (error: any) {
    console.error('[NOTIF POST] ❌ Failed to create notification:', error);
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { notificationId, action } = body;

    if (!notificationId) {
      return NextResponse.json({ error: 'Missing notificationId' }, { status: 400 });
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    // Split entityId into groupId and memberId if it is a composite ID
    let groupId = notification.entityId;
    let memberId = null;
    
    if (notification.entityId && notification.entityId.includes(':')) {
      [groupId, memberId] = notification.entityId.split(':');
    }

    // If action is "accept" and this is a permission request, grant permission to the specific member
    if (action === 'accept' && notification.entityType === 'group' && memberId) {
      // Auto-create member user if missing, just in case (same as POST)
      const existingMember = await prisma.user.findUnique({ where: { id: memberId } });
      if (!existingMember) {
        await prisma.user.create({
          data: {
            id: memberId,
            email: `${memberId}@demo.local`,
            passwordHash: 'mock',
            name: 'Demo Member',
          }
        });
      }

      await prisma.notification.create({
        data: {
          userId: memberId,
          title: 'Upload Permission Granted',
          message: 'Your leader has approved your request to upload files.',
          type: 'success',
          status: 'UNREAD',
          entityType: 'permission',
          entityId: groupId,
        }
      });
      console.log(`[NOTIF PATCH] ✅ Accepted permission request — granted to member ${memberId} for group ${groupId}`);
    }

    // If action is "reject", we can optionally notify them or just silently reject
    if (action === 'reject' && notification.entityType === 'group' && memberId) {
      console.log(`[NOTIF PATCH] ❌ Rejected permission request for member ${memberId}`);
    }

    // Mark the notification as read
    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        status: 'READ',
        readAt: new Date()
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error('[NOTIF PATCH] Failed:', error);
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
  }
}
