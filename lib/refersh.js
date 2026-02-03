import { NextResponse } from "next/server";

export async function refreshToken(request) {
  try {
    const refreshResponse = await fetch(
      new URL('/api/auth/refresh', request.url),
      {
        method: 'POST',
        headers: {
          Cookie: request.headers.get('cookie') || '',
        },
      }
    );

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
