import { NextRequest, NextResponse } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes - allow all API routes
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next()
  }

  // Protected routes under /app or /dashboard
  // Neon Auth JWT validation happens at the database level
  // This middleware just ensures routes are accessible
  if (pathname.startsWith("/app") || pathname.startsWith("/dashboard")) {
    // JWT validation is handled by Neon Data API
    // RLS policies enforce user isolation at database level
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
