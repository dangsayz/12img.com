'use client'

import { useEffect, useRef } from 'react'

interface GalleryViewTrackerProps {
  galleryId: string
}

/**
 * Invisible component that tracks gallery views.
 * Fires once per page load with deduplication handled server-side.
 */
export function GalleryViewTracker({ galleryId }: GalleryViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    if (tracked.current) return
    tracked.current = true

    // Track the view via POST request
    fetch(`/api/track/view/${galleryId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Don't block on response
      keepalive: true
    }).catch(() => {
      // Silently fail - analytics should never break UX
    })
  }, [galleryId])

  // Render nothing - this is a tracking-only component
  return null
}
