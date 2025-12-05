'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import { Check, Copy, Share2, Download, Mail, Shield } from 'lucide-react'
import Image from 'next/image'

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  })

  const y = useTransform(scrollYProgress, [0, 1], [0, 50])
  const opacity = useTransform(scrollYProgress, [0.8, 1], [1, 0])

  return (
    <motion.section 
      ref={containerRef}
      style={{ opacity }}
      className="py-32 relative overflow-hidden bg-gray-50/50"
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="mb-24 text-center max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full text-emerald-700 text-sm font-medium mb-6">
              <Shield className="w-4 h-4" />
              <span>Automatic backup included</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-6">
              Never lose a client&apos;s photos.
            </h2>
            <p className="text-lg text-gray-500 leading-relaxed">
              Every gallery gets an automatic ZIP backup sent straight to your client&apos;s inbox.
              <span className="text-gray-900 font-medium"> A 12img exclusive.</span>
            </p>
          </motion.div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 max-w-6xl mx-auto">
          
          {/* Card 1: Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="group relative bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
          >
            <div className="h-64 w-full bg-gray-50 rounded-2xl mb-8 border-2 border-dashed border-gray-200 flex items-center justify-center relative overflow-hidden group-hover:border-gray-300 transition-colors perspective-[1000px]">
              <motion.div 
                className="absolute w-40 aspect-[3/4] shadow-2xl rounded-lg overflow-hidden bg-white ring-4 ring-white"
                animate={{ 
                  y: [0, -15, 0],
                  rotateY: [12, 24, 12],
                  rotateX: [6, 12, 6],
                }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                 <Image 
                   src="/images/showcase/modern-wedding-gallery-01.jpg"
                   alt="Upload Preview"
                   fill
                   className="object-cover"
                 />
                 {/* Glossy Reflection */}
                 <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none mix-blend-overlay" />
              </motion.div>
              
              {/* Upload Status Indicator */}
              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 shadow-sm border border-gray-100 flex items-center gap-2 z-10">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-medium text-gray-600">Processing</span>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">01. Upload</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              Drag & drop your photos. We <span className="text-gray-900 font-medium">instantly</span> optimize and create your gallery.
            </p>
          </motion.div>

          {/* Card 2: Link */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="group relative bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
          >
            <div className="h-64 w-full bg-gray-50 rounded-2xl mb-8 flex flex-col items-center justify-center relative px-6 overflow-hidden">
              {/* Background Stacked Photos (Blurred) */}
              <div className="absolute inset-0 opacity-50 group-hover:opacity-70 transition-opacity duration-700">
                  <Image
                    src="/images/showcase/modern-wedding-gallery-02.jpg"
                    alt="Background"
                    fill
                    className="object-cover blur-sm scale-110"
                  />
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px]" />
              </div>

              <div className="w-full bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-white/50 flex items-center justify-between gap-3 transform group-hover:scale-105 transition-transform duration-500 relative z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    <Image 
                      src="/images/showcase/modern-wedding-gallery-02.jpg"
                      alt="Thumb"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs text-gray-400 font-medium truncate">12img.com/g/</span>
                    <span className="text-sm font-semibold text-gray-900 truncate">wedding-2024</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-lg bg-black text-white flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-gray-800 transition-colors">
                  <Copy className="w-4 h-4" />
                </div>
              </div>
              
              {/* Success Toast */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bottom-8 bg-green-50/90 backdrop-blur-sm text-green-700 px-3 py-1 rounded-full text-xs font-medium border border-green-100 flex items-center gap-1.5 shadow-sm z-10"
              >
                <Check className="w-3 h-3" />
                Link created
              </motion.div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">02. Share Link</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              Get a <span className="text-gray-900 font-medium">password-protected</span> link. Your clients view instantly—no account needed.
            </p>
          </motion.div>

          {/* Card 3: Share */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="group relative bg-white rounded-[2rem] p-8 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden"
          >
            <div className="h-64 w-full bg-gray-50 rounded-2xl mb-8 p-4 relative overflow-hidden group-hover:bg-gray-100/50 transition-colors">
              {/* Masonry Grid Preview */}
              <div className="grid grid-cols-2 gap-3 h-full w-full transform group-hover:scale-[1.02] transition-transform duration-700">
                <div className="space-y-3">
                  <div className="relative w-full h-32 rounded-lg overflow-hidden shadow-sm">
                    <Image src="/images/showcase/modern-wedding-gallery-03.jpg" alt="Gallery 1" fill className="object-cover" />
                  </div>
                  <div className="relative w-full h-20 rounded-lg overflow-hidden shadow-sm">
                    <Image src="/images/showcase/modern-wedding-gallery-07.jpg" alt="Gallery 2" fill className="object-cover" />
                  </div>
                </div>
                <div className="space-y-3 pt-6">
                   <div className="relative w-full h-20 rounded-lg overflow-hidden shadow-sm">
                    <Image src="/images/showcase/modern-wedding-gallery-05.jpg" alt="Gallery 3" fill className="object-cover" />
                  </div>
                  <div className="relative w-full h-32 rounded-lg overflow-hidden shadow-sm">
                    <Image src="/images/showcase/modern-wedding-gallery-06.jpg" alt="Gallery 4" fill className="object-cover" />
                  </div>
                </div>
              </div>
              
              {/* Floating Action Button */}
              <div className="absolute bottom-4 right-4 z-10">
                 <div className="w-10 h-10 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center text-gray-900 group-hover:scale-110 transition-transform">
                    <Share2 className="w-4 h-4" />
                 </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">03. Auto Backup</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              Clients receive an <span className="text-gray-900 font-medium">automatic email</span> with a ZIP download—their photos are <span className="text-gray-900 font-medium">safe forever</span>.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}
