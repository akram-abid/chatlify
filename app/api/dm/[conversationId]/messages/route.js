// app/api/dm/[conversationId]/messages/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

async function assertParticipant(conversationId, userId) {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

// ── GET ───────────────────────────────────────────────────────────────────

export async function GET(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = params;
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);

    const isMember = await assertParticipant(conversationId, userId);
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.directMessage.findMany({
      where: { conversationId, deleted: false },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include: {
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    // normalize shape to match thread messages so Message.jsx works for both
    const normalized = messages.map((m) => ({
      id: m.id,
      content: m.content,
      createdAt: m.createdAt,
      editedAt: m.editedAt,
      user: m.sender, // rename sender → user so MessageRow renders correctly
    }));

    return NextResponse.json(normalized);
  } catch (err) {
    console.error('[GET /api/dm/[conversationId]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ── POST ──────────────────────────────────────────────────────────────────

export async function POST(req, { params }) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId } = params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    const isMember = await assertParticipant(conversationId, userId);
    if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [message] = await prisma.$transaction([
      prisma.directMessage.create({
        data: { content: content.trim(), conversationId, senderId: userId },
        include: { sender: { select: { id: true, name: true, email: true } } },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
    ]);

    // normalize so Message.jsx gets the same shape as thread messages
    const normalized = {
      id: message.id,
      content: message.content,
      createdAt: message.createdAt,
      user: message.sender,
    };

    return NextResponse.json([normalized], { status: 201 });
  } catch (err) {
    console.error('[POST /api/dm/[conversationId]/messages]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}