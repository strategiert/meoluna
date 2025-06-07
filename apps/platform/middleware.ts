import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || ''
  const url = request.nextUrl

  // Development environment handling
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next()
  }

  // Main domain (meoluna.com) - serve platform app
  if (hostname === 'meoluna.com' || hostname === 'www.meoluna.com') {
    return NextResponse.next()
  }

  // Subdomain detected - this should be handled by the world app
  // In production, this middleware runs on the platform app
  // but we redirect to the world app deployment
  const subdomain = hostname.replace('.meoluna.com', '')
  
  if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
    // In development, rewrite to world app
    if (process.env.NODE_ENV === 'development') {
      const worldUrl = new URL(`http://localhost:3001/world/${subdomain}${url.pathname}${url.search}`)
      return NextResponse.rewrite(worldUrl)
    }
    
    // In production, each subdomain has its own deployment
    // This middleware shouldn't be reached for subdomains
    return NextResponse.next()
  }

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