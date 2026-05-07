import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin')) {
    const userRole = token.role as string;
    if (!['ADMIN', 'SUPER_ADMIN'].includes(userRole)) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-user-role', String(token.role) || 'USER');
  requestHeaders.set('x-user-id', token.sub || '');

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*', '/profile/:path*'],
};
