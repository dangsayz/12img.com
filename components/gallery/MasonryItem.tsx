'use client'

import { useState, useCallback } from 'react'

interface Image {
  id: string
  signedUrl: string
}

interface MasonryItemProps {
  image: Image
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
      className="mb-2 break-inside-avoid cursor-pointer overflow-hidden rounded bg-gray-100"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`View image ${index + 1}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick()
        }
      }}
    >
      <img
        src={image.signedUrl}
        alt=""
        loading={index < 4 ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={handleLoad}
        className={`w-full h-auto transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
      {!loaded && <div className="aspect-square animate-pulse bg-gray-200" />}
    </div>
  )
}
