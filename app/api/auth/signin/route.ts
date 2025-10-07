import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
  }
  const body = await req.json();
  console.log('you are trying to get something right?', body.password);

  const existingUser = await prisma.user.findUnique({
    where: { email: body.email },
  });

  if (existingUser) {
    console.log('Stored hash:', existingUser.password);

    const plainPassword = body.password;

    const isValid = await bcrypt.compare(plainPassword, existingUser.password);
    if (isValid) {
      return Response.json({ message: 'the user is authentified' });
    } else {
      return Response.json({ error: 'Invalid credentiald' }, { status: 401 });
    }
  } else {
    return Response.json(
      {
        error: 'Invalid credential',
      },
      { status: 404 }
    );
  }
}
