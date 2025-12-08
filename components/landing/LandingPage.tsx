'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ArrowRight, Upload, Lock, Shield, Zap, Check, Instagram, Quote, Star, Play, Image as ImageIcon, Palette, Clock, Mail } from 'lucide-react'
import { DemoCardGenerator } from './DemoCardGenerator'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { useAuthModal } from '@/components/auth/AuthModal'

// --- Landing Page Component ---

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openAuthModal } = useAuthModal()

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#141414] font-sans selection:bg-black selection:text-white">
      
      {/* --- Navigation (Floating Pill - matches AppNav) --- */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
                <span className="text-white font-bold text-[10px] tracking-tight">12</span>
              </div>
              <span className="text-sm font-bold text-stone-900 hidden sm:block">img</span>
            </Link>
            
            {/* Divider */}
            <div className="w-px h-5 bg-stone-200 mx-1 hidden md:block" />
            
            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center">
              <Link href="#features" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Features
              </Link>
              <Link href="#pricing" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Pricing
              </Link>
              <Link href="/profiles" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Profiles
              </Link>
              <Link href="/view-reel/demo" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Demo
              </Link>
              <Link href="/help" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Help
              </Link>
            </div>
          </div>
          
          {/* Right: Auth Actions */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
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
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-stone-600" /> : <Menu className="w-5 h-5 text-stone-600" />}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-20 left-4 right-4 z-50 md:hidden">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
              <div className="p-2">
                <Link href="#features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Features</span>
                </Link>
                <Link href="#pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Pricing</span>
                </Link>
                <Link href="/profiles" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Profiles</span>
                </Link>
                <Link href="/view-reel/demo" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Demo Gallery</span>
                </Link>
                <Link href="/help" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Help</span>
                </Link>
              </div>
              
              <div className="border-t border-stone-100 p-3 space-y-2">
                <button 
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('sign-in') }}
                  className="block w-full px-4 py-2.5 text-center text-sm font-medium text-stone-700 hover:bg-stone-50 rounded-xl transition-colors"
                >
                  Log in
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); openAuthModal('sign-up') }}
                  className="block w-full px-4 py-2.5 text-center text-sm font-medium text-white bg-stone-900 hover:bg-stone-800 rounded-xl transition-colors"
                >
                  Start free
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- 1. Hero Section --- */}
      <section className="pt-28 pb-12 md:pt-32 md:pb-16 lg:pt-48 lg:pb-32 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-12 gap-8 lg:gap-24">
          
          {/* Text Column */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-[56px] leading-[1.1] text-[#141414] mb-6 lg:mb-8">
              Deliver Galleries Faster. <br />
              <span className="italic font-light">Keep More Profit.</span>
            </h1>
            <p className="text-base sm:text-lg text-[#525252] leading-relaxed mb-8 lg:mb-10 max-w-md">
              12IMG is the lean, mobile-first gallery platform for modern photographers. 
              Beautiful delivery, automated backups, and 40% more affordable than the rest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={() => openAuthModal('sign-up')}
                className="bg-[#141414] text-white px-8 py-4 text-center font-bold hover:bg-black transition-colors rounded-[2px] min-w-[160px]"
              >
                Start free
              </button>
              <Link href="/view-reel/demo" className="bg-transparent border border-[#141414] text-[#141414] px-8 py-4 text-center font-bold hover:bg-[#141414] hover:text-white transition-colors rounded-[2px] min-w-[160px]">
                View sample
              </Link>
            </div>
          </div>

          {/* Visual Column */}
          <div className="lg:col-span-7 relative">
            <div className="relative z-10 bg-white p-2 shadow-2xl border border-gray-100 aspect-[4/3] w-full max-w-[700px] ml-auto">
               <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                 <Image 
                   src="/images/showcase/modern-wedding-gallery-01.jpg" 
                   alt="Gallery Dashboard" 
                   fill 
                   className="object-cover"
                   priority
                 />
               </div>
            </div>
            {/* Overlapping Element */}
            <div className="absolute -bottom-12 -left-4 lg:-left-12 z-20 w-48 h-64 bg-white p-2 shadow-xl border border-gray-100 hidden sm:block">
              <div className="relative w-full h-full bg-gray-100 overflow-hidden">
                <Image 
                   src="/images/showcase/modern-wedding-gallery-02.jpg" 
                   alt="Mobile View" 
                   fill 
                   className="object-cover"
                 />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 2. Migration Section --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          <div className="order-2 lg:order-1 relative h-[300px] sm:h-[400px] lg:h-[500px] bg-[#F5F5F7] w-full border border-[#E5E5E5]">
            <div className="absolute inset-8 border border-[#E5E5E5] bg-white p-2 shadow-sm">
              <div className="relative w-full h-full overflow-hidden bg-gray-50">
                <Image 
                  src="/images/showcase/modern-wedding-gallery-04.jpg" 
                  alt="Migration Dashboard" 
                  fill 
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Switch in a weekend, <br />
              keep your brand.
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              Moving to 12IMG is simple. Our tools help you transfer your client data and active galleries without downtime. Keep your custom domain and your brand integrity.
            </p>
            <Link href="#" className="text-[#141414] font-medium border-b border-[#141414] pb-0.5 hover:text-gray-600 hover:border-gray-600 transition-colors">
              Learn about migration
            </Link>
          </div>

        </div>
      </section>

      {/* --- 3. Client Galleries Experience --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          {/* Left: Visual */}
          <div className="relative">
             <div className="aspect-[3/4] max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] bg-white p-2 shadow-xl border border-gray-100 mx-auto lg:mr-auto">
               <div className="w-full h-full bg-gray-50 overflow-hidden relative">
                  <Image 
                     src="/images/showcase/modern-wedding-gallery-03.jpg" 
                     alt="Mobile Gallery" 
                     fill 
                     className="object-cover"
                   />
               </div>
             </div>
          </div>

          {/* Right: Copy */}
          <div>
            <div className="inline-block px-3 py-1 border border-[#141414] text-xs font-medium uppercase tracking-wider mb-6">
              Client Experience
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Designed for the mobile generation.
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              Your clients view 80% of your work on their phones. 12IMG is built mobile-first, ensuring your images look stunning on any screen size without awkward cropping or slow load times.
            </p>
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Smart image grouping, no generic masonry</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Instant touch interactions</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5" />
                <span className="text-[#525252]">Crisp, full-bleed mobile layouts</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* --- 4. Auto Zip & Backups --- */}
      <section id="backup" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-y border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6">
              Automatic Zip Backups. <br />
              <span className="text-[#525252] italic">Peace of mind included.</span>
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-6">
              Every time you upload a gallery, 12IMG automatically generates a ZIP archive and emails a download link to you. 
            </p>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              It’s a failsafe backup that lives in your inbox, ensuring you never lose client deliverables even if you accidentally delete a gallery.
            </p>
          </div>

          <div className="h-[250px] sm:h-[300px] lg:h-[400px] bg-[#F5F5F7] border border-[#E5E5E5] flex items-center justify-center p-6 sm:p-12">
             <div className="flex items-center gap-3 sm:gap-6 opacity-60">
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center">
                  <Upload className="w-5 h-5 sm:w-8 sm:h-8" />
                </div>
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center bg-[#141414] text-white">
                  <span className="font-bold text-[10px] sm:text-xs">ZIP</span>
                </div>
                <ArrowRight className="w-4 h-4 sm:w-6 sm:h-6" />
                <div className="w-14 h-20 sm:w-24 sm:h-32 border-2 border-[#141414] flex items-center justify-center rounded-full border-dashed">
                  <span className="text-[10px] sm:text-xs font-serif">Email</span>
                </div>
             </div>
          </div>

        </div>
      </section>

      {/* --- 5. Email Tracking Feature --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#141414] text-white">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          <div>
            <span className="inline-block px-3 py-1 border border-white/30 text-xs font-medium uppercase tracking-wider mb-6">
              Client Insights
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] mb-6">
              Know when clients <br />
              <span className="italic">view & download.</span>
            </h2>
            <p className="text-white/70 text-lg leading-relaxed mb-8">
              Track every email you send. See when clients open your gallery links, 
              click through to view, and download their photos. No more wondering 
              if they received it.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                <span className="text-white/80">Open tracking for every email</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                <span className="text-white/80">Click tracking on gallery links</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                <span className="text-white/80">Download confirmation</span>
              </li>
            </ul>
          </div>
          <div className="relative">
            <div className="bg-[#222] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium">Email Activity</p>
                  <p className="text-sm text-white/50">Smith Wedding Gallery</p>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    <span className="text-sm">sarah@email.com</span>
                  </div>
                  <span className="text-xs text-white/50">Opened · Downloaded</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-sm">john@email.com</span>
                  </div>
                  <span className="text-xs text-white/50">Opened · 2h ago</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-stone-500"></div>
                    <span className="text-sm">mom@email.com</span>
                  </div>
                  <span className="text-xs text-white/50">Sent · Pending</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 6. Features Grid --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            
            {[
              { icon: Zap, title: "Fast on Mobile", desc: "Optimized for speed. Your galleries load instantly on 4G and 5G networks." },
              { icon: Shield, title: "Secure Storage", desc: "Enterprise-grade encryption and redundancy for your precious images." },
              { icon: Lock, title: "Your Branding", desc: "Remove our logo, add yours. Custom domains and color palettes included." },
              { icon: Check, title: "Made by Creatives", desc: "Built by working photographers who understand your daily workflow." }
            ].map((feature, i) => (
              <div key={i} className="border border-[#E5E5E5] bg-white p-8 h-full hover:border-[#141414] transition-colors duration-300">
                <feature.icon className="w-6 h-6 mb-6 text-[#141414]" />
                <h3 className="font-serif text-xl mb-3">{feature.title}</h3>
                <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* --- 7. Why 12img --- */}
      <section className="py-12 md:py-20 px-4 sm:px-6 border-t border-[#E5E5E5] bg-white">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[36px] mb-4">Built different.</h2>
          <p className="text-[#525252] text-lg max-w-2xl mx-auto">
            No bloat. No complexity. Just the features photographers actually need, 
            at a price that makes sense.
          </p>
        </div>
      </section>

      {/* --- 8. Testimonials --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">What photographers are saying</h2>
            <p className="text-[#525252] text-lg">Real feedback from real creatives.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white p-6 sm:p-8 border border-[#E5E5E5] relative">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#141414] text-[#141414]" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-[#E5E5E5] absolute top-6 right-6" />
              <p className="text-[#525252] leading-relaxed mb-6">
                "Finally, a gallery platform that doesn't feel bloated. My clients love how fast the galleries load on their phones. The automatic ZIP backup is a game-changer."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  JM
                </div>
                <div>
                  <p className="font-medium text-sm">Jessica Martinez</p>
                  <p className="text-xs text-[#525252]">Wedding Photographer, Austin TX</p>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white p-6 sm:p-8 border border-[#E5E5E5] relative">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#141414] text-[#141414]" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-[#E5E5E5] absolute top-6 right-6" />
              <p className="text-[#525252] leading-relaxed mb-6">
                "I switched from my old gallery platform and cut my costs by 40%. The interface is cleaner, uploads are faster, and my workflow is so much simpler now."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  DK
                </div>
                <div>
                  <p className="font-medium text-sm">David Kim</p>
                  <p className="text-xs text-[#525252]">Portrait Photographer, Seattle WA</p>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white p-6 sm:p-8 border border-[#E5E5E5] relative md:col-span-2 lg:col-span-1">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#141414] text-[#141414]" />
                ))}
              </div>
              <Quote className="w-8 h-8 text-[#E5E5E5] absolute top-6 right-6" />
              <p className="text-[#525252] leading-relaxed mb-6">
                "The mobile experience is incredible. My clients can browse hundreds of photos without any lag. It's exactly what I needed for destination weddings."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                  SR
                </div>
                <div>
                  <p className="font-medium text-sm">Sarah Rodriguez</p>
                  <p className="text-xs text-[#525252]">Destination Wedding Photographer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 9. How It Works --- */}
      <section id="features" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 lg:mb-20">
            <span className="inline-block px-3 py-1 border border-[#141414] text-xs font-medium uppercase tracking-wider mb-6">
              How It Works
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">
              From upload to delivery in minutes
            </h2>
            <p className="text-[#525252] text-lg max-w-2xl mx-auto">
              A streamlined workflow designed for busy photographers. No complexity, just results.
            </p>
          </div>

          {/* Step 1: Try It - Interactive Demo */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-sm font-medium text-emerald-700 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Try it free
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                Create a beautiful card
              </h3>
              <p className="text-[#525252] text-lg leading-relaxed mb-6">
                Drop any photo and instantly get a stunning shareable card. No sign-up required—see how beautiful your images can look with 12img.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Elegant print-style display
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Instant shareable link
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Free for 30 days
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <DemoCardGenerator />
            </div>
          </div>

          {/* Step 2: Customize */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
            <div className="relative">
              <div className="aspect-[4/3] bg-[#F5F5F7] border border-[#E5E5E5] rounded-lg p-6 overflow-hidden">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4 h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Palette className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-sm">Gallery Settings</span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Gallery Title</span>
                      <span className="text-sm font-medium">Smith Wedding 2024</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Password</span>
                      <span className="text-sm font-medium">••••••••</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-600">Downloads</span>
                      <span className="text-sm font-medium text-emerald-600">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F7] rounded-full text-sm font-medium mb-4">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">2</span>
                Customize
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                Make it yours.
              </h3>
              <p className="text-[#525252] text-lg leading-relaxed mb-6">
                Add your branding, set a password, and customize the experience. Your gallery, your rules. Clients see your brand, not ours.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Custom branding & colors
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Password protection
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Download controls
                </li>
              </ul>
            </div>
          </div>

          {/* Step 3: Share */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F7] rounded-full text-sm font-medium mb-4">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">3</span>
                Share
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                One link, instant access.
              </h3>
              <p className="text-[#525252] text-lg leading-relaxed mb-6">
                Share a beautiful link with your clients. They can view, favorite, and download—no account required. Plus, they automatically receive a ZIP backup via email.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  No client login needed
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Automatic ZIP backup email
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Mobile-optimized viewing
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/3] bg-[#F5F5F7] border border-[#E5E5E5] rounded-lg p-6 flex items-center justify-center">
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 w-full max-w-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Smith Wedding 2024</p>
                      <p className="text-xs text-gray-500">248 photos</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg mb-4">
                    <span className="text-sm text-gray-600 truncate flex-1">12img.com/g/smith-wedding</span>
                    <button className="p-2 hover:bg-gray-200 rounded-lg transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#141414] text-white text-sm font-medium rounded-lg">
                      Copy Link
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg">
                      Email
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 10. Pricing Preview --- */}
      <section id="pricing" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">Simple, honest pricing.</h2>
            <p className="text-[#525252] text-lg">No hidden fees. Change plans anytime.</p>
          </div>

          {/* Pricing Matrix */}
          <PricingMatrix showAllFeatures={false} />
          
          <div className="text-center mt-10">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-[#141414] hover:text-gray-600 transition-colors">
              View full feature comparison
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* --- 9. Final CTA --- */}
      <section className="py-16 md:py-24 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5] text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[52px] leading-tight mb-6 lg:mb-8">
            Ready to send your next <br /> gallery with 12IMG?
          </h2>
          <p className="text-lg text-[#525252] mb-10">
            Join thousands of photographers who have simplified their workflow.
          </p>
          <Link href="/sign-up" className="inline-block bg-[#141414] text-white px-10 py-4 text-center font-medium hover:bg-black transition-colors rounded-[2px] min-w-[200px]">
            Start for free
          </Link>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-[#141414] text-white/60 py-12 md:py-20 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <div className="col-span-2 md:col-span-1">
             <div className="flex items-center gap-2 mb-6 text-white">
                <div className="w-6 h-6 bg-white flex items-center justify-center text-black font-bold text-[10px] tracking-tighter">
                  12
                </div>
                <span className="font-serif text-lg font-medium tracking-tight">img</span>
             </div>
             <p className="text-sm leading-relaxed mb-6">
               Minimal gallery delivery for professional photographers.
             </p>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-6">Product</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Client Galleries</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Sample Galleries</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Resources</h4>
            <ul className="space-y-4 text-sm">
              <li><Link href="#" className="hover:text-white transition-colors">Help Center</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="#" className="hover:text-white transition-colors">Terms of Service</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-medium mb-6">Social</h4>
            <div className="flex gap-4">
               {/* Social Icons */}
               <Link href="https://instagram.com/12img" target="_blank" className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors rounded-full">
                 <Instagram className="w-4 h-4 text-white" />
               </Link>
            </div>
          </div>
        </div>
        <div className="max-w-[1280px] mx-auto mt-20 pt-8 border-t border-white/10 text-xs flex justify-between">
           <p>© {new Date().getFullYear()} 12IMG. All rights reserved.</p>
           <p>Made for photographers.</p>
        </div>
      </footer>

    </div>
  )
}
