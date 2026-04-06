import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicRoutes = [
  '/login', '/register', '/forgot-password', '/reset-password',
  '/admin/login', '/pos/login', '/shipper/login',
];

const protectedPrefixes = ['/admin', '/pos', '/shipper', '/account', '/orders', '/checkout', '/reviews', '/wishlist'];

function getLoginUrl(pathname: string): string {
  if (pathname.startsWith('/admin')) return '/admin/login';
  if (pathname.startsWith('/pos')) return '/pos/login';
  if (pathname.startsWith('/shipper')) return '/shipper/login';
  return '/login';
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — allow through
  if (publicRoutes.some((route) => pathname === route)) {
    return NextResponse.next();
  }

  // Not a protected route — allow through
  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = new URL(getLoginUrl(pathname), request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userRole: string = payload.role;

    // Role-based access control
    if (pathname.startsWith('/admin') && !['admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/pos') && !['staff', 'admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    if (pathname.startsWith('/shipper') && userRole !== 'shipper') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Already logged in and visiting login page — redirect to dashboard
    if (pathname === '/admin/login' && ['admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/admin', request.url));
    }
    if (pathname === '/pos/login' && ['staff', 'admin', 'manager'].includes(userRole)) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    if (pathname === '/shipper/login' && userRole === 'shipper') {
      return NextResponse.redirect(new URL('/shipper', request.url));
    }

    return NextResponse.next();
  } catch {
    const loginUrl = new URL(getLoginUrl(pathname), request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|images|manifest\\.json|sw\\.js).*)'],
};
