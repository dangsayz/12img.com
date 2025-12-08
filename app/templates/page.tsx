'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, LayoutGrid, Film, BookOpen, ChevronRight, Eye, Check, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Demo images from showcase folder
const DEMO_IMAGES = [
  { id: '1', src: '/images/showcase/modern-wedding-gallery-01.jpg', width: 4000, height: 6000 },
  { id: '2', src: '/images/showcase/modern-wedding-gallery-02.jpg', width: 4000, height: 6000 },
  { id: '3', src: '/images/showcase/modern-wedding-gallery-03.jpg', width: 4000, height: 6000 },
  { id: '4', src: '/images/showcase/modern-wedding-gallery-04.jpg', width: 4000, height: 6000 },
  { id: '5', src: '/images/showcase/modern-wedding-gallery-05.jpg', width: 4000, height: 6000 },
  { id: '6', src: '/images/showcase/modern-wedding-gallery-06.jpg', width: 4000, height: 6000 },
  { id: '7', src: '/images/showcase/modern-wedding-gallery-07.jpg', width: 6000, height: 4000 },
  { id: '8', src: '/images/showcase/modern-wedding-gallery-08.jpg', width: 6000, height: 4000 },
  { id: '9', src: '/images/showcase/modern-wedding-gallery-09.jpg', width: 6000, height: 4000 },
]

type TemplateId = 'mosaic' | 'clean-grid' | 'cinematic' | 'editorial'

interface Template {
  id: TemplateId
  name: string
  description: string
  longDescription: string
  icon: React.ReactNode
  bestFor: string[]
  features: string[]
}

const TEMPLATES: Template[] = [
  {
    id: 'mosaic',
    name: 'Mosaic',
    description: 'Dynamic collage layout',
    longDescription: 'A Pic-Time inspired collage layout with hero images and dynamic grid patterns. Perfect for showcasing variety and creating visual interest.',
    icon: <Layers className="w-6 h-6" />,
    bestFor: ['Wedding galleries', 'Event coverage', 'Large collections'],
    features: ['Hero image highlights', 'Dynamic grid patterns', 'Section navigation', 'Hover actions'],
  },
  {
    id: 'clean-grid',
    name: 'Clean Grid',
    description: 'Minimal masonry layout',
    longDescription: 'A clean, minimal portfolio-style masonry grid. Images flow naturally with preserved aspect ratios on a pristine white background.',
    icon: <LayoutGrid className="w-6 h-6" />,
    bestFor: ['Portrait sessions', 'Portfolio showcases', 'Minimalist brands'],
    features: ['True masonry layout', 'Preserved aspect ratios', 'Clean typography', 'Subtle hover effects'],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    description: 'Dark, moody spreads',
    longDescription: 'A dramatic, dark-themed layout with full-screen hero and framed spreads. Creates an immersive, film-like viewing experience.',
    icon: <Film className="w-6 h-6" />,
    bestFor: ['Luxury weddings', 'Fine art photography', 'Dramatic storytelling'],
    features: ['Full-screen hero', 'Framed spreads', 'Cinematic transitions', 'Dark aesthetic'],
  },
  {
    id: 'editorial',
    name: 'Editorial',
    description: 'Magazine-style story',
    longDescription: 'A sophisticated magazine-style layout with intelligent spread generation. Tells your story like a high-end publication.',
    icon: <BookOpen className="w-6 h-6" />,
    bestFor: ['Editorial shoots', 'Fashion photography', 'Story-driven galleries'],
    features: ['Auto-generated spreads', 'Typography integration', 'Scroll progress', 'Print-inspired design'],
  },
]

// Mini preview components for each template
function MosaicPreview() {
  return (
    <div className="w-full h-full bg-white p-2 grid grid-cols-4 grid-rows-2 gap-0.5">
      <div className="relative bg-stone-200 overflow-hidden">
        <Image src={DEMO_IMAGES[0].src} alt="" fill className="object-cover" sizes="10vw" />
      </div>
      <div className="relative col-span-2 row-span-2 bg-stone-300 overflow-hidden">
        <Image src={DEMO_IMAGES[6].src} alt="" fill className="object-cover" sizes="20vw" />
      </div>
      <div className="relative bg-stone-200 overflow-hidden">
        <Image src={DEMO_IMAGES[1].src} alt="" fill className="object-cover" sizes="10vw" />
      </div>
      <div className="relative bg-stone-200 overflow-hidden">
        <Image src={DEMO_IMAGES[2].src} alt="" fill className="object-cover" sizes="10vw" />
      </div>
      <div className="relative bg-stone-200 overflow-hidden">
        <Image src={DEMO_IMAGES[3].src} alt="" fill className="object-cover" sizes="10vw" />
      </div>
    </div>
  )
}

function CleanGridPreview() {
  return (
    <div className="w-full h-full bg-white p-3">
      <div className="text-center mb-2">
        <p className="text-[6px] uppercase tracking-widest text-stone-400">Studio Name</p>
        <p className="text-[8px] font-light text-stone-700">Gallery Title</p>
      </div>
      <div className="columns-3 gap-1">
        {DEMO_IMAGES.slice(0, 6).map((img, i) => (
          <div 
            key={img.id} 
            className="relative mb-1 overflow-hidden"
            style={{ aspectRatio: img.width / img.height }}
          >
            <Image src={img.src} alt="" fill className="object-cover" sizes="10vw" />
          </div>
        ))}
      </div>
    </div>
  )
}

function CinematicPreview() {
  return (
    <div className="w-full h-full bg-stone-900 flex flex-col">
      {/* Hero section */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="absolute inset-0 opacity-30">
          <Image src={DEMO_IMAGES[6].src} alt="" fill className="object-cover blur-sm" sizes="30vw" />
        </div>
        <div className="relative z-10 text-center text-white">
          <p className="text-[8px] font-light tracking-wider">LEXIE & TAYLOR</p>
          <p className="text-[5px] text-white/60">October 22, 2024</p>
        </div>
      </div>
      {/* Spread preview */}
      <div className="h-1/3 grid grid-cols-3 gap-0.5 p-1">
        <div className="relative overflow-hidden border border-white/10">
          <Image src={DEMO_IMAGES[0].src} alt="" fill className="object-cover" sizes="10vw" />
        </div>
        <div className="relative overflow-hidden border border-white/10">
          <Image src={DEMO_IMAGES[1].src} alt="" fill className="object-cover" sizes="10vw" />
        </div>
        <div className="relative overflow-hidden border border-white/10">
          <Image src={DEMO_IMAGES[2].src} alt="" fill className="object-cover" sizes="10vw" />
        </div>
      </div>
    </div>
  )
}

function EditorialPreview() {
  return (
    <div className="w-full h-full bg-[#FAFAFA] p-2 flex flex-col">
      {/* Progress bar */}
      <div className="h-0.5 bg-stone-900 w-1/3 mb-2" />
      {/* Spread */}
      <div className="flex-1 grid grid-cols-12 gap-1">
        <div className="col-span-5 relative overflow-hidden">
          <Image src={DEMO_IMAGES[0].src} alt="" fill className="object-cover" sizes="15vw" />
        </div>
        <div className="col-span-7 relative overflow-hidden">
          <Image src={DEMO_IMAGES[6].src} alt="" fill className="object-cover" sizes="20vw" />
        </div>
      </div>
      {/* Typography hint */}
      <div className="mt-2 flex items-center gap-2">
        <div className="h-0.5 w-4 bg-stone-300" />
        <p className="text-[5px] text-stone-400 italic">A story begins...</p>
      </div>
    </div>
  )
}

const PREVIEW_COMPONENTS: Record<TemplateId, React.FC> = {
  'mosaic': MosaicPreview,
  'clean-grid': CleanGridPreview,
  'cinematic': CinematicPreview,
  'editorial': EditorialPreview,
}

// Full demo components
function MosaicDemo() {
  const images = DEMO_IMAGES.map(img => ({
    id: img.id,
    thumbnailUrl: img.src,
    previewUrl: img.src,
    aspectRatio: img.width / img.height,
  }))

  return (
    <div className="min-h-[600px] bg-white rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-stone-200">
        <div className="px-6 h-12 flex items-center justify-between">
          <div className="w-6 h-6 bg-stone-900 flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">S</span>
          </div>
          <nav className="flex items-center gap-6">
            {['GALLERY', 'WEDDING', 'PORTRAITS'].map((section, i) => (
              <button
                key={section}
                className={`text-[10px] tracking-[0.15em] py-3 border-b-2 ${
                  i === 0 ? 'text-stone-900 border-stone-900' : 'text-stone-400 border-transparent'
                }`}
              >
                {section}
              </button>
            ))}
          </nav>
          <div className="w-6" />
        </div>
      </header>

      {/* Mosaic Grid */}
      <div className="p-1">
        <div className="grid grid-cols-4 grid-rows-2 gap-1" style={{ height: '400px' }}>
          <div className="relative bg-stone-100 overflow-hidden group">
            <Image src={images[0].thumbnailUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
          </div>
          <div className="relative col-span-2 row-span-2 bg-stone-100 overflow-hidden group">
            <Image src={images[6].thumbnailUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="50vw" />
          </div>
          <div className="relative bg-stone-100 overflow-hidden group">
            <Image src={images[1].thumbnailUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
          </div>
          <div className="relative bg-stone-100 overflow-hidden group">
            <Image src={images[2].thumbnailUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
          </div>
          <div className="relative bg-stone-100 overflow-hidden group">
            <Image src={images[3].thumbnailUrl} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="25vw" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CleanGridDemo() {
  return (
    <div className="min-h-[600px] bg-white rounded-lg overflow-hidden shadow-2xl">
      {/* Header */}
      <header className="py-8 text-center border-b border-stone-100">
        <p className="text-[10px] uppercase tracking-[0.3em] text-stone-400 mb-2">STUDIO NAME</p>
        <h1 className="text-lg font-light tracking-wide text-stone-900">Sarah & Michael</h1>
      </header>

      {/* Masonry Grid */}
      <div className="p-6">
        <div className="columns-3 gap-3">
          {DEMO_IMAGES.slice(0, 9).map((img) => (
            <div 
              key={img.id}
              className="relative mb-3 overflow-hidden group"
              style={{ aspectRatio: img.width / img.height }}
            >
              <Image 
                src={img.src} 
                alt="" 
                fill 
                className="object-cover group-hover:scale-105 transition-transform duration-500" 
                sizes="33vw" 
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CinematicDemo() {
  return (
    <div className="min-h-[600px] bg-stone-900 rounded-lg overflow-hidden shadow-2xl">
      {/* Hero */}
      <div className="relative h-[300px] flex items-center justify-center">
        <div className="absolute inset-0">
          <Image src={DEMO_IMAGES[6].src} alt="" fill className="object-cover opacity-30 blur-sm" sizes="100vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900" />
        </div>
        <div className="relative z-10 text-center text-white">
          <p className="text-[10px] uppercase tracking-[0.4em] text-white/60 mb-4">Photos by Studio Name</p>
          <h1 className="text-3xl font-light tracking-wide mb-2">LEXIE & TAYLOR</h1>
          <p className="text-white/60 text-sm">October 22, 2024</p>
        </div>
      </div>

      {/* Spreads */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 grid-rows-2 gap-2" style={{ height: '250px' }}>
          <div className="relative overflow-hidden border-2 border-white/10 group">
            <Image src={DEMO_IMAGES[0].src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" />
          </div>
          <div className="relative overflow-hidden border-2 border-white/10 group">
            <Image src={DEMO_IMAGES[1].src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" />
          </div>
          <div className="relative row-span-2 overflow-hidden border-2 border-white/10 group">
            <Image src={DEMO_IMAGES[2].src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="33vw" />
          </div>
          <div className="relative col-span-2 overflow-hidden border-2 border-white/10 group">
            <Image src={DEMO_IMAGES[7].src} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" sizes="66vw" />
          </div>
        </div>
      </div>
    </div>
  )
}

function EditorialDemo() {
  return (
    <div className="min-h-[600px] bg-[#FAFAFA] rounded-lg overflow-hidden shadow-2xl">
      {/* Progress bar */}
      <div className="h-1 bg-neutral-900 w-1/3" />
      
      {/* Navigation */}
      <nav className="p-4 flex justify-between items-center">
        <div className="flex items-center gap-2 text-neutral-400 text-xs">
          <ArrowLeft className="w-4 h-4" />
          <span className="uppercase tracking-widest">Index</span>
        </div>
      </nav>

      {/* Spread */}
      <div className="px-8 py-4">
        <div className="grid grid-cols-12 gap-4" style={{ height: '400px' }}>
          <div className="col-span-5 relative overflow-hidden">
            <Image src={DEMO_IMAGES[0].src} alt="" fill className="object-cover" sizes="40vw" />
          </div>
          <div className="col-span-7 relative overflow-hidden">
            <Image src={DEMO_IMAGES[6].src} alt="" fill className="object-cover" sizes="60vw" />
          </div>
        </div>
        
        {/* Typography */}
        <div className="mt-6 flex items-center gap-4">
          <div className="h-px w-12 bg-neutral-300" />
          <p className="text-sm text-neutral-500 italic font-serif">A story begins...</p>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center py-8">
        <p className="text-xs text-neutral-400 tracking-widest">SCROLL TO CONTINUE</p>
      </div>
    </div>
  )
}

const DEMO_COMPONENTS: Record<TemplateId, React.FC> = {
  'mosaic': MosaicDemo,
  'clean-grid': CleanGridDemo,
  'cinematic': CinematicDemo,
  'editorial': EditorialDemo,
}

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId>('mosaic')
  const [viewMode, setViewMode] = useState<'grid' | 'demo'>('grid')

  const currentTemplate = TEMPLATES.find(t => t.id === selectedTemplate)!
  const PreviewComponent = PREVIEW_COMPONENTS[selectedTemplate]
  const DemoComponent = DEMO_COMPONENTS[selectedTemplate]

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </Link>
          <h1 className="text-lg font-light tracking-wide">Gallery Templates</h1>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Template Selector Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {TEMPLATES.map((template) => {
            const isSelected = selectedTemplate === template.id
            const Preview = PREVIEW_COMPONENTS[template.id]
            
            return (
              <motion.button
                key={template.id}
                onClick={() => setSelectedTemplate(template.id)}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  relative text-left bg-white border-2 transition-all overflow-hidden
                  ${isSelected 
                    ? 'border-stone-900 shadow-lg' 
                    : 'border-stone-200 hover:border-stone-400'
                  }
                `}
              >
                {/* Preview Thumbnail */}
                <div className="aspect-[4/3] relative overflow-hidden">
                  <Preview />
                  
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 w-6 h-6 bg-stone-900 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Template Info */}
                <div className="p-4 border-t border-stone-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`${isSelected ? 'text-stone-900' : 'text-stone-400'}`}>
                      {template.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-stone-900">{template.name}</h3>
                      <p className="text-xs text-stone-500">{template.description}</p>
                    </div>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        {/* Selected Template Details */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTemplate}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-8"
          >
            {/* Info Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-stone-900 text-white flex items-center justify-center">
                    {currentTemplate.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-light text-stone-900">{currentTemplate.name}</h2>
                    <p className="text-sm text-stone-500">{currentTemplate.description}</p>
                  </div>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  {currentTemplate.longDescription}
                </p>
              </div>

              {/* Best For */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-400 mb-3">Best For</h3>
                <ul className="space-y-2">
                  {currentTemplate.bestFor.map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-stone-700">
                      <ChevronRight className="w-4 h-4 text-stone-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Features */}
              <div>
                <h3 className="text-xs uppercase tracking-widest text-stone-400 mb-3">Features</h3>
                <ul className="space-y-2">
                  {currentTemplate.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-stone-700">
                      <Check className="w-4 h-4 text-green-600" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 py-2 px-4 text-sm border transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  Preview
                </button>
                <button
                  onClick={() => setViewMode('demo')}
                  className={`flex-1 py-2 px-4 text-sm border transition-colors flex items-center justify-center gap-2 ${
                    viewMode === 'demo'
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-600 border-stone-200 hover:border-stone-400'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  Live Demo
                </button>
              </div>
            </div>

            {/* Demo Panel */}
            <div className="lg:col-span-2">
              <div className="bg-stone-200 rounded-xl p-4">
                <DemoComponent />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
