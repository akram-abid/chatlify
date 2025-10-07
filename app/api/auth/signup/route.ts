import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  try {
    const body = await req.json();
    console.log('This is the body:', body);

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser)
      return Response.json({ error: 'the email aleady used' }, { status: 400 });

    const plainPassword = body.password;
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
      },
    });

    console.log('the user after storing it is this; ', user);

    return Response.json({
      success: true,
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return Response.json({ error: 'Failed to create user' }, { status: 500 });
  }
}
