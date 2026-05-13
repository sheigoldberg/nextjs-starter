import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

import type { UserRole } from '@prisma/client';

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (pathname.startsWith('/admin')) {
    const userRole = token.role as UserRole;
    if (!(['ADMIN', 'SUPER_ADMIN'] as UserRole[]).includes(userRole)) {
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
