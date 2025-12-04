import { NextRequest, NextResponse } from "next/server"
import { stackApp } from "@/lib/stack"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public")
  ) {
    return NextResponse.next()
  }

  // Protected routes under /app
  if (pathname.startsWith("/app")) {
    try {
      const user = await stackApp.getUser()
      
      if (!user) {
        const signInUrl = new URL("/auth/signin", request.url)
        signInUrl.searchParams.set("redirect", pathname)
        return NextResponse.redirect(signInUrl)
      }
    } catch (error) {
      // If session check fails, redirect to sign in
      const signInUrl = new URL("/auth/signin", request.url)
      signInUrl.searchParams.set("redirect", pathname)
      return NextResponse.redirect(signInUrl)
    }
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
