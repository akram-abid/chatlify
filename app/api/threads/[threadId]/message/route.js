import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

export async function GET(req, { params }) {
  try {
    // const authHeader = req.headers.get('authorization');

    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }
    const token = req.cookies.get('access_token').value;
    console.log('the token: ', token);
    console.log(
      'this is the secret: ',
      process.env.JWT_SECRET + 'and this is the token: ',
      token
    );
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    console.log('the payload is that: ', payload);
    const user = payload.userId;
    console.log('the user is: ', user);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;
    console.log('the threadId is this one: ', threadId);
    console.log("----------------------------------------------------------------------------------------")
    const thread = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            name: true, // ✅ Add this
            email: true,
          },
        },
      },
    });
    console.log("the data is that: ", thread)

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 });
    }

    // if (thread.section.workspace.members.length === 0) {
    //   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    const messages = await prisma.message.findMany({
      where: { threadId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    console.log(
      'those are the messages and lets say that we did it: ',
      messages
    );
    return NextResponse.json(thread);
  } catch (err) {
    console.error('JWT ERROR:', err);

    console.log('the error is that: ', err);
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
