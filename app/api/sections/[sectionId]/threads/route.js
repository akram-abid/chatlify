import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const authHeader = req.headers.get('authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.userId;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sectionId } = await params;

    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    if (section.workspace.members.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const threads = await prisma.thread.findMany({
      where: { sectionId },
      orderBy: { createdAt: 'asc' },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true, 
            email: true,
          },
        },
      },
    });

    return NextResponse.json(threads);
  } catch (err) {
    console.error('Error:', err);

    if (err.code === 'ERR_JWT_EXPIRED') {
      return NextResponse.json(
        { error: 'Token expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    if (err.code?.startsWith('ERR_JWT') || err.code?.startsWith('ERR_JWS')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}