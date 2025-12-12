'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { GALLERY_TEMPLATES, type GalleryTemplate } from './index'

// Apple-style easing
const EASE = [0.22, 1, 0.36, 1] as const

interface TemplateSelectorProps {
  selected: GalleryTemplate
  onSelect: (template: GalleryTemplate) => void
  compact?: boolean
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

// Template metadata for rich previews
const TEMPLATE_META: Record<GalleryTemplate, { 
  tagline: string
  gradient: string
  accent: string
}> = {
  'mosaic': {
    tagline: 'Dynamic & Artistic',
    gradient: 'from-amber-500/20 via-orange-500/10 to-rose-500/20',
    accent: 'bg-amber-500',
  },
  'clean-grid': {
    tagline: 'Minimal & Modern',
    gradient: 'from-stone-500/10 via-stone-400/5 to-stone-500/10',
    accent: 'bg-stone-900',
  },
  'cinematic': {
    tagline: 'Dark & Dramatic',
    gradient: 'from-slate-900/40 via-slate-800/20 to-slate-900/40',
    accent: 'bg-slate-700',
  },
  'editorial': {
    tagline: 'Magazine Style',
    gradient: 'from-violet-500/15 via-purple-500/10 to-indigo-500/15',
    accent: 'bg-violet-600',
  },
}

export function TemplateSelector({ selected, onSelect, compact = false }: TemplateSelectorProps) {
  const [hoveredTemplate, setHoveredTemplate] = useState<GalleryTemplate | null>(null)
  
  return (
    <div className="space-y-6">
      {/* Template Grid - responsive 2 cols on mobile, adapts on larger */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {GALLERY_TEMPLATES.map((template) => {
          const isSelected = selected === template.id
          const isHovered = hoveredTemplate === template.id
          const meta = TEMPLATE_META[template.id]
          const isDark = template.id === 'cinematic'
          
          return (
            <motion.button
              key={template.id}
              onMouseEnter={() => setHoveredTemplate(template.id)}
              onMouseLeave={() => setHoveredTemplate(null)}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(template.id)}
              className={`
                relative text-left transition-all duration-300 group rounded-xl overflow-hidden
                ${isSelected 
                  ? 'ring-2 ring-stone-900 ring-offset-2 shadow-lg' 
                  : 'ring-1 ring-stone-200/80 hover:ring-stone-300 hover:shadow-md'
                }
              `}
            >
              {/* Gradient glow on hover */}
              <div className={`
                absolute -inset-1 bg-gradient-to-br ${meta.gradient} rounded-xl opacity-0 
                group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10
              `} />

              {/* Preview Container */}
              <div className={`
                aspect-[3/4] overflow-hidden relative
                ${isDark ? 'bg-stone-900' : 'bg-stone-50'}
              `}>
                {/* Mosaic Preview - Dynamic asymmetric collage */}
                {template.id === 'mosaic' && (
                  <div className="absolute inset-0 p-2">
                    <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-1">
                      <div className="relative overflow-hidden rounded-sm row-span-2">
                        <Image 
                          src={PREVIEW_IMAGES.img1} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="relative overflow-hidden rounded-sm">
                        <Image 
                          src={PREVIEW_IMAGES.img2} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="relative overflow-hidden rounded-sm">
                        <Image 
                          src={PREVIEW_IMAGES.img3} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="relative overflow-hidden rounded-sm col-span-2">
                        <Image 
                          src={PREVIEW_IMAGES.img4} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Clean Grid Preview - Perfect uniform squares */}
                {template.id === 'clean-grid' && (
                  <div className="absolute inset-0 p-3 bg-white">
                    <div className="w-full h-full grid grid-cols-2 grid-rows-3 gap-1.5">
                      {[PREVIEW_IMAGES.img1, PREVIEW_IMAGES.img2, PREVIEW_IMAGES.img3, 
                        PREVIEW_IMAGES.img4, PREVIEW_IMAGES.img5, PREVIEW_IMAGES.img6].map((src, i) => (
                        <div key={i} className="relative overflow-hidden bg-stone-100 rounded-[2px]">
                          <Image 
                            src={src} 
                            alt="" 
                            fill 
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Cinematic Preview - Dark, moody, letterboxed with film grain */}
                {template.id === 'cinematic' && (
                  <div className="absolute inset-0 flex flex-col bg-black">
                    <div className="h-4 bg-black" />
                    <div className="flex-1 relative overflow-hidden">
                      <Image 
                        src={PREVIEW_IMAGES.img2} 
                        alt="" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                        style={{ filter: 'contrast(1.15) saturate(0.85)' }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />
                      {/* Film grain texture overlay */}
                      <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJhIiB4PSIwIiB5PSIwIj48ZmVUdXJidWxlbmNlIGJhc2VGcmVxdWVuY3k9Ii43NSIgc3RpdGNoVGlsZXM9InN0aXRjaCIgdHlwZT0iZnJhY3RhbE5vaXNlIi8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsdGVyPSJ1cmwoI2EpIi8+PC9zdmc+')]" />
                    </div>
                    <div className="h-4 bg-black" />
                  </div>
                )}

                {/* Editorial Preview - Magazine spread with typography hint */}
                {template.id === 'editorial' && (
                  <div className="absolute inset-0 p-2.5 flex flex-col gap-2 bg-white">
                    <div className="relative overflow-hidden flex-1 rounded-sm">
                      <Image 
                        src={PREVIEW_IMAGES.img4} 
                        alt="" 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    {/* Typography simulation */}
                    <div className="space-y-1 px-1">
                      <div className="h-1 w-3/4 bg-stone-200 rounded-full" />
                      <div className="h-0.5 w-1/2 bg-stone-100 rounded-full" />
                    </div>
                    <div className="flex gap-1.5 h-12">
                      <div className="relative overflow-hidden flex-1 rounded-sm">
                        <Image 
                          src={PREVIEW_IMAGES.img5} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="relative overflow-hidden flex-1 rounded-sm">
                        <Image 
                          src={PREVIEW_IMAGES.img6} 
                          alt="" 
                          fill 
                          className="object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Selected checkmark - premium circular design */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      className={`
                        absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center
                        ${isDark ? 'bg-white' : 'bg-stone-900'}
                        shadow-lg
                      `}
                    >
                      <Check className={`w-3.5 h-3.5 ${isDark ? 'text-stone-900' : 'text-white'}`} strokeWidth={3} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Hover shimmer effect */}
                <motion.div 
                  initial={false}
                  animate={{ 
                    opacity: isHovered ? 1 : 0,
                    x: isHovered ? '100%' : '-100%'
                  }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
                />
              </div>

              {/* Template Label - Enhanced with tagline */}
              <div className={`
                py-3 px-3.5 transition-colors duration-300
                ${isDark ? 'bg-stone-900' : 'bg-white'}
              `}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`
                        text-[13px] font-semibold tracking-tight
                        ${isDark ? 'text-white' : 'text-stone-900'}
                      `}>
                        {template.name}
                      </span>
                      {template.isDefault && (
                        <span className="flex items-center gap-0.5 text-[9px] font-medium tracking-wide uppercase text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded-full">
                          <Sparkles className="w-2.5 h-2.5" />
                          Default
                        </span>
                      )}
                    </div>
                    <p className={`
                      text-[10px] tracking-wide mt-0.5
                      ${isDark ? 'text-stone-400' : 'text-stone-500'}
                    `}>
                      {meta.tagline}
                    </p>
                  </div>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Selected template description - Enhanced */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: EASE }}
          className="text-center space-y-1"
        >
          <p className="text-sm text-stone-600 font-medium">
            {GALLERY_TEMPLATES.find(t => t.id === selected)?.description}
          </p>
          <p className="text-xs text-stone-400">
            Tap to preview • Your clients will love it
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
