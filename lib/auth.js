import { jwtVerify } from 'jose';

export async function getUserData(token, secret) {
  const data = await jwtVerify(token, secret);
  console.log(
    'you are trying to get the user data form the new util you made and here it is: ',
    data
  );
  return data;
}

export async function getUserIdFromRequest(req) {
  const token = req.cookies.get('access_token')?.value;
  if (!token) return null;

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload.userId;
  } catch {
    return null;
  }
}
