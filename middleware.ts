import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'uniconnect_super_secret_jwt_key_2026_dev_secure_change_in_production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public assets, PWA manifest, service worker, offline page, favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname === '/sw.js' ||
    pathname === '/offline' ||
    pathname === '/manifest.webmanifest'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get('uniconnect_token')?.value;
  let sessionPayload: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      sessionPayload = payload;
    } catch {
      sessionPayload = null;
    }
  }

  const isAuthRoute = pathname === '/login';
  const isAdminRoute = pathname.startsWith('/admin');
  const isTeacherRoute = pathname.startsWith('/teacher');
  const isStudentRoute = pathname.startsWith('/student');

  // If already authenticated and trying to access /login, redirect to their home
  if (isAuthRoute && sessionPayload) {
    const role = sessionPayload.role;
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
    return NextResponse.redirect(new URL('/student', request.url));
  }

  // If root '/', redirect based on session or to /login
  if (pathname === '/') {
    if (!sessionPayload) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const role = sessionPayload.role;
    if (role === 'admin') return NextResponse.redirect(new URL('/admin', request.url));
    if (role === 'teacher') return NextResponse.redirect(new URL('/teacher', request.url));
    return NextResponse.redirect(new URL('/student', request.url));
  }

  // Protected role routes
  if (isAdminRoute || isTeacherRoute || isStudentRoute) {
    if (!sessionPayload) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const role = sessionPayload.role;

    if (isAdminRoute && role !== 'admin') {
      return NextResponse.redirect(new URL(role === 'teacher' ? '/teacher' : '/student', request.url));
    }

    if (isTeacherRoute && role !== 'teacher') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/student', request.url));
    }

    if (isStudentRoute && role !== 'student') {
      return NextResponse.redirect(new URL(role === 'admin' ? '/admin' : '/teacher', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
