// app/api/dm/[conversationId]/messages/[messageId]/route.js
// PATCH  /api/dm/:conversationId/messages/:messageId
//   body: { content: string }
//   → edit your own message
// DELETE /api/dm/:conversationId/messages/:messageId
//   → soft-delete your own message

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUserIdFromRequest } from '@/lib/auth';

// ── PATCH — edit ──────────────────────────────────────────────────────────

export async function PATCH(req, { params }) {
  try {
    const currentUserId = await getUserIdFromRequest(req);
    if (!currentUserId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId, messageId } = params;
    const { content } = await req.json();

    if (!content?.trim()) {
      return NextResponse.json(
        { error: 'Content cannot be empty' },
        { status: 400 }
      );
    }

    const existing = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!existing || existing.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (existing.senderId !== currentUserId) {
      return NextResponse.json(
        { error: "Cannot edit another user's message" },
        { status: 403 }
      );
    }
    if (existing.deleted) {
      return NextResponse.json(
        { error: 'Cannot edit a deleted message' },
        { status: 400 }
      );
    }

    const updated = await prisma.directMessage.update({
      where: { id: messageId },
      data: { content: content.trim(), editedAt: new Date() },
      include: { sender: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ message: updated });
  } catch (err) {
    console.error('[PATCH /api/dm/.../messages/:id]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ── DELETE — soft delete ──────────────────────────────────────────────────

export async function DELETE(req, { params }) {
  try {
    const currentUserId = await getUserIdFromRequest(req);
    if (!currentUserId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { conversationId, messageId } = params;

    const existing = await prisma.directMessage.findUnique({
      where: { id: messageId },
    });

    if (!existing || existing.conversationId !== conversationId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
    if (existing.senderId !== currentUserId) {
      return NextResponse.json(
        { error: "Cannot delete another user's message" },
        { status: 403 }
      );
    }

    await prisma.directMessage.update({
      where: { id: messageId },
      data: { deleted: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/dm/.../messages/:id]', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
