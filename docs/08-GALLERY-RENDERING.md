# 8. Gallery Rendering Pipeline

## 8.1 Masonry Algorithm

### Algorithm Selection: CSS Columns

**Decision:** CSS `column-count` with JavaScript column calculation.

**Rationale:**
- Native browser layout performance
- No JavaScript layout calculations per item
- Responsive without resize event thrashing
- Simpler than virtual scrolling for typical gallery sizes (<500 images)

### Implementation

```typescript
// components/gallery/MasonryGrid.tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MasonryItem } from './MasonryItem'
import { FullscreenViewer } from './FullscreenViewer'

interface Image {
  id: string
  storage_path: string
  signedUrl: string
  width?: number
  height?: number
}

interface MasonryGridProps {
  images: Image[]
  editable?: boolean
}

const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

const COLUMNS_BY_BREAKPOINT = {
  default: 2,  // < 640px
  sm: 2,       // 640-767px
  md: 3,       // 768-1023px
  lg: 4,       // 1024-1279px
  xl: 5,       // >= 1280px
}

function getColumnCount(width: number): number {
  if (width >= BREAKPOINTS.xl) return COLUMNS_BY_BREAKPOINT.xl
  if (width >= BREAKPOINTS.lg) return COLUMNS_BY_BREAKPOINT.lg
  if (width >= BREAKPOINTS.md) return COLUMNS_BY_BREAKPOINT.md
  if (width >= BREAKPOINTS.sm) return COLUMNS_BY_BREAKPOINT.sm
  return COLUMNS_BY_BREAKPOINT.default
}

export function MasonryGrid({ images, editable = false }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(COLUMNS_BY_BREAKPOINT.default)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  
  // Calculate columns on mount and resize
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const observer = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width
      setColumns(getColumnCount(width))
    })
    
    observer.observe(container)
    
    // Initial calculation
    setColumns(getColumnCount(container.offsetWidth))
    
    return () => observer.disconnect()
  }, [])
  
  const handleImageClick = useCallback((index: number) => {
    setViewerIndex(index)
    setViewerOpen(true)
  }, [])
  
  const handleViewerClose = useCallback(() => {
    setViewerOpen(false)
  }, [])
  
  const handleViewerNavigate = useCallback((direction: 'prev' | 'next') => {
    setViewerIndex((current) => {
      if (direction === 'prev') {
        return current > 0 ? current - 1 : images.length - 1
      }
      return current < images.length - 1 ? current + 1 : 0
    })
  }, [images.length])
  
  return (
    <>
      <div
        ref={containerRef}
        className="masonry-grid"
        style={{
          columnCount: columns,
          columnGap: '1rem',
        }}
      >
        {images.map((image, index) => (
          <MasonryItem
            key={image.id}
            image={image}
            index={index}
            onClick={() => handleImageClick(index)}
            editable={editable}
          />
        ))}
      </div>
      
      {viewerOpen && (
        <FullscreenViewer
          images={images}
          currentIndex={viewerIndex}
          onClose={handleViewerClose}
          onNavigate={handleViewerNavigate}
        />
      )}
    </>
  )
}
```

### CSS Styles

```css
/* styles/masonry.css */
.masonry-grid {
  column-fill: balance;
}

.masonry-item {
  break-inside: avoid;
  margin-bottom: 1rem;
  cursor: pointer;
  overflow: hidden;
  border-radius: 0.25rem;
  background-color: #f3f4f6;
}

.masonry-item img {
  width: 100%;
  height: auto;
  display: block;
  transition: transform 0.2s ease;
}

.masonry-item:hover img {
  transform: scale(1.02);
}

/* Prevent orphans at bottom */
.masonry-grid::after {
  content: '';
  display: block;
  height: 0;
  break-inside: avoid;
}
```

## 8.2 Hydration Strategy

### Server/Client Boundary

```
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER (RSC)                                  │
│  app/g/[galleryId]/page.tsx                                     │
├─────────────────────────────────────────────────────────────────┤
│  - Fetch gallery metadata                                        │
│  - Fetch image records                                           │
│  - Generate signed URLs                                          │
│  - Check password protection                                     │
│  - Render static shell                                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Props: { images, signedUrls }
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT                                        │
│  MasonryGrid (hydrates)                                         │
├─────────────────────────────────────────────────────────────────┤
│  - ResizeObserver for column calculation                        │
│  - Click handlers for fullscreen viewer                         │
│  - State for viewer open/index                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Renders
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT                                        │
│  FullscreenViewer (lazy, portal)                                │
├─────────────────────────────────────────────────────────────────┤
│  - Touch/swipe gesture handling                                 │
│  - Keyboard navigation                                          │
│  - Pinch-to-zoom                                                │
│  - Body scroll lock                                             │
└─────────────────────────────────────────────────────────────────┘
```

### Hydration Optimization

```typescript
// components/gallery/MasonryItem.tsx
'use client'

import { useState, useCallback } from 'react'

interface MasonryItemProps {
  image: {
    id: string
    signedUrl: string
  }
  index: number
  onClick: () => void
  editable?: boolean
}

export function MasonryItem({ image, index, onClick, editable }: MasonryItemProps) {
  const [loaded, setLoaded] = useState(false)
  
  const handleLoad = useCallback(() => {
    setLoaded(true)
  }, [])
  
  return (
    <div
      className="masonry-item"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View image ${index + 1}`}
    >
      <img
        src={image.signedUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        className={loaded ? 'opacity-100' : 'opacity-0'}
        style={{ transition: 'opacity 0.3s ease' }}
      />
      {!loaded && (
        <div className="aspect-square bg-gray-100 animate-pulse" />
      )}
    </div>
  )
}
```

## 8.3 SSR → CSR Boundary

### Data Flow

```typescript
// app/g/[galleryId]/page.tsx (RSC - Server)
export default async function GalleryPage({ params }: Props) {
  // All data fetching happens on server
  const gallery = await getGalleryBySlug(params.galleryId)
  const images = await getGalleryImages(gallery.id)
  const signedUrls = await getSignedUrlsBatch(images.map(i => i.storage_path))
  
  // Serialize data for client
  const imagesWithUrls = images.map(img => ({
    id: img.id,
    signedUrl: signedUrls.get(img.storage_path) || '',
    width: img.width,
    height: img.height,
  }))
  
  // Hydration boundary
  return (
    <main>
      <GalleryHeader title={gallery.title} />
      {/* Client component receives serialized data */}
      <MasonryGrid images={imagesWithUrls} />
    </main>
  )
}
```

### Serialization Constraints

Only serializable data crosses the boundary:
- ✅ Strings, numbers, booleans
- ✅ Plain objects and arrays
- ❌ Functions
- ❌ Dates (serialize as ISO strings)
- ❌ Maps/Sets (convert to arrays/objects)

## 8.4 Suspense Boundaries

### Optimal Suspense Segmentation

```typescript
// app/g/[galleryId]/page.tsx
import { Suspense } from 'react'

export default async function GalleryPage({ params }: Props) {
  // Gallery metadata loads first (fast)
  const gallery = await getGalleryBySlug(params.galleryId)
  
  return (
    <main>
      {/* Header renders immediately */}
      <GalleryHeader title={gallery.title} />
      
      {/* Images load with suspense */}
      <Suspense fallback={<GalleryGridSkeleton />}>
        <GalleryImages galleryId={gallery.id} />
      </Suspense>
      
      {/* Download button loads after images */}
      {gallery.download_enabled && (
        <Suspense fallback={null}>
          <DownloadButton galleryId={gallery.id} />
        </Suspense>
      )}
    </main>
  )
}

// Separate async component for images
async function GalleryImages({ galleryId }: { galleryId: string }) {
  const images = await getGalleryImages(galleryId)
  const signedUrls = await getSignedUrlsBatch(images.map(i => i.storage_path))
  
  const imagesWithUrls = images.map(img => ({
    id: img.id,
    signedUrl: signedUrls.get(img.storage_path) || '',
    width: img.width,
    height: img.height,
  }))
  
  return <MasonryGrid images={imagesWithUrls} />
}
```

### Skeleton Component

```typescript
// components/gallery/GalleryGridSkeleton.tsx
export function GalleryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square bg-gray-100 rounded animate-pulse"
          style={{
            animationDelay: `${i * 50}ms`,
          }}
        />
      ))}
    </div>
  )
}
```

## 8.5 Preloading Logic

### Image Preloading Strategy

```typescript
// components/gallery/FullscreenViewer.tsx
'use client'

import { useEffect } from 'react'

// Preload adjacent images for smooth navigation
function useImagePreload(images: Image[], currentIndex: number) {
  useEffect(() => {
    const preloadIndices = [
      currentIndex - 1,
      currentIndex + 1,
      currentIndex + 2,
    ].filter(i => i >= 0 && i < images.length && i !== currentIndex)
    
    const preloadLinks: HTMLLinkElement[] = []
    
    for (const index of preloadIndices) {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.as = 'image'
      link.href = images[index].signedUrl
      document.head.appendChild(link)
      preloadLinks.push(link)
    }
    
    return () => {
      preloadLinks.forEach(link => link.remove())
    }
  }, [images, currentIndex])
}
```

### Intersection Observer for Lazy Loading

Native `loading="lazy"` is used, but for more control:

```typescript
// lib/hooks/use-lazy-load.ts
import { useEffect, useRef, useState } from 'react'

export function useLazyLoad(threshold = 0.1) {
  const ref = useRef<HTMLElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold }
    )
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [threshold])
  
  return { ref, isVisible }
}
```

## 8.6 Fullscreen Viewer Behavior

### Component Structure

```typescript
// components/gallery/FullscreenViewer.tsx
'use client'

import { useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSwipe } from '@/lib/hooks/use-swipe'
import { usePinchZoom } from '@/lib/hooks/use-pinch-zoom'
import { useBodyScrollLock } from '@/lib/hooks/use-body-scroll-lock'

interface FullscreenViewerProps {
  images: Image[]
  currentIndex: number
  onClose: () => void
  onNavigate: (direction: 'prev' | 'next') => void
}

export function FullscreenViewer({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: FullscreenViewerProps) {
  const [mounted, setMounted] = useState(false)
  const currentImage = images[currentIndex]
  
  // Lock body scroll
  useBodyScrollLock()
  
  // Swipe handling
  const { handlers: swipeHandlers } = useSwipe({
    onSwipeLeft: () => onNavigate('next'),
    onSwipeRight: () => onNavigate('prev'),
    threshold: 50,
  })
  
  // Pinch zoom
  const { scale, handlers: zoomHandlers, reset: resetZoom } = usePinchZoom({
    minScale: 1,
    maxScale: 4,
  })
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'ArrowLeft':
          onNavigate('prev')
          resetZoom()
          break
        case 'ArrowRight':
          onNavigate('next')
          resetZoom()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose, onNavigate, resetZoom])
  
  // Portal mount
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) return null
  
  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black"
      {...swipeHandlers}
      {...zoomHandlers}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white"
        aria-label="Close viewer"
      >
        <XIcon className="w-6 h-6" />
      </button>
      
      {/* Navigation arrows (desktop) */}
      <button
        onClick={() => onNavigate('prev')}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white hidden md:block"
        aria-label="Previous image"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      
      <button
        onClick={() => onNavigate('next')}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white hidden md:block"
        aria-label="Next image"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>
      
      {/* Image container */}
      <div className="flex items-center justify-center w-full h-full">
        <img
          src={currentImage.signedUrl}
          alt=""
          className="max-w-full max-h-full object-contain"
          style={{
            transform: `scale(${scale})`,
            transition: scale === 1 ? 'transform 0.2s ease' : 'none',
          }}
          draggable={false}
        />
      </div>
      
      {/* Image counter */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
        {currentIndex + 1} / {images.length}
      </div>
    </div>,
    document.body
  )
}
```

## 8.7 Gesture Event Mapping

### Swipe Detection

```typescript
// lib/hooks/use-swipe.ts
import { useRef, useCallback } from 'react'

interface SwipeConfig {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  threshold?: number
}

export function useSwipe(config: SwipeConfig) {
  const { threshold = 50 } = config
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    }
  }, [])
  
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return
    
    const deltaX = e.changedTouches[0].clientX - touchStart.current.x
    const deltaY = e.changedTouches[0].clientY - touchStart.current.y
    
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)
    
    // Determine primary direction
    if (absX > absY && absX > threshold) {
      if (deltaX > 0) {
        config.onSwipeRight?.()
      } else {
        config.onSwipeLeft?.()
      }
    } else if (absY > absX && absY > threshold) {
      if (deltaY > 0) {
        config.onSwipeDown?.()
      } else {
        config.onSwipeUp?.()
      }
    }
    
    touchStart.current = null
  }, [config, threshold])
  
  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  }
}
```

### Pinch-to-Zoom

```typescript
// lib/hooks/use-pinch-zoom.ts
import { useState, useRef, useCallback } from 'react'

interface PinchZoomConfig {
  minScale?: number
  maxScale?: number
}

export function usePinchZoom(config: PinchZoomConfig = {}) {
  const { minScale = 1, maxScale = 4 } = config
  const [scale, setScale] = useState(1)
  const initialDistance = useRef<number | null>(null)
  const initialScale = useRef(1)
  
  const getDistance = (touches: React.TouchList): number => {
    const [t1, t2] = [touches[0], touches[1]]
    return Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY)
  }
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistance.current = getDistance(e.touches)
      initialScale.current = scale
    }
  }, [scale])
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialDistance.current) {
      const currentDistance = getDistance(e.touches)
      const scaleChange = currentDistance / initialDistance.current
      const newScale = Math.min(
        maxScale,
        Math.max(minScale, initialScale.current * scaleChange)
      )
      setScale(newScale)
    }
  }, [minScale, maxScale])
  
  const handleTouchEnd = useCallback(() => {
    initialDistance.current = null
  }, [])
  
  const reset = useCallback(() => {
    setScale(1)
  }, [])
  
  // Double-tap to zoom
  const lastTap = useRef<number>(0)
  const handleDoubleTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    if (now - lastTap.current < 300) {
      // Double tap detected
      setScale(s => s === 1 ? 2 : 1)
    }
    lastTap.current = now
  }, [])
  
  return {
    scale,
    reset,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onClick: handleDoubleTap,
    },
  }
}
```

## 8.8 Throttling/Debouncing Requirements

### Resize Observer Throttling

```typescript
// lib/hooks/use-throttled-resize.ts
import { useEffect, useRef, useState } from 'react'

export function useThrottledResize(
  ref: React.RefObject<HTMLElement>,
  delay: number = 100
) {
  const [size, setSize] = useState({ width: 0, height: 0 })
  const timeoutRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    const element = ref.current
    if (!element) return
    
    const observer = new ResizeObserver((entries) => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      // Throttle updates
      timeoutRef.current = setTimeout(() => {
        const { width, height } = entries[0].contentRect
        setSize({ width, height })
      }, delay)
    })
    
    observer.observe(element)
    
    return () => {
      observer.disconnect()
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [ref, delay])
  
  return size
}
```

### Scroll Event Throttling

Not needed - using native `loading="lazy"` and CSS columns.

### Touch Event Throttling

```typescript
// Pinch zoom move events are naturally throttled by requestAnimationFrame
const handleTouchMove = useCallback((e: React.TouchEvent) => {
  if (rafRef.current) return // Skip if frame pending
  
  rafRef.current = requestAnimationFrame(() => {
    // Process touch move
    rafRef.current = null
  })
}, [])
```

## 8.9 Body Scroll Lock

```typescript
// lib/hooks/use-body-scroll-lock.ts
import { useEffect } from 'react'

export function useBodyScrollLock() {
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow
    const scrollY = window.scrollY
    
    // Lock scroll
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    
    return () => {
      // Restore scroll
      document.body.style.overflow = originalStyle
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.width = ''
      window.scrollTo(0, scrollY)
    }
  }, [])
}
```
