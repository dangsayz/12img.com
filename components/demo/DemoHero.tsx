'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, Download, Smartphone, Shield, ArrowRight, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

const demoImages = [
  '/images/showcase/modern-wedding-gallery-01.jpg',
  '/images/showcase/modern-wedding-gallery-02.jpg',
  '/images/showcase/modern-wedding-gallery-03.jpg',
  '/images/showcase/modern-wedding-gallery-04.jpg',
  '/images/showcase/modern-wedding-gallery-05.jpg',
  '/images/showcase/modern-wedding-gallery-06.jpg',
]

const benefits = [
  { icon: Download, text: 'Fast, full-resolution delivery' },
  { icon: Smartphone, text: 'Beautiful mobile-first gallery experience' },
  { icon: Shield, text: 'Built-in downloads & backup for peace of mind' },
]

export function DemoHero() {
  const scrollToGallery = () => {
    document.getElementById('demo-gallery')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF8F5] to-white pt-24 pb-16 lg:pt-32 lg:pb-24">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-xs font-medium text-amber-800">Live Demo Gallery</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#1C1917] tracking-tight leading-[1.1] mb-6">
              Your client galleries,{' '}
              <span className="bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 bg-clip-text text-transparent">
                elevated.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-lg text-[#78716C] leading-relaxed mb-8 max-w-lg">
              This live demo shows exactly what your couples see when they open their gallery link.
              No signup required — explore it now.
            </p>

            {/* Benefits */}
            <ul className="space-y-3 mb-8">
              {benefits.map((benefit, i) => (
                <motion.li 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[#44403C]">{benefit.text}</span>
                </motion.li>
              ))}
            </ul>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                onClick={scrollToGallery}
                className="group"
              >
                <Play className="w-4 h-4 mr-2" />
                Explore the live demo
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/sign-up">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Sign up as a photographer
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Right Column - Gallery Preview */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Browser Chrome Mockup */}
            <motion.div 
              className="bg-white rounded-2xl shadow-2xl shadow-black/10 border border-[#E8E4DC] overflow-hidden"
              whileHover={{ y: -4, rotateY: 2 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              {/* Browser Header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-[#FAFAF9] border-b border-[#E8E4DC]">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-lg border border-[#E8E4DC] text-xs text-[#78716C]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    12img.com/sarah-tom-wedding
                  </div>
                </div>
              </div>

              {/* Gallery Preview Grid */}
              <div className="p-4 bg-[#FAFAF9]">
                <div className="grid grid-cols-3 gap-2">
                  {demoImages.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      whileHover={{ scale: 1.02 }}
                      className={`relative overflow-hidden rounded-lg cursor-pointer ${
                        i === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                      }`}
                    >
                      <Image 
                        src={src} 
                        alt={`Demo gallery image ${i + 1}`} 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Floating Cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="absolute -left-6 bottom-12 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-white rounded-xl p-3 shadow-xl border border-[#E8E4DC]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Camera className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#78716C]">Gallery</p>
                    <p className="text-xs font-semibold text-[#1C1917]">248 photos</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="absolute -right-4 top-16 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                className="bg-white rounded-xl p-3 shadow-xl border border-[#E8E4DC]"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-[#78716C]">Security</p>
                    <p className="text-xs font-semibold text-[#1C1917]">Protected</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
