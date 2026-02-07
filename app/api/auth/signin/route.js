import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { email, password } = await req.json();
    console.log("those are the email and the password:", email)

    if (!email || !password) {  
      return Response.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email },
    });

    const hashedPassword = existingUser?.password;
    const isValid = await bcrypt.compare(password, hashedPassword);

    const accessToken = jwt.sign(
      {
        userId: existingUser.id,
        email: email
      },
      process.env.JWT_SECRET,
      {expiresIn: "120m"}
    );

    const refreshToken = jwt.sign(
      {
        userId: existingUser.id,
        email: email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "30d"
      }
    )

    if (existingUser && isValid) {
      console.log("the auth is succeeded.")
      const response = NextResponse.json({
        success: true,
        token: accessToken,
        user: { id: email, email: email },
      });


      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: "strict",
        maxAge: 30 * 24 * 60 * 60,
      })

      response.cookies.set('access_token', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 30,
      });

      return response;
    }

    return Response.json({ error: 'Invalid credentials' }, { status: 401 });
  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}
