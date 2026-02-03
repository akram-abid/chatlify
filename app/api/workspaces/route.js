import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

export async function GET(req) {
  try {
    // const authHeader = req.headers.get('authorization');

    const token = req.cookies.get("access_token").value;
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    const payload = await jwtVerify(token, secret);
    const userId = payload.userId;

    const workspaces = await prisma.workspace.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        sections: true,
      },
    });

    return NextResponse.json({ workspaces: workspaces });
  } catch (err) {
    console.log('the error: ', err);
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
