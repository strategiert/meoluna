import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Since we're now using path-based routing (/world/[slug]) instead of subdomains,
  // we can simplify the middleware significantly
  
  // All requests are handled by the platform app now
  // /world/[slug] routes are handled by Next.js dynamic routing
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}