import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../../lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(req) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const {email, password, name } = await req.json();

    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser)
      return Response.json({ error: 'the email aleady used' }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
      },
    });

    const accessToken = jwt.sign(
      { userid: email, name: name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
    );
    const response = NextResponse.json({
      success: true,
      token: accessToken,
      user: { id: email, email: email, name: name },
    });

    response.cookies.set('access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
      });

    return response;
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
