import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the path of the request
  const path = request.nextUrl.pathname

  // Define which paths are protected (require authentication)
  const isProtectedPath =
    path !== "/login" &&
    path !== "/register" &&
    path !== "/reset-password" &&
    !path.startsWith("/_next") &&
    !path.startsWith("/api/auth") &&
    !path.includes("favicon.ico") &&
    !path.startsWith("/public")

  // Check for Supabase auth cookies - they use different naming patterns
  const supabaseAuthCookies = ["sb-access-token", "sb-refresh-token", "supabase-auth-token", "auth-token"]

  // Check if any of the possible auth cookies exist
  const hasAuthCookie = supabaseAuthCookies.some((cookieName) => {
    return request.cookies.has(cookieName)
  })

  // Log all cookies for debugging
  const allCookies = [...request.cookies.keys()]
  console.log("Path:", path, "isProtected:", isProtectedPath, "hasAuthCookie:", hasAuthCookie, "Cookies:", allCookies)

  // If the path is protected and there's no auth cookie, redirect to login
  if (isProtectedPath && !hasAuthCookie) {
    // Check for auth-backup in localStorage - but we can't access localStorage in middleware
    // So we'll rely on client-side protection as a backup

    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", encodeURI(request.url))
    return NextResponse.redirect(url)
  }

  // If the path is login and there's an auth cookie, redirect to home
  if (path === "/login" && hasAuthCookie) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
}
