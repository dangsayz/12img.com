'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import Image from 'next/image'

const images = [
  {
    id: 1,
    src: '/images/showcase/modern-wedding-gallery-01.jpg',
    label: 'Presentation',
    title: 'Cinematic Experience',
    description: 'Immersive full-screen viewing.',
    span: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 2,
    src: '/images/showcase/modern-wedding-gallery-02.jpg',
    label: 'Speed',
    title: 'Instant Loading',
    description: 'No buffering, ever.',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 3,
    src: '/images/showcase/modern-wedding-gallery-03.jpg',
    label: 'Quality',
    title: 'Original Res',
    description: 'Deliver full quality.',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 4,
    src: '/images/showcase/modern-wedding-gallery-04.jpg',
    label: 'Design',
    title: 'Minimalist Layout',
    description: 'Focus on the art.',
    span: 'md:col-span-1 md:row-span-2'
  },
  {
    id: 5,
    src: '/images/showcase/modern-wedding-gallery-05.jpg',
    label: 'Storage',
    title: 'Unlimited Space',
    description: 'Never run out of room.',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 6,
    src: '/images/showcase/modern-wedding-gallery-06.jpg',
    label: 'Sharing',
    title: 'Easy Delivery',
    description: 'One click to send.',
    span: 'md:col-span-2 md:row-span-1'
  },
  {
    id: 7,
    src: '/images/showcase/modern-wedding-gallery-07.jpg',
    label: 'Client Proofing',
    title: 'Favorites & Lists',
    description: 'Streamlined selection workflow.',
    span: 'md:col-span-2 md:row-span-2'
  },
  {
    id: 8,
    src: '/images/showcase/modern-wedding-gallery-08.jpg',
    label: 'Mobile',
    title: 'Responsive',
    description: 'Perfect on any device.',
    span: 'md:col-span-1 md:row-span-1'
  },
  {
    id: 9,
    src: '/images/showcase/modern-wedding-gallery-09.jpg',
    label: 'Security',
    title: 'Password Protected',
    description: 'Keep memories safe.',
    span: 'md:col-span-1 md:row-span-1'
  },
]

export function GalleryShowcase() {
  return (
    <section className="py-32 relative bg-soft-bg">
      <div className="container mx-auto px-4">
        <div className="mb-20 text-center max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Stunning galleries. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600">
                Every single time.
              </span>
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed font-medium">
              Your work deserves a presentation that matches its quality.
              Clean, minimal, and focused entirely on your images.
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[200px] md:auto-rows-[250px]">
          {images.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05, duration: 0.6, ease: "easeOut" }}
              viewport={{ once: true }}
              className={cn(
                "relative group overflow-hidden rounded-[32px] bg-gray-200 shadow-neumorphic-md hover:shadow-neumorphic-lg transition-all duration-500 cursor-pointer",
                item.span
              )}
            >
              {/* Overlay Gradient - Always present but subtle, stronger on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-700 z-10" />
              
              <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
              
              {/* Editorial Content */}
              <div className="absolute inset-0 p-8 flex flex-col justify-end z-20">
                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 ease-out">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[10px] font-bold text-white uppercase tracking-wider mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                    {item.label}
                  </span>
                  <h3 className="text-2xl font-bold text-white mb-2 opacity-90 group-hover:opacity-100 transition-opacity duration-300">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-200 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-75 transform translate-y-2 group-hover:translate-y-0">
                    {item.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
