import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher([
  '/',
  '/demo',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/onboarding',
  '/welcome',
  '/templates',
  '/view-reel/(.*)',
  '/view-live/(.*)',
  '/view-grid/(.*)',
  '/share',
  '/s/(.*)',
  '/card/(.*)',
  '/profiles',
  '/profile/(.*)',
  '/gallery/(.*)',
  '/portal/(.*)', // Client portal routes
  '/vendor/(.*)', // Vendor portal routes
  '/promo/(.*)', // Promo landing pages
  '/api/share/(.*)',
  '/api/promo/(.*)', // Promo API routes
  '/api/demo-card',
  '/api/webhook/clerk',
  '/api/gallery/unlock',
  '/api/track/(.*)',
  '/api/portal/(.*)', // Portal API routes
])

// Admin routes require additional server-side verification
const isAdminRoute = createRouteMatcher(['/admin(.*)'])

export default clerkMiddleware(async (auth, request) => {
  // Public routes - no auth required
  if (isPublicRoute(request)) {
    return NextResponse.next()
  }
  
  // All other routes require authentication
  await auth.protect()
  
  // Admin routes get additional protection at the layout level
  // The admin layout does a database check for admin role
  // This middleware just ensures they're authenticated first
  // The actual admin check happens server-side in app/admin/layout.tsx
  // via getAuthenticatedAdmin() which queries the database
  if (isAdminRoute(request)) {
    // User is authenticated (passed auth.protect above)
    // Admin role verification happens in the layout
    // This is intentional - we don't want to query DB in middleware
    // The layout will redirect non-admins to home
    return NextResponse.next()
  }
  
  return NextResponse.next()
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
