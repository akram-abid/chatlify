// app/api/users/search/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req) {
  try {
    const currentUser = await getAuthUser(req);
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();

    if (!q || q.length < 1) {
      return NextResponse.json({ users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUser.id }, // exclude yourself
        OR: [
          { name:  { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, email: true },
      take: 20,
    });

    return NextResponse.json({ users });
  } catch (err) {
    console.error('[GET /api/users/search]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}