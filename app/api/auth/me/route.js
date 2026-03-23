import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function GET(req) {
  try {
    const token = req.cookies.get('access_token')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({ 
      userId: payload.userId,
      token, // raw token for socket auth
    });
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}