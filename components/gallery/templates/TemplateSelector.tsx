'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import Image from 'next/image'
import { GALLERY_TEMPLATES, type GalleryTemplate } from './index'

// Apple-style easing
const EASE = [0.22, 1, 0.36, 1] as const

interface TemplateSelectorProps {
  selected: GalleryTemplate
  onSelect: (template: GalleryTemplate) => void
}

// Real showcase images for previews
const PREVIEW_IMAGES = {
  img1: '/images/showcase/MitchellexJohnWedding-102.jpg',
  img2: '/images/showcase/MitchellexJohnWedding-107.jpg',
  img3: '/images/showcase/MitchellexJohnWedding-112.jpg',
  img4: '/images/showcase/MitchellexJohnWedding-170.jpg',
  img5: '/images/showcase/MitchellexJohnWedding-251.jpg',
  img6: '/images/showcase/MitchellexJohnWedding-358.jpg',
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<GalleryTemplate | null>(null)
  
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {GALLERY_TEMPLATES.map((template) => {
          const isSelected = selected === template.id
          const isHovered = hoveredTemplate === template.id
          
          return (
            <motion.button
              key={template.id}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(template.id)}
              className={`
                relative text-left transition-all duration-300 group
                ${isSelected 
                  ? 'ring-2 ring-stone-900 ring-offset-2' 
                  : 'ring-1 ring-stone-200 hover:ring-stone-300'
                }
              `}
            >
              {/* Preview Container */}
              <div className={`
                aspect-[4/3] overflow-hidden relative
                ${template.id === 'cinematic' ? 'bg-stone-900' : 'bg-white'}
              `}>
                {/* Mosaic Preview - Dynamic collage with real images */}
                {template.id === 'mosaic' && (
                  <div className="absolute inset-0 p-1.5">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-0.5">
                      <div className="relative overflow-hidden">
                        <Image 
                          src={PREVIEW_IMAGES.img1} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="relative overflow-hidden col-span-2 row-span-2">
                        <Image 
                          src={PREVIEW_IMAGES.img2} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="relative overflow-hidden">
                        <Image 
                          src={PREVIEW_IMAGES.img3} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Clean Grid Preview - Uniform grid */}
                {template.id === 'clean-grid' && (
                  <div className="absolute inset-0 p-2">
                    <div className="w-full h-full grid grid-cols-3 grid-rows-2 gap-1">
                      {[PREVIEW_IMAGES.img1, PREVIEW_IMAGES.img2, PREVIEW_IMAGES.img3, 
                        PREVIEW_IMAGES.img4, PREVIEW_IMAGES.img5, PREVIEW_IMAGES.img6].map((src, i) => (
                        <div key={i} className="relative overflow-hidden bg-stone-100">
                          <Image 
                            src={src} 
                            alt="" 
                            fill 
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cinematic Preview - Dark, moody, letterboxed */}
                {template.id === 'cinematic' && (
                  <div className="absolute inset-0 flex flex-col">
                    {/* Top letterbox */}
                    <div className="h-3 bg-black" />
                    {/* Main content */}
                    <div className="flex-1 relative overflow-hidden">
                      <Image 
                        src={PREVIEW_IMAGES.img2} 
                        alt="" 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: 'contrast(1.1) saturate(0.9)' }}
                      />
                      {/* Vignette overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />
                    </div>
                    {/* Bottom letterbox */}
                    <div className="h-3 bg-black" />
                  </div>
                )}

                {/* Editorial Preview - Magazine spread layout */}
                {template.id === 'editorial' && (
                  <div className="absolute inset-0 p-2 flex flex-col gap-1.5">
                    {/* Hero image */}
                    <div className="relative overflow-hidden flex-1">
                      <Image 
                        src={PREVIEW_IMAGES.img4} 
                        alt="" 
                        fill 
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    {/* Text line simulation */}
                    <div className="h-0.5 w-1/4 bg-stone-200 mx-auto" />
                    {/* Two-up spread */}
                    <div className="flex gap-1 h-8">
                      <div className="relative overflow-hidden flex-1">
                        <Image 
                          src={PREVIEW_IMAGES.img5} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="relative overflow-hidden flex-1">
                        <Image 
                          src={PREVIEW_IMAGES.img6} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected indicator */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.2, ease: EASE }}
                      className="absolute top-2 right-2 w-5 h-5 bg-stone-900 flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover overlay with template name */}
                <motion.div 
                  initial={false}
                  animate={{ opacity: isHovered && !isSelected ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none"
                >
                  <span className="text-white text-[11px] font-medium tracking-[0.1em] uppercase">
                    Preview
                  </span>
                </motion.div>
              </div>

              {/* Template Label */}
              <div className={`
                py-2.5 px-3 border-t transition-colors duration-300
                ${template.id === 'cinematic' ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-100'}
                ${isSelected ? 'bg-stone-50' : ''}
              `}>
                <div className="flex items-center justify-between">
                  <span className={`
                    text-[12px] font-medium tracking-[0.02em]
                    ${template.id === 'cinematic' && !isSelected ? 'text-white' : 'text-stone-900'}
                  `}>
                    {template.name}
                  </span>
                  {template.isDefault && (
                    <span className="text-[9px] tracking-[0.1em] uppercase text-stone-400 bg-stone-100 px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Selected template description */}
      <AnimatePresence mode="wait">
        <motion.p
          key={selected}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="text-[11px] text-stone-400 text-center tracking-[0.02em]"
        >
          {GALLERY_TEMPLATES.find(t => t.id === selected)?.description}
        </motion.p>
      </AnimatePresence>
    </div>
  )
}
