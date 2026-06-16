import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const role = request.cookies.get('role')?.value;
  const { pathname } = request.nextUrl;

  // Jika user sudah login (ada cookie token) dan mengakses halaman login atau root
  if (token) {
    // Redirect dari /login ke dashboard/kepsek berdasarkan role
    if (pathname === '/login') {
      const redirectUrl = role === 'kepsek' ? '/kepsek' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }

    // Redirect dari root "/" ke dashboard/kepsek berdasarkan role
    if (pathname === '/') {
      const redirectUrl = role === 'kepsek' ? '/kepsek' : '/dashboard';
      return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  // Jika user tidak login (tidak ada cookie token) dan mengakses halaman selain login & forgot-password
  if (!token) {
    const publicPaths = ['/login', '/forgot-password'];
    if (!publicPaths.includes(pathname)) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};