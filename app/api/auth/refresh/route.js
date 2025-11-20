// app/api/auth/refresh/route.js
import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';

export async function POST(request) {
  console.log('=== REFRESH API CALLED ===');
  
  try {
    const cookieHeader = request.headers.get('cookie');
    console.log('All cookies:', cookieHeader);
    
    const refreshToken = getCookieValue(cookieHeader, 'refresh_token');
    console.log('Refresh token:', refreshToken ? 'exists' : 'missing');

    if (!refreshToken) {
      console.log('No refresh token found in cookies');
      return NextResponse.json(
        { error: 'No refresh token' },
        { status: 401 }
      );
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(refreshToken, secret);

    console.log('Refresh token valid for user:', payload.userId);

    const newAccessToken = await new SignJWT({ 
      userId: payload.userId,
      email: payload.email 
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m') // 15 minutes
      .sign(secret);

    console.log('New access token created');

    const response = NextResponse.json({ 
      success: true,
      message: 'Token refreshed successfully'
    });

    response.cookies.set({
      name: 'access_token',
      value: newAccessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 15 * 60, // 15 minutes
      path: '/',
    });

    console.log('New access token set in cookies');
    return response;

  } catch (error) {
    console.log('Refresh token verification failed:', error.message);
    return NextResponse.json(
      { error: 'Invalid refresh token' },
      { status: 401 }
    );
  }
}

// Helper function to get cookie value
function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;
  
  const cookies = cookieHeader.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return value;
  }
  return null;
}

// Optional: Also handle GET requests for testing
export async function GET(request) {
  return NextResponse.json({ 
    message: 'Refresh endpoint is working',
    method: 'GET'
  });
} 