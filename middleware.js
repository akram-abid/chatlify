import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request) {
  const token = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  console.log('Access token:', token ? 'exists' : 'missing');
  console.log('Refresh token:', refreshToken ? 'exists' : 'missing');

  if (!token && !refreshToken) {
    return NextResponse.redirect(new URL('/signin', request.url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    await jwtVerify(token, secret);
    
    return NextResponse.next();
  } catch (error) {
    console.log('Token verification error:', error.code);
    
    if ((error.code === 'ERR_JWT_EXPIRED' || error.code === 'ERR_JWS_INVALID') && refreshToken) {
      console.log('Attempting token refresh...');
      
      try {
        const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url), {
          method: 'POST',
          headers: {
            'Cookie': request.headers.get('cookie') || '',
          },
        });

        if (refreshResponse.ok) {
          const setCookieHeader = refreshResponse.headers.get('set-cookie');
          
          if (setCookieHeader) {
            const response = NextResponse.next();
            response.headers.set('set-cookie', setCookieHeader);
            return response;
          }
        }
        
        //console.log('Refresh failed, redirecting to signin');
        //return NextResponse.redirect(new URL('/signin', request.url));
        
      } catch (refreshError) {
        console.log('Refresh error:', refreshError);
        return NextResponse.redirect(new URL('/signin', request.url));
      }
    }
    
    return NextResponse.redirect(new URL('/signin', request.url));
  }
}

export const config = {
  matcher: ['/'],
};