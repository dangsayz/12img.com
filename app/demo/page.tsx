'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Play } from 'lucide-react'
import { useAuthModal } from '@/components/auth/AuthModal'

export default function DemoPage() {
  const { openAuthModal } = useAuthModal()

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-full shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">12</span>
            </div>
            <span className="text-sm font-bold text-stone-900">img</span>
          </Link>

          <div className="flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm">
            <button 
              onClick={() => openAuthModal('sign-in')}
              className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all hidden sm:block"
            >
              Log in
            </button>
            <button 
              onClick={() => openAuthModal('sign-up')}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
            >
              Start free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section - Clean & Fast */}
      <section className="min-h-screen flex flex-col items-center justify-center px-4 pt-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-serif text-stone-900 leading-[1.1] mb-6"
          >
            Galleries that{' '}
            <span className="italic">captivate</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg sm:text-xl text-stone-500 max-w-2xl mx-auto mb-10"
          >
            Deliver your photography in stunning, immersive experiences that leave lasting impressions.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <button
              onClick={() => openAuthModal('sign-up')}
              className="group flex items-center gap-2 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              <Play className="w-4 h-4" />
              Start Creating
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            
            <Link 
              href="/view-reel/demo"
              className="flex items-center gap-2 px-8 py-4 text-stone-700 hover:text-stone-900 font-medium transition-colors border-2 border-stone-200 rounded-full hover:border-stone-400 hover:bg-white"
            >
              View Demo Gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          {/* Single Hero Image - Fast Loading */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative max-w-3xl mx-auto"
          >
            {/* Shadow */}
            <div className="absolute inset-0 bg-black/20 blur-3xl transform translate-y-8 scale-95 rounded-2xl" />
            
            {/* Main Card */}
            <div className="relative bg-white rounded-lg shadow-2xl p-2 border border-stone-200">
              <div className="relative aspect-[16/10] rounded overflow-hidden">
                <Image
                  src="/images/showcase/modern-wedding-gallery-01.jpg"
                  alt="Gallery preview"
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 768px) 100vw, 800px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                
                {/* Gallery info overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <p className="text-white/80 text-sm font-medium mb-1">Featured Gallery</p>
                  <p className="text-white text-2xl font-serif">Smith Wedding 2024</p>
                </div>
              </div>
            </div>

            {/* Photo count badge */}
            <div className="absolute -top-3 -right-3 bg-stone-900 text-white px-4 py-2 text-sm font-bold rounded shadow-lg">
              248 Photos
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 mb-4">
              Every detail, perfected
            </h2>
            <p className="text-stone-500 max-w-xl mx-auto">
              From upload to delivery, we've crafted every interaction to showcase your work beautifully.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Cinematic Experience', desc: 'Immersive full-screen viewing that puts your photos center stage.' },
              { title: 'Lightning Fast', desc: 'Optimized for mobile. Your galleries load instantly on any device.' },
              { title: 'Secure & Private', desc: 'Password protection and download controls for peace of mind.' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6"
              >
                <h3 className="text-lg font-semibold text-stone-900 mb-2">{feature.title}</h3>
                <p className="text-stone-500 text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-serif text-stone-900 mb-4">
              Ready to deliver unforgettable galleries?
            </h2>
            <p className="text-stone-500 mb-8">
              Join photographers who've upgraded their client experience. Start free, no credit card required.
            </p>
            <button
              onClick={() => openAuthModal('sign-up')}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="mt-4 text-sm text-stone-400">
              No credit card required • Free forever plan available
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 px-4 py-8 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">12</span>
            </div>
            <span className="text-stone-400 text-sm">© 2024 12img. All rights reserved.</span>
          </div>
          
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-sm text-stone-400 hover:text-stone-600 transition-colors">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
