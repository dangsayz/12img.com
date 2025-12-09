'use client'

import { motion } from 'framer-motion'
import { Check, LayoutGrid, Layers, Film, BookOpen } from 'lucide-react'
import { GALLERY_TEMPLATES, type GalleryTemplate } from './index'

interface TemplateSelectorProps {
  selected: GalleryTemplate
  onSelect: (template: GalleryTemplate) => void
}

const templateIcons: Record<GalleryTemplate, React.ReactNode> = {
  'mosaic': <Layers className="w-5 h-5" />,
  'clean-grid': <LayoutGrid className="w-5 h-5" />,
  'cinematic': <Film className="w-5 h-5" />,
  'editorial': <BookOpen className="w-5 h-5" />,
}

export function TemplateSelector({ selected, onSelect }: TemplateSelectorProps) {
  return (
    <div className="space-y-6">
      {/* Hint */}
      <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 text-center">
        This is how your client will experience the gallery
      </p>
      
      <div className="grid grid-cols-2 gap-4">
      {GALLERY_TEMPLATES.map((template) => {
        const isSelected = selected === template.id
        
        return (
          <motion.button
            key={template.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(template.id)}
            className={`
              relative text-left p-4 border-2 transition-all
              ${isSelected 
                ? 'border-stone-900 bg-stone-50' 
                : 'border-stone-200 hover:border-stone-400 bg-white'
              }
            `}
          >
            {/* Preview Thumbnail - Ultra minimal, flat */}
            <div className="aspect-[4/3] mb-4 overflow-hidden relative bg-stone-50 border border-stone-100">
              {/* Mosaic Preview - Pic-Time style */}
              {template.id === 'mosaic' && (
                <div className="absolute inset-3 grid grid-cols-4 grid-rows-2 gap-0.5">
                  <div className="bg-stone-200" />
                  <div className="col-span-2 row-span-2 bg-stone-300" />
                  <div className="bg-stone-200" />
                  <div className="bg-stone-250" />
                  <div className="bg-stone-200" />
                </div>
              )}

              {/* Clean Grid Preview */}
              {template.id === 'clean-grid' && (
                <div className="absolute inset-3 grid grid-cols-3 grid-rows-2 gap-1">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-stone-200" />
                  ))}
                </div>
              )}

              {/* Cinematic Preview */}
              {template.id === 'cinematic' && (
                <div className="absolute inset-0 bg-stone-900 flex flex-col">
                  <div className="h-2 bg-black" />
                  <div className="flex-1 grid grid-cols-3 gap-0.5 p-3">
                    <div className="bg-stone-700" />
                    <div className="col-span-2 bg-stone-600" />
                  </div>
                  <div className="h-2 bg-black" />
                </div>
              )}

              {/* Editorial Preview */}
              {template.id === 'editorial' && (
                <div className="absolute inset-3 flex flex-col gap-2">
                  <div className="flex-1 bg-stone-200" />
                  <div className="h-1 w-1/3 bg-stone-300" />
                  <div className="flex gap-1 h-5">
                    <div className="flex-1 bg-stone-200" />
                    <div className="flex-1 bg-stone-200" />
                  </div>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-stone-900 flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            {/* Template Info - Better typography */}
            <div className="flex items-start gap-3">
              <div className={`
                w-8 h-8 flex items-center justify-center flex-shrink-0
                ${isSelected ? 'text-stone-900' : 'text-stone-400'}
              `}>
                {templateIcons[template.id]}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif text-base text-stone-900 mb-0.5">
                  {template.name}
                </h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  {template.description}
                </p>
              </div>
            </div>
          </motion.button>
        )
      })}
      </div>
    </div>
  )
}
