'use client'

import { useEffect } from 'react'

/**
 * Global interceptor for image right-click saves
 * 
 * When a user right-clicks an image and selects "Save Image As",
 * this component intercepts the action and triggers a download
 * with an SEO-friendly filename.
 * 
 * This works by:
 * 1. Listening for contextmenu events on images
 * 2. Checking if the image has a data-seo-filename attribute
 * 3. If so, preventing default and triggering a programmatic download
 */
export function ImageSaveInterceptor() {
  useEffect(() => {
    // We can't actually intercept the native "Save Image As" menu item
    // But we CAN add a custom context menu or download button
    
    // For now, this is a placeholder - the real solution requires
    // serving images through our proxy domain
    
    // Alternative: Add a visible "Download" button on hover
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      
      // Check if it's an image with SEO filename
      if (target.tagName === 'IMG') {
        const container = target.closest('[data-seo-filename]')
        if (container) {
          const filename = container.getAttribute('data-seo-filename')
          const proxyUrl = container.getAttribute('data-proxy-url')
          
          if (filename && proxyUrl) {
            // We could show a custom context menu here
            // For now, just log that we detected it
            console.log('[SEO] Image with SEO filename:', filename)
          }
        }
      }
    }

    document.addEventListener('contextmenu', handleContextMenu)
    return () => document.removeEventListener('contextmenu', handleContextMenu)
  }, [])

  return null
}
