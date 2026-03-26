// app/api/dm/conversations/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(req) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        directMessages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where: { deleted: false },
          include: {
            sender: { select: { id: true, name: true } },
          },
        },
      },
    });

    const shaped = conversations.map((conv) => {
      const other = conv.participants.find((p) => p.userId !== userId)?.user;
      const lastMsg = conv.directMessages[0] ?? null;

      return {
        id: conv.id,
        updatedAt: conv.updatedAt,
        userId: other?.id,
        name: other?.name,
        email: other?.email,
        lastMessage: lastMsg?.content ?? null,
        lastMessageSender: lastMsg?.sender?.name ?? null,
        lastTime: lastMsg
          ? new Date(lastMsg.createdAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
          : null,
      };
    });

    return NextResponse.json({ conversations: shaped });
  } catch (err) {
    console.error('[GET /api/dm/conversations]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}