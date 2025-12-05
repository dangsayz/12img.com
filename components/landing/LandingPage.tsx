'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion'
import { useRef, useEffect, useState } from 'react'
import { ArrowRight, Play, Check } from 'lucide-react'
import { PRICING } from '@/lib/config/pricing'

const galleryImages = [
  '/images/showcase/modern-wedding-gallery-01.jpg',
  '/images/showcase/modern-wedding-gallery-02.jpg',
  '/images/showcase/modern-wedding-gallery-03.jpg',
  '/images/showcase/modern-wedding-gallery-04.jpg',
  '/images/showcase/modern-wedding-gallery-05.jpg',
  '/images/showcase/modern-wedding-gallery-06.jpg',
]

export function LandingPage() {
  const heroRef = useRef<HTMLElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  
  // Scroll-based parallax
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  })
  
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  const backgroundY = useTransform(smoothProgress, [0, 1], ['0%', '30%'])
  const backgroundScale = useTransform(smoothProgress, [0, 1], [1, 1.2])
  const contentY = useTransform(smoothProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(smoothProgress, [0, 0.5], [1, 0])
  
  // Mouse parallax
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothMouseX = useSpring(mouseX, { stiffness: 50, damping: 20 })
  const smoothMouseY = useSpring(mouseY, { stiffness: 50, damping: 20 })
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e
      const { innerWidth, innerHeight } = window
      mouseX.set((clientX - innerWidth / 2) / 50)
      mouseY.set((clientY - innerHeight / 2) / 50)
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  return (
    <main className="min-h-screen bg-[#FAF8F3]">
      {/* Floating Nav - Warm Glass */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-2xl border border-[#E8E4DC] rounded-2xl px-6 py-3 shadow-sm">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1C1917] flex items-center justify-center text-white text-xs font-bold">
                12
              </div>
              <span className="text-[17px] font-semibold text-[#1C1917]">img</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link 
                href="/sign-in" 
                className="text-sm font-medium text-[#78716C] hover:text-[#1C1917] transition-colors hidden sm:block"
              >
                Sign in
              </Link>
              <Link 
                href="/sign-up"
                className="text-sm font-semibold text-white bg-[#1C1917] hover:bg-[#292524] px-5 py-2.5 rounded-xl transition-all hover:scale-105"
              >
                Start free
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* WORLD-CLASS HERO */}
      <section ref={heroRef} className="relative min-h-[100vh] overflow-hidden">
        
        {/* 3D Parallax Background Image */}
        <motion.div 
          style={{ y: backgroundY, scale: backgroundScale }}
          className="absolute inset-0 z-0"
        >
          <Image 
            src="/images/showcase/modern-wedding-gallery-01.jpg"
            alt="Beautiful wedding photography"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          {/* Warm cinematic gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#1C1917] via-[#1C1917]/30 to-[#1C1917]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#1C1917]/70 via-transparent to-[#1C1917]/70" />
          
          {/* Animated grain texture */}
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </motion.div>

        {/* Floating 3D Elements with Mouse Parallax */}
        <motion.div 
          style={{ x: smoothMouseX, y: smoothMouseY }}
          className="absolute inset-0 z-10 pointer-events-none"
        >
          {/* Warm floating orbs */}
          <motion.div
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-[20%] left-[15%] w-64 h-64 bg-amber-500/25 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{ 
              y: [0, 40, 0],
              opacity: [0.2, 0.5, 0.2]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute top-[40%] right-[10%] w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px]"
          />
          <motion.div
            animate={{ 
              y: [0, -20, 0],
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute bottom-[30%] left-[30%] w-48 h-48 bg-orange-400/15 rounded-full blur-[80px]"
          />
        </motion.div>

        {/* Main Content */}
        <motion.div 
          style={{ y: contentY, opacity }}
          className="relative z-20 flex flex-col items-center justify-center min-h-screen px-6 pt-24"
        >
          <div className="max-w-5xl mx-auto text-center">
            
{/* Massive headline with staggered reveal */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <h1 className="text-[clamp(3rem,11vw,8rem)] font-medium tracking-tight text-white leading-[1] mb-6">
                <motion.span
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.5 }}
                  className="block"
                >
                  Your photos.
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.7 }}
                  className="block text-white/80"
                >
                  Backed up
                </motion.span>
                <motion.span
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.9 }}
                  className="block bg-gradient-to-r from-amber-300 via-orange-300 to-amber-200 bg-clip-text text-transparent font-semibold"
                >
                  forever.
                </motion.span>
              </h1>
            </motion.div>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              className="text-xl sm:text-2xl text-white/50 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
            >
              Beautiful client galleries with <span className="text-white">instant ZIP delivery</span>.
              <span className="text-white/70"> Your clients get a permanent backup—automatically.</span>
            </motion.p>

            {/* World-Class CTA Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.3 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Primary CTA - Warm magnetic button */}
              <Link href="/sign-up" className="group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-300" />
                <div className="relative flex items-center gap-3 px-8 py-4 bg-[#1C1917] rounded-xl font-medium text-white transition-all group-hover:scale-[1.02]">
                  <span>Get started</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>

              {/* Quick benefits */}
              <div className="flex flex-wrap justify-center gap-6 text-sm text-white/50">
                {['Automatic ZIP backup', 'Instant email delivery', 'Setup in 30 seconds'].map((text, i) => (
                  <motion.div
                    key={text}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.5 + i * 0.1 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>{text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Secondary CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8 }}
              >
                <Link 
                  href="/g/demo"
                  className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors mt-4"
                >
                  <div className="w-10 h-10 rounded-full border border-white/30 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <Play className="w-4 h-4 ml-0.5" />
                  </div>
                  <span className="text-sm font-medium">Watch 60-second demo</span>
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="flex flex-col items-center gap-2"
            >
              <span className="text-[10px] text-white/30 tracking-[0.3em] uppercase">Scroll</span>
              <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Floating Gallery Preview - Appears on Scroll */}
      <section className="relative z-30 -mt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Browser mockup - Warm theme */}
            <div className="bg-white rounded-3xl overflow-hidden shadow-2xl shadow-[#1C1917]/20 border border-[#E8E4DC]">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E8E4DC] bg-[#FAF8F3]">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                  <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                  <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="flex items-center gap-2 px-4 py-1.5 bg-white rounded-lg border border-[#E8E4DC] text-sm text-[#78716C]">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    12img.com/g/sarah-tom-wedding
                  </div>
                </div>
              </div>
              
              {/* Gallery preview */}
              <div className="p-6 bg-[#FAF8F3]">
                <div className="grid grid-cols-3 gap-3">
                  {galleryImages.map((src, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className={`relative overflow-hidden rounded-xl ${
                        i === 0 ? 'col-span-2 row-span-2 aspect-[4/3]' : 'aspect-square'
                      }`}
                    >
                      <Image src={src} alt="" fill className="object-cover" sizes="33vw" />
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors cursor-pointer" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating feature cards */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="absolute -left-6 top-1/4 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="bg-white rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Upload speed</p>
                    <p className="text-sm font-bold text-gray-900">2.4 seconds</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute -right-6 top-1/3 hidden lg:block"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="bg-white rounded-2xl p-4 shadow-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Protection</p>
                    <p className="text-sm font-bold text-gray-900">Password enabled</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* Live Activity Feed - Unique Social Proof */}
      <section className="py-16 bg-[#1C1917] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          {/* Section Label */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-emerald-400 uppercase tracking-widest">Live Activity</span>
            </div>
          </div>

          {/* Scrolling Activity Ticker */}
          <div className="relative">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#1C1917] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#1C1917] to-transparent z-10" />
            
            {/* Ticker */}
            <motion.div 
              className="flex gap-6"
              animate={{ x: [0, -1500] }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
            >
              {[
                { name: "Sarah M.", action: "delivered", detail: "248 wedding photos", location: "Austin, TX", time: "2m ago" },
                { name: "Mike R.", action: "created", detail: "Fall Engagement Session", location: "Denver, CO", time: "5m ago" },
                { name: "Emma L.", action: "delivered", detail: "186 portrait photos", location: "NYC", time: "8m ago" },
                { name: "James K.", action: "shared", detail: "Beach Wedding Gallery", location: "Miami, FL", time: "12m ago" },
                { name: "Anna B.", action: "delivered", detail: "312 event photos", location: "Chicago, IL", time: "15m ago" },
                { name: "Chris P.", action: "created", detail: "Corporate Headshots", location: "Seattle, WA", time: "18m ago" },
                { name: "Lisa T.", action: "delivered", detail: "425 wedding photos", location: "LA, CA", time: "22m ago" },
                { name: "David H.", action: "shared", detail: "Graduation Gallery", location: "Boston, MA", time: "25m ago" },
              ].concat([
                { name: "Sarah M.", action: "delivered", detail: "248 wedding photos", location: "Austin, TX", time: "2m ago" },
                { name: "Mike R.", action: "created", detail: "Fall Engagement Session", location: "Denver, CO", time: "5m ago" },
                { name: "Emma L.", action: "delivered", detail: "186 portrait photos", location: "NYC", time: "8m ago" },
                { name: "James K.", action: "shared", detail: "Beach Wedding Gallery", location: "Miami, FL", time: "12m ago" },
              ]).map((item, i) => (
                <div key={i} className="flex-shrink-0 flex items-center gap-3 bg-white/5 backdrop-blur-sm rounded-full pl-1 pr-5 py-1 border border-white/10">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-[10px] font-bold text-[#1C1917]">
                    {item.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/90 text-sm font-medium">{item.name}</span>
                    <span className="text-white/40 text-sm">{item.action}</span>
                    <span className="text-white/70 text-sm">{item.detail}</span>
                    <span className="text-white/30 text-xs">· {item.time}</span>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Bottom Stats - Minimal */}
          <div className="flex items-center justify-center gap-8 mt-10 text-center">
            <div>
              <p className="text-3xl font-bold text-white">10,000+</p>
              <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Photographers trust us</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <p className="text-3xl font-bold text-white">2.5M</p>
              <p className="text-xs text-white/40 uppercase tracking-wider mt-1">Photos delivered safely</p>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-2">
              <p className="text-3xl font-bold text-white">4.9</p>
              <div className="flex">
                {[1,2,3,4,5].map(i => (
                  <svg key={i} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing - Cinematic Scroll Experience */}
      <section id="pricing" className="py-32 px-6 scroll-mt-20 bg-gradient-to-b from-[#FAF8F3] via-[#F5F2EC] to-[#FAF8F3] relative overflow-hidden">
        {/* Animated Background Orbs */}
        <motion.div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header - Dramatic Reveal */}
          <div className="text-center mb-12">
            {/* Price comparison with staggered animation */}
            <motion.div 
              className="flex items-center justify-center gap-6 sm:gap-10 mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Old Price - Slides in from left */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <motion.p 
                  className="text-4xl sm:text-6xl font-bold text-[#1C1917]/15 line-through decoration-[3px]"
                  initial={{ scale: 1.2 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  $300
                </motion.p>
                <p className="text-xs sm:text-sm text-[#78716C] mt-2">per year elsewhere</p>
              </motion.div>

              {/* Arrow with draw animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.5, type: "spring", stiffness: 200 }}
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1C1917] flex items-center justify-center">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </motion.div>

              {/* New Price - Slides in from right with pop */}
              <motion.div 
                className="text-center"
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <motion.p 
                  className="text-4xl sm:text-6xl font-bold text-emerald-600"
                  initial={{ scale: 0.5 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.8, type: "spring", stiffness: 150 }}
                >
                  $15
                </motion.p>
                <p className="text-xs sm:text-sm text-emerald-600 font-semibold mt-2">per year with 12img</p>
              </motion.div>
            </motion.div>

            {/* Headline with word-by-word reveal */}
            <div className="overflow-hidden mb-6">
              <motion.h2 
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-[#1C1917] leading-[1.1] tracking-tight"
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                Keep more of what
              </motion.h2>
            </div>
            <div className="overflow-hidden mb-4">
              <motion.h2 
                className="text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.1] tracking-tight"
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 1.1, ease: [0.16, 1, 0.3, 1] }}
              >
                <span className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 bg-clip-text text-transparent bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  you earn.
                </span>
              </motion.h2>
            </div>

            {/* Subtext fade up */}
            <motion.p 
              className="text-lg sm:text-xl text-[#78716C] max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 1.3 }}
            >
              Stop overpaying for gallery hosting.<br className="hidden sm:block" />
              <span className="text-[#1C1917] font-medium">One wedding shoot pays for a whole year of 12img.</span>
            </motion.p>
          </div>

          {/* Pricing Cards - Staggered 3D Reveal */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 perspective-[1000px]">
            
            {/* Free Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 60, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-white rounded-3xl p-7 border border-[#E8E4DC] hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
            >
              {/* Plan icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-50 border border-stone-200 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-stone-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L20 7.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12V21" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 12L4 7.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-[#1C1917] mb-1">Free</h3>
              <p className="text-[#78716C] text-sm mb-5">Perfect to try it out</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#1C1917]">$0</span>
                <span className="text-[#78716C] text-sm ml-1">/forever</span>
              </div>

              <Link 
                href="/sign-up"
                className="block w-full text-center py-3.5 rounded-2xl bg-stone-100 text-[#1C1917] font-semibold text-sm hover:bg-stone-200 transition-all mb-7"
              >
                Get started
              </Link>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">3 galleries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15L16 10L5 21"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">50 images each</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Password protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">7-day links</span>
                </div>
              </div>
            </motion.div>

            {/* Basic Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 60, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-white rounded-3xl p-7 border border-[#E8E4DC] hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
            >
              {/* Plan icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-amber-50 border border-amber-200 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-[#1C1917] mb-1">Basic</h3>
              <p className="text-[#78716C] text-sm mb-5">For hobbyists</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#1C1917]">${PRICING.basic.monthly}</span>
                <span className="text-[#78716C] text-sm ml-1">/month</span>
              </div>

              <Link 
                href="/sign-up?plan=basic"
                className="block w-full text-center py-3.5 rounded-2xl bg-stone-100 text-[#1C1917] font-semibold text-sm hover:bg-stone-200 transition-all mb-7"
              >
                Get Basic
              </Link>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">10 galleries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15L16 10L5 21"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">200 images each</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">High quality exports</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/>
                      <path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Password protection</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">30-day links</span>
                </div>
              </div>
            </motion.div>

            {/* Pro Tier - Featured */}
            <motion.div 
              initial={{ opacity: 0, y: 80, rotateX: -15, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -12, scale: 1.02, transition: { duration: 0.3 } }}
              className="relative bg-gradient-to-b from-[#1C1917] to-[#292524] rounded-3xl p-7 text-white lg:scale-[1.03] shadow-2xl shadow-[#1C1917]/40 ring-2 ring-amber-400/20"
            >
              {/* Popular badge */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="whitespace-nowrap bg-gradient-to-r from-amber-400 to-orange-400 text-[#1C1917] text-[11px] font-bold px-4 py-2 rounded-full shadow-lg uppercase tracking-wider inline-flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  Most Popular
                </span>
              </div>

              {/* Plan icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center mb-5 mt-2">
                <svg className="w-6 h-6 text-[#1C1917]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              </div>

              <h3 className="text-xl font-semibold mb-1">Pro</h3>
              <p className="text-white/60 text-sm mb-5">Most popular for pros</p>
              
              <div className="mb-2">
                <span className="text-4xl font-bold">${PRICING.pro.monthly}</span>
                <span className="text-white/60 text-sm ml-1">/month</span>
              </div>
              <p className="text-amber-300 text-xs font-medium mb-6 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Less than a coffee per week
              </p>

              <Link 
                href="/sign-up?plan=pro"
                className="block w-full text-center py-3.5 rounded-2xl bg-white text-[#1C1917] font-bold text-sm hover:bg-amber-50 transition-all mb-7 shadow-lg"
              >
                Get Pro
              </Link>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1"/>
                      <rect x="14" y="3" width="7" height="7" rx="1"/>
                      <rect x="3" y="14" width="7" height="7" rx="1"/>
                      <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                  </div>
                  <span className="text-sm">50 galleries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <path d="M21 15L16 10L5 21"/>
                    </svg>
                  </div>
                  <span className="text-sm">500 images each</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                      <polyline points="7,10 12,15 17,10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </div>
                  <span className="text-sm">Auto ZIP backup ✨</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <span className="text-sm">Custom branding</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                    </svg>
                  </div>
                  <span className="text-sm">Analytics dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                    </svg>
                  </div>
                  <span className="text-sm">No link expiry</span>
                </div>
              </div>

              {/* Social proof */}
              <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-center gap-2">
                <div className="flex -space-x-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-[#1C1917] bg-white/20 overflow-hidden">
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+50}`} alt="" />
                    </div>
                  ))}
                </div>
                <p className="text-xs text-white/50">
                  <span className="text-white/80 font-medium">847</span> joined this month
                </p>
              </div>
            </motion.div>

            {/* Studio Tier */}
            <motion.div 
              initial={{ opacity: 0, y: 60, rotateX: -10 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group bg-white rounded-3xl p-7 border border-[#E8E4DC] hover:border-amber-400/50 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500"
            >
              {/* Plan icon */}
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-100 to-violet-50 border border-violet-200 flex items-center justify-center mb-5">
                <svg className="w-6 h-6 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16"/>
                  <path d="M1 21h22"/>
                  <path d="M9 7h6"/>
                  <path d="M9 11h6"/>
                  <path d="M9 15h4"/>
                </svg>
              </div>

              <h3 className="text-xl font-semibold text-[#1C1917] mb-1">Studio</h3>
              <p className="text-[#78716C] text-sm mb-5">For high-volume teams</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-[#1C1917]">${PRICING.studio.monthly}</span>
                <span className="text-[#78716C] text-sm ml-1">/month</span>
              </div>

              <Link 
                href="/sign-up?plan=studio"
                className="block w-full text-center py-3.5 rounded-2xl bg-stone-100 text-[#1C1917] font-semibold text-sm hover:bg-stone-200 transition-all mb-7"
              >
                Get Studio
              </Link>

              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12A10 10 0 1112 2"/>
                      <path d="M22 2L12 12"/>
                      <path d="M16 2h6v6"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Unlimited galleries</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-sky-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 12A10 10 0 1112 2"/>
                      <path d="M22 2L12 12"/>
                      <path d="M16 2h6v6"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Unlimited images</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2L15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Everything in Pro</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-indigo-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                      <path d="M16 3.13a4 4 0 010 7.75"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Team access</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-violet-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="18" height="18" rx="2"/>
                      <path d="M3 9h18"/>
                      <path d="M9 21V9"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">White-label branding</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                    </svg>
                  </div>
                  <span className="text-sm text-[#1C1917]">Priority support</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Bottom trust elements */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            {/* Guarantees */}
            <div className="flex flex-wrap justify-center gap-6 sm:gap-10 mb-8">
              <div className="flex items-center gap-2 text-sm text-[#78716C]">
                <svg className="w-4 h-4 text-[#A8A29E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2"/>
                  <path d="M7 11V7a5 5 0 0110 0v4"/>
                </svg>
                <span>SSL secured</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#78716C]">
                <svg className="w-4 h-4 text-[#A8A29E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 12h8"/>
                </svg>
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#78716C]">
                <svg className="w-4 h-4 text-[#A8A29E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3"/>
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>Setup in 30 seconds</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-[#78716C]">
                <svg className="w-4 h-4 text-[#A8A29E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/>
                </svg>
                <span>Real human support</span>
              </div>
            </div>

            {/* Final CTA */}
            <p className="text-[#78716C] text-sm mb-4">
              Not sure yet? <Link href="/g/demo" className="text-amber-600 font-medium hover:underline">See a live demo gallery →</Link>
            </p>
            <p className="text-xs text-[#78716C]/70">
              Questions? Email us at <a href="mailto:hello@12img.com" className="hover:text-amber-600">hello@12img.com</a>
            </p>
          </motion.div>
        </div>
      </section>

      {/* Schema.org JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "12img",
            "applicationCategory": "PhotographyApplication",
            "operatingSystem": "Web",
            "description": "Client gallery platform for wedding photographers. Fast uploads, password protection, and beautiful presentation.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "2400"
            }
          })
        }}
      />
    </main>
  )
}
