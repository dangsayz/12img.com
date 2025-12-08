'use client'

import { useState, useMemo } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Heart, Download, Share2, ShoppingCart, Search, User } from 'lucide-react'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  aspectRatio?: number
}

interface MosaicLayoutProps {
  images: GalleryImage[]
  galleryName: string
  sections?: string[]
  activeSection?: string
  photographerName?: string
  onImageClick?: (index: number) => void
  downloadEnabled?: boolean
}

export function MosaicLayout({ 
  images, 
  galleryName, 
  sections = ['GALLERY'],
  activeSection = 'GALLERY',
  photographerName,
  onImageClick,
  downloadEnabled = true 
}: MosaicLayoutProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Create mosaic pattern matching the Pic-Time style exactly
  // Pattern: 2 small left column, 1 large center, 2 small right column
  const mosaicRows = useMemo(() => {
    const rows: GalleryImage[][] = []
    let i = 0
    
    while (i < images.length) {
      // Each row has up to 7 images in the Pic-Time pattern
      const rowSize = Math.min(7, images.length - i)
      rows.push(images.slice(i, i + rowSize))
      i += rowSize
    }
    
    return rows
  }, [images])

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Exact Pic-Time style */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="max-w-[1800px] mx-auto px-6 h-14 flex items-center justify-between">
          {/* Left - Logo/Brand */}
          <div className="flex items-center gap-8">
            {photographerName && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-stone-900 flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {photographerName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Center - Section Tabs */}
          <nav className="flex items-center gap-8">
            {sections.map((section) => (
              <button
                key={section}
                className={`text-xs tracking-[0.15em] py-4 border-b-2 transition-colors ${
                  activeSection === section
                    ? 'text-stone-900 border-stone-900'
                    : 'text-stone-400 border-transparent hover:text-stone-600'
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
          
          {/* Right - Actions */}
          <div className="flex items-center gap-1">
            <button className="p-2.5 hover:bg-stone-100 transition-colors">
              <Download className="w-5 h-5 text-stone-500" />
            </button>
            <button className="p-2.5 hover:bg-stone-100 transition-colors">
              <Search className="w-5 h-5 text-stone-500" />
            </button>
            <button className="p-2.5 hover:bg-stone-100 transition-colors">
              <Share2 className="w-5 h-5 text-stone-500" />
            </button>
            <button className="p-2.5 hover:bg-stone-100 transition-colors">
              <Heart className="w-5 h-5 text-stone-500" />
            </button>
            <button className="p-2.5 hover:bg-stone-100 transition-colors">
              <ShoppingCart className="w-5 h-5 text-stone-500" />
            </button>
            <button className="p-2.5 hover:bg-stone-100 transition-colors flex items-center gap-2">
              <User className="w-5 h-5 text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Mosaic Grid - Pic-Time exact layout */}
      <div className="p-1">
        {mosaicRows.map((row, rowIndex) => {
          // Determine layout pattern based on row
          const pattern = rowIndex % 2 === 0 ? 'hero-center' : 'hero-left'
          
          return (
            <div 
              key={rowIndex} 
              className="grid gap-1 mb-1"
              style={{
                gridTemplateColumns: row.length >= 5 
                  ? '1fr 1fr 2fr 1fr 1fr' 
                  : row.length >= 3 
                    ? '1fr 2fr 1fr'
                    : 'repeat(2, 1fr)',
                gridTemplateRows: row.length >= 5 
                  ? 'repeat(2, 1fr)' 
                  : '1fr',
                minHeight: row.length >= 5 ? '500px' : '300px',
              }}
            >
              {row.map((image, imageIndex) => {
                const globalIndex = mosaicRows.slice(0, rowIndex).reduce((acc, r) => acc + r.length, 0) + imageIndex
                
                // Determine grid position based on Pic-Time pattern
                let gridStyles: React.CSSProperties = {}
                
                if (row.length >= 5) {
                  // 7-image pattern: 2 left stacked, 1 center large, 2 right stacked, 2 bottom
                  if (imageIndex === 0) {
                    gridStyles = { gridColumn: '1', gridRow: '1' }
                  } else if (imageIndex === 1) {
                    gridStyles = { gridColumn: '1', gridRow: '2' }
                  } else if (imageIndex === 2) {
                    gridStyles = { gridColumn: '2', gridRow: '1' }
                  } else if (imageIndex === 3) {
                    // Hero center
                    gridStyles = { gridColumn: '3', gridRow: '1 / 3' }
                  } else if (imageIndex === 4) {
                    gridStyles = { gridColumn: '4', gridRow: '1' }
                  } else if (imageIndex === 5) {
                    gridStyles = { gridColumn: '5', gridRow: '1' }
                  } else if (imageIndex === 6) {
                    gridStyles = { gridColumn: '4 / 6', gridRow: '2' }
                  }
                } else if (row.length >= 3) {
                  if (imageIndex === 1) {
                    gridStyles = { gridColumn: '2', gridRow: '1' }
                  }
                }
                
                const isHero = (row.length >= 5 && imageIndex === 3) || (row.length === 3 && imageIndex === 1)
                
                return (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: globalIndex * 0.02, duration: 0.3 }}
                    className="relative bg-stone-100 cursor-pointer group overflow-hidden"
                    style={gridStyles}
                    onMouseEnter={() => setHoveredId(image.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() => onImageClick?.(globalIndex)}
                  >
                    <Image
                      src={image.thumbnailUrl || image.previewUrl}
                      alt=""
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      sizes={isHero ? '40vw' : '20vw'}
                    />
                    
                    {/* Hover Actions - Pic-Time style */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredId === image.id ? 1 : 0 }}
                      className="absolute inset-0 bg-black/20"
                    >
                      {/* Top right corner actions */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1">
                        <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                          <Heart className="w-4 h-4 text-stone-600" />
                        </button>
                        <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                          <Share2 className="w-4 h-4 text-stone-600" />
                        </button>
                      </div>
                      
                      {/* Bottom actions */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                            <Heart className="w-4 h-4 text-stone-600" />
                          </button>
                          {downloadEnabled && (
                            <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                              <Download className="w-4 h-4 text-stone-600" />
                            </button>
                          )}
                          <button className="w-8 h-8 bg-white/90 flex items-center justify-center hover:bg-white transition-colors">
                            <Share2 className="w-4 h-4 text-stone-600" />
                          </button>
                        </div>
                        
                        {/* Buy button */}
                        <button className="px-3 py-1.5 bg-white/90 hover:bg-white text-xs text-stone-700 flex items-center gap-1.5 transition-colors">
                          Buy
                          <ShoppingCart className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
