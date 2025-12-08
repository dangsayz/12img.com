import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

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
  '/api/share/(.*)',
  '/api/demo-card',
  '/api/webhook/clerk',
  '/api/gallery/unlock',
  '/api/track/(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}
