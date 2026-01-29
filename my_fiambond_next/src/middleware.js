import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // 1. Get the token or session from cookies
  // Note: You must set this cookie when the user logs in via Firebase
  const session = request.cookies.get('session');

  // 2. Protect Admin Routes
  if (pathname.startsWith('/admin')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 3. Protect App/Dashboard Routes
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/realm')) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

// Only run middleware on these paths
export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/realm/:path*'],
};