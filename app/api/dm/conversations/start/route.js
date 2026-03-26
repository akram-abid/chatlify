// app/api/dm/conversations/start/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(req) {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }
    if (targetUserId === currentUser.id) {
      return NextResponse.json({ error: 'Cannot start a conversation with yourself' }, { status: 400 });
    }

    // Check if the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, name: true },
    });
    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Look for an existing 1-to-1 conversation between these two users.
    // Strategy: find a conversation where BOTH users are participants.
    const existing = await prisma.conversation.findFirst({
      where: {
        AND: [
          { participants: { some: { userId: currentUser.id } } },
          { participants: { some: { userId: targetUserId } } },
        ],
      },
      include: {
        participants: { select: { userId: true } },
      },
    });

    // Extra guard: make sure it's truly a 2-person conversation
    // (future-proof if you ever add group DMs)
    const isExact =
      existing && existing.participants.length === 2;

    if (isExact) {
      return NextResponse.json({ conversationId: existing.id, created: false });
    }

    // Create a fresh conversation + two participant rows atomically
    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: currentUser.id },
            { userId: targetUserId },
          ],
        },
      },
    });

    return NextResponse.json({ conversationId: conversation.id, created: true }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/dm/conversations/start]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}