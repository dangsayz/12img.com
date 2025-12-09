'use client'

import { usePathname } from 'next/navigation'
import { Footer } from './Footer'

/**
 * Conditionally renders the Footer based on the current route.
 * Hidden on admin pages and other full-screen experiences.
 */
export function ConditionalFooter() {
  const pathname = usePathname()
  
  // Routes where footer should be hidden
  const hideFooterRoutes = [
    '/admin',
    '/portal',
    '/view-reel',
    '/view-live',
  ]
  
  // Also hide on landing page (has its own footer)
  const isLandingPage = pathname === '/'
  
  // Check if current path starts with any of the hide routes
  const shouldHide = hideFooterRoutes.some(route => pathname.startsWith(route)) || isLandingPage
  
  if (shouldHide) {
    return null
  }
  
  return <Footer />
}
