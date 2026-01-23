// NextAuth Authentication Middleware
// Protects all routes (frontend and admin) with Azure AD SSO

import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Check admin role for /admin routes
    if (req.nextUrl.pathname.startsWith('/admin') && !req.nextauth.token?.isAdmin) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (NextAuth API routes - MUST be excluded!)
     * - auth/signin (custom sign-in page - MUST be excluded!)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (png, jpg, jpeg, svg)
     */
    '/((?!api/auth|auth/signin|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.svg$).*)',
  ],
};
