import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (!body.email || !body.password) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    const hashedPassword = existingUser?.password || '$2a$10$invalidhashtopreventtimingattack';
    const isValid = await bcrypt.compare(body.password, hashedPassword);

    if (existingUser && isValid) {
      // TODO: Create session/JWT token here
      console.log("the authentication successful")
      return Response.json({ message: 'Authentication successful' });
    }

    return Response.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json(
      { error: 'An error occurred during authentication' },
      { status: 500 }
    );
  }
}