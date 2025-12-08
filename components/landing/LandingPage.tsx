'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { Menu, X, ArrowRight, Upload, Lock, Shield, Zap, Check, Instagram, Quote, Star, Play, Image as ImageIcon, Palette, Clock, Mail, LayoutDashboard, FileText, MessageCircle, Users, PenTool, Target, Film, Calendar, TrendingUp, Sparkles, Globe, Camera } from 'lucide-react'
import { DemoCardGenerator } from './DemoCardGenerator'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { useAuthModal } from '@/components/auth/AuthModal'
import { useAuth, UserButton } from '@clerk/nextjs'

// --- Landing Page Component ---

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { openAuthModal } = useAuthModal()
  const { isSignedIn, isLoaded } = useAuth()

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
              <Link href="#contracts" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Contracts
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
            {isLoaded && isSignedIn ? (
              <>
                {/* Dashboard Link */}
                <Link 
                  href="/"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-all hidden sm:flex"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                
                {/* User Button */}
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-7 h-7'
                    }
                  }}
                />
              </>
            ) : (
              <>
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
              </>
            )}
            
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
                <Link href="#contracts" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Contracts</span>
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
                {isLoaded && isSignedIn ? (
                  <>
                    <Link 
                      href="/"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-600 hover:bg-stone-50 transition-all"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      <span className="font-medium">Dashboard</span>
                    </Link>
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: 'w-9 h-9'
                          }
                        }}
                      />
                      <span className="text-sm text-stone-500">Account</span>
                    </div>
                  </>
                ) : (
                  <>
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
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* --- 1. Hero Section --- */}
      <section className="pt-28 pb-16 md:pt-32 md:pb-20 lg:pt-44 lg:pb-28 px-4 sm:px-6">
        <div className="max-w-[1280px] mx-auto">
          
          {/* Centered Hero Content */}
          <div className="text-center max-w-4xl mx-auto mb-12 lg:mb-16">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[64px] leading-[1.1] text-[#141414] mb-6">
              The complete platform for <br className="hidden sm:block" />
              <span className="italic font-light">modern photographers.</span>
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-[#525252] leading-relaxed mb-8 max-w-2xl mx-auto">
              Galleries. Contracts. Client portals. Email tracking. All in one place—at 40% less than the competition.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <button 
                onClick={() => openAuthModal('sign-up')}
                className="group bg-[#141414] text-white px-8 py-4 text-center font-bold hover:bg-black transition-all rounded-[2px] min-w-[180px] flex items-center justify-center gap-2"
              >
                Start free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <Link href="/view-reel/demo" className="bg-transparent border border-[#141414] text-[#141414] px-8 py-4 text-center font-bold hover:bg-[#141414] hover:text-white transition-colors rounded-[2px] min-w-[180px] flex items-center justify-center gap-2">
                <Play className="w-4 h-4" />
                Watch demo
              </Link>
            </div>

            {/* Feature Pills */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <Film className="w-4 h-4 text-violet-500" />
                <span>Cinematic Reels</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <FileText className="w-4 h-4 text-emerald-500" />
                <span>Smart Contracts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Client Portals</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <Mail className="w-4 h-4 text-amber-500" />
                <span>Email Tracking</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <Zap className="w-4 h-4 text-pink-500" />
                <span>Turbo Uploads</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full text-sm text-stone-600 shadow-sm">
                <Calendar className="w-4 h-4 text-indigo-500" />
                <span>Delivery Tracking</span>
              </div>
            </div>
          </div>

          {/* Visual Showcase */}
          <div className="relative">
            {/* Main dashboard mockup */}
            <div className="relative z-10 bg-white p-2 shadow-2xl border border-gray-100 aspect-[16/9] w-full max-w-[1000px] mx-auto rounded-lg overflow-hidden">
              <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded">
                <Image 
                  src="/images/showcase/modern-wedding-gallery-01.jpg" 
                  alt="Gallery Dashboard" 
                  fill 
                  className="object-cover"
                  priority
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
            
            {/* Floating feature cards */}
            <div className="absolute -bottom-6 left-4 lg:left-8 z-20 bg-white p-4 shadow-xl border border-gray-100 rounded-xl hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-[#141414]">Contract Signed</p>
                <p className="text-xs text-stone-500">Sarah Johnson • Just now</p>
              </div>
            </div>
            
            <div className="absolute -bottom-6 right-4 lg:right-8 z-20 bg-white p-4 shadow-xl border border-gray-100 rounded-xl hidden md:flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Mail className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-[#141414]">Gallery Opened</p>
                <p className="text-xs text-stone-500">john@email.com • 2m ago</p>
              </div>
            </div>
            
            {/* Mobile phone mockup */}
            <div className="absolute -top-8 -right-4 lg:right-12 z-20 w-32 lg:w-40 hidden lg:block">
              <div className="bg-[#1a1a1a] rounded-[1.5rem] p-1.5 shadow-2xl border border-white/10">
                <div className="relative aspect-[9/19] rounded-[1.25rem] overflow-hidden bg-black">
                  <Image 
                    src="/images/showcase/modern-wedding-gallery-02.jpg" 
                    alt="Mobile View" 
                    fill 
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play className="w-3 h-3 text-white ml-0.5" fill="white" />
                    </div>
                  </div>
                </div>
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

      {/* --- NEW: Reel Player Feature --- */}
      <section className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-[#141414] text-white relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/20 via-transparent to-purple-900/20" />
        
        <div className="max-w-[1280px] mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 border border-white/20 rounded-full mb-6 backdrop-blur-sm">
                <Film className="w-4 h-4 text-violet-400" />
                <span className="text-sm font-medium text-white/90">Cinematic Experience</span>
              </div>
              <h2 className="font-serif text-3xl sm:text-4xl lg:text-[56px] mb-6 leading-tight">
                Your galleries, <br />
                <span className="italic text-violet-300">in motion.</span>
              </h2>
              <p className="text-white/60 text-lg lg:text-xl leading-relaxed mb-8">
                The Reel Player transforms your galleries into a 30-second cinematic slideshow. 
                Auto-playing, full-screen, with smooth Ken Burns effects. This is how clients 
                experience your work.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-violet-400" />
                  <span className="text-white/80">Auto-plays on gallery open</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-violet-400" />
                  <span className="text-white/80">Smooth Ken Burns pan & zoom</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-violet-400" />
                  <span className="text-white/80">Full-screen immersive experience</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-violet-400" />
                  <span className="text-white/80">Works on all devices</span>
                </li>
              </ul>
              <Link 
                href="/view-reel/demo" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-[#141414] font-medium rounded-full hover:bg-white/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                Watch Demo Reel
              </Link>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-violet-500/30 via-purple-500/20 to-pink-500/30 blur-3xl opacity-60" />
              
              {/* Phone mockup */}
              <div className="relative mx-auto w-[280px] sm:w-[320px]">
                <div className="relative bg-[#1a1a1a] rounded-[3rem] p-3 shadow-2xl border border-white/10">
                  {/* Phone notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a1a] rounded-b-2xl z-10" />
                  
                  {/* Screen */}
                  <div className="relative aspect-[9/19] rounded-[2.5rem] overflow-hidden bg-black">
                    <Image 
                      src="/images/showcase/modern-wedding-gallery-01.jpg" 
                      alt="Reel Player Preview" 
                      fill 
                      className="object-cover"
                    />
                    {/* Play overlay */}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <Play className="w-6 h-6 text-white ml-1" fill="white" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-6 left-4 right-4">
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-white rounded-full" />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] text-white/60">
                        <span>0:12</span>
                        <span>0:30</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-4 px-4 py-2 bg-violet-500 text-white text-sm font-medium rounded-full shadow-lg shadow-violet-500/30">
                  ✨ Auto-plays
                </div>
              </div>
            </div>
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

      {/* --- 6. Smart Contracts Feature --- */}
      <section id="contracts" className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-white relative overflow-hidden">
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        
        <div className="max-w-[1280px] mx-auto relative">
          {/* Section header */}
          <div className="text-center mb-16 lg:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200/50 rounded-full mb-6">
              <FileText className="w-4 h-4 text-violet-600" />
              <span className="text-sm font-medium text-violet-700">Smart Contracts</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[56px] mb-6 leading-tight">
              Contracts that <span className="italic">close deals.</span>
            </h2>
            <p className="text-[#525252] text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Professional contracts with built-in e-signatures. Send, track, and get signed—all without leaving 12img.
            </p>
          </div>

          {/* Main visual showcase */}
          <div className="relative mb-16 lg:mb-24">
            {/* Contract mockup - centered hero */}
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                {/* Glow effect behind */}
                <div className="absolute -inset-4 bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-pink-500/10 blur-3xl opacity-60" />
                
                {/* Main contract card */}
                <div className="relative bg-white border border-[#E5E5E5] rounded-2xl shadow-2xl shadow-stone-900/10 overflow-hidden">
                  {/* Contract header */}
                  <div className="bg-gradient-to-r from-[#141414] to-[#1a1a1a] text-white px-6 sm:px-8 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-medium">Wedding Photography Agreement</p>
                        <p className="text-sm text-white/60">Sarah & James • June 15, 2025</p>
                      </div>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/30 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-sm text-emerald-300 font-medium">Signed</span>
                    </div>
                  </div>
                  
                  {/* Contract body preview */}
                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                      {/* Left: Contract preview */}
                      <div>
                        <div className="prose prose-sm max-w-none">
                          <div className="space-y-4 text-[#525252]">
                            <div className="flex items-center gap-3 text-[#141414] font-medium">
                              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">1</span>
                              Services & Coverage
                            </div>
                            <p className="text-sm leading-relaxed pl-9">
                              Photographer agrees to provide 8 hours of wedding photography coverage on the event date, including ceremony, reception, and formal portraits...
                            </p>
                            
                            <div className="flex items-center gap-3 text-[#141414] font-medium pt-2">
                              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">2</span>
                              Investment & Payment
                            </div>
                            <p className="text-sm leading-relaxed pl-9">
                              Total investment: <span className="font-semibold text-[#141414]">$4,500</span>. A retainer of $1,500 is due upon signing to secure the date...
                            </p>
                            
                            <div className="flex items-center gap-3 text-[#141414] font-medium pt-2">
                              <span className="w-6 h-6 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">3</span>
                              Deliverables & Timeline
                            </div>
                            <p className="text-sm leading-relaxed pl-9">
                              Client will receive a private online gallery within 6-8 weeks containing 400-600 edited images...
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Right: Signature area */}
                      <div className="lg:border-l lg:border-[#E5E5E5] lg:pl-12">
                        <div className="bg-gradient-to-br from-[#FAFAFA] to-[#F5F5F7] rounded-xl p-6 border border-[#E5E5E5]">
                          <div className="flex items-center gap-2 mb-4">
                            <PenTool className="w-4 h-4 text-[#525252]" />
                            <span className="text-sm font-medium text-[#525252]">Client Signature</span>
                          </div>
                          
                          {/* Signature display */}
                          <div className="bg-white rounded-lg border border-[#E5E5E5] p-4 mb-4 min-h-[80px] flex items-center">
                            <span className="font-serif italic text-3xl text-[#141414]">Sarah Johnson</span>
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-[#525252]">
                            <span>Signed Dec 1, 2024 at 3:42 PM</span>
                            <span className="flex items-center gap-1 text-emerald-600">
                              <Check className="w-3 h-3" />
                              Verified
                            </span>
                          </div>
                        </div>
                        
                        {/* Quick stats */}
                        <div className="grid grid-cols-2 gap-4 mt-6">
                          <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
                            <p className="text-2xl font-light text-[#141414]">2h</p>
                            <p className="text-xs text-[#525252]">Time to sign</p>
                          </div>
                          <div className="bg-[#F5F5F7] rounded-lg p-4 text-center">
                            <p className="text-2xl font-light text-[#141414]">100%</p>
                            <p className="text-xs text-[#525252]">Legally binding</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[
              {
                icon: FileText,
                title: 'Smart Templates',
                desc: 'Start with professional templates for weddings, portraits, and events. Customize everything.',
                gradient: 'from-violet-500 to-purple-500',
              },
              {
                icon: PenTool,
                title: 'E-Signatures',
                desc: 'Legally-binding signatures on any device. No printing, scanning, or faxing required.',
                gradient: 'from-blue-500 to-cyan-500',
              },
              {
                icon: Users,
                title: 'Merge Fields',
                desc: 'Auto-fill client names, dates, and package details. One template, infinite personalization.',
                gradient: 'from-emerald-500 to-teal-500',
              },
              {
                icon: Mail,
                title: 'Track Everything',
                desc: 'Know when contracts are viewed, signed, and downloaded. Never follow up blindly.',
                gradient: 'from-orange-500 to-rose-500',
              },
            ].map((feature, i) => (
              <div 
                key={i} 
                className="group relative bg-white border border-[#E5E5E5] rounded-xl p-6 hover:border-[#141414] transition-all duration-300 hover:shadow-lg"
              >
                {/* Icon with gradient background */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg shadow-${feature.gradient.split('-')[1]}-500/20`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-medium text-lg mb-2">{feature.title}</h3>
                <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-12 lg:mt-16">
            <p className="text-[#525252] mb-4">Stop chasing signatures. Start closing deals.</p>
            <button 
              onClick={() => openAuthModal('sign-up')}
              className="inline-flex items-center gap-2 bg-[#141414] text-white px-8 py-4 font-medium hover:bg-black transition-colors rounded-full"
            >
              Create Your First Contract
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* --- 7. Client Portal Suite --- */}
      <section className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-gradient-to-b from-[#141414] to-[#1a1a1a] text-white relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        </div>
        
        <div className="max-w-[1280px] mx-auto relative">
          {/* Hero icon - World class treatment */}
          <div className="flex justify-center mb-10">
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-blue-500/20 blur-3xl scale-150" />
              
              {/* Icon container */}
              <div className="relative w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center backdrop-blur-sm">
                {/* Inner icon */}
                <svg 
                  className="w-12 h-12 lg:w-16 lg:h-16 text-white" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="1.5"
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  {/* Custom portal icon - overlapping cards with user */}
                  <rect x="3" y="4" width="14" height="16" rx="2" className="opacity-40" />
                  <rect x="7" y="2" width="14" height="16" rx="2" fill="currentColor" fillOpacity="0.1" />
                  <circle cx="14" cy="8" r="2.5" />
                  <path d="M10 16c0-2.2 1.8-4 4-4s4 1.8 4 4" />
                  <path d="M18 20h2a2 2 0 0 0 2-2v-1" className="opacity-60" />
                  <path d="M22 13v-2" className="opacity-60" />
                </svg>
                
                {/* Floating badge */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16 lg:mb-20">
            <span className="inline-block px-4 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs font-medium uppercase tracking-wider mb-6 backdrop-blur-sm">
              ✨ New Feature
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[56px] mb-6 leading-tight">
              Your complete<br />client portal.
            </h2>
            <p className="text-white/60 text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Contracts, messaging, and gallery delivery—all in one beautiful place. 
              No more juggling between apps.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16">
            {/* Left: Visual mockup */}
            <div className="relative">
              <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl overflow-hidden">
                {/* Portal header */}
                <div className="bg-[#141414] text-white px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Sarah & James Wedding</p>
                      <p className="text-xs text-white/60">Client Portal</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span className="text-xs text-white/60">Active</span>
                  </div>
                </div>
                {/* Portal tabs */}
                <div className="flex border-b border-[#E5E5E5]">
                  <button className="flex-1 px-4 py-3 text-sm font-medium text-[#141414] border-b-2 border-[#141414] flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" />
                    Contract
                  </button>
                  <button className="flex-1 px-4 py-3 text-sm font-medium text-[#525252] flex items-center justify-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Messages
                  </button>
                  <button className="flex-1 px-4 py-3 text-sm font-medium text-[#525252] flex items-center justify-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Gallery
                  </button>
                </div>
                {/* Contract preview */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-medium text-sm">Wedding Photography Contract</p>
                      <p className="text-xs text-[#525252]">Sent Dec 1, 2024</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">
                      Signed ✓
                    </span>
                  </div>
                  <div className="bg-[#F5F5F7] rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <PenTool className="w-4 h-4 text-[#525252]" />
                      <span className="text-sm text-[#525252]">Signature</span>
                    </div>
                    <div className="h-12 flex items-center">
                      <span className="font-serif italic text-2xl text-[#141414]">Sarah Johnson</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 bg-[#141414] text-white text-sm font-medium rounded-lg">
                      Download PDF
                    </button>
                    <button className="px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg">
                      View
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4 text-white">
                Contracts that get signed.
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                Send beautiful, legally-binding contracts with built-in e-signatures. 
                Clients can review and sign from any device—no printing, scanning, or faxing required.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Professional contract templates</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Legally-binding e-signatures</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Automatic PDF generation</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Merge fields for personalization</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Milestone Tracking Feature */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16">
            {/* Left: Visual mockup */}
            <div className="relative">
              <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-[#141414]">Project Timeline</p>
                    <p className="text-xs text-[#525252]">Smith Wedding</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                    In Progress
                  </span>
                </div>
                {/* Timeline */}
                <div className="p-6">
                  <div className="space-y-4">
                    {[
                      { title: "Contract Signed", date: "Dec 1", done: true },
                      { title: "Event Completed", date: "Dec 15", done: true },
                      { title: "Editing Started", date: "Dec 18", done: true },
                      { title: "Gallery Published", date: "Jan 5", done: false, current: true },
                      { title: "Delivery Complete", date: "Jan 15", done: false },
                    ].map((step, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.done ? 'bg-emerald-500' : step.current ? 'bg-blue-500 animate-pulse' : 'bg-gray-200'
                        }`}>
                          {step.done ? (
                            <Check className="w-4 h-4 text-white" />
                          ) : (
                            <span className={`w-2 h-2 rounded-full ${step.current ? 'bg-white' : 'bg-gray-400'}`} />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm font-medium ${step.done ? 'text-[#141414]' : 'text-[#525252]'}`}>{step.title}</p>
                        </div>
                        <span className="text-xs text-[#525252]">{step.date}</span>
                      </div>
                    ))}
                  </div>
                  {/* Delivery countdown */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-600 font-medium uppercase tracking-wider">Delivery Countdown</p>
                        <p className="text-2xl font-light text-[#141414] mt-1">12 days remaining</p>
                      </div>
                      <div className="w-16 h-16 rounded-full border-4 border-blue-200 flex items-center justify-center">
                        <span className="text-lg font-medium text-blue-600">60%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full text-sm font-medium text-blue-300 mb-4">
                <Calendar className="w-4 h-4" />
                New Feature
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4 text-white">
                Track every milestone.
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                From contract signing to final delivery, visualize your entire project timeline. 
                Automatic status updates keep clients informed without manual follow-ups.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Visual project timeline</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Automatic delivery countdown</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Client-facing progress view</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Status change notifications</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Messaging feature */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
            {/* Left: Copy */}
            <div className="order-2 lg:order-1">
              <h3 className="font-serif text-2xl lg:text-3xl mb-4 text-white">
                Real-time messaging, built in.
              </h3>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                Keep all client communication in one place. No more lost emails or scattered 
                text threads. Clients can message you directly from their portal.
              </p>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Instant notifications</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Read receipts & typing indicators</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">File & image attachments</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 text-emerald-400" />
                  <span className="text-white/70">Full conversation history</span>
                </li>
              </ul>
            </div>

            {/* Right: Visual mockup */}
            <div className="order-1 lg:order-2 relative">
              <div className="bg-white border border-[#E5E5E5] rounded-xl shadow-xl overflow-hidden">
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-[#E5E5E5] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-sm font-bold text-gray-600">
                    SJ
                  </div>
                  <div>
                    <p className="font-medium text-sm">Sarah Johnson</p>
                    <p className="text-xs text-emerald-600">Online now</p>
                  </div>
                </div>
                {/* Messages */}
                <div className="p-4 space-y-4 bg-[#F5F5F7] min-h-[200px]">
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] shadow-sm">
                      <p className="text-sm">Hi! Just wanted to check on the timeline photos 📸</p>
                      <p className="text-xs text-[#525252] mt-1">2:34 PM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-[#141414] text-white rounded-2xl rounded-tr-sm px-4 py-2 max-w-[80%]">
                      <p className="text-sm">Almost done! I'll have them ready by tomorrow 🎉</p>
                      <p className="text-xs text-white/60 mt-1">2:36 PM · Read</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-2 max-w-[80%] shadow-sm">
                      <p className="text-sm">Perfect, can't wait! ❤️</p>
                      <p className="text-xs text-[#525252] mt-1">2:37 PM</p>
                    </div>
                  </div>
                </div>
                {/* Input */}
                <div className="p-4 border-t border-[#E5E5E5] flex items-center gap-2">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 px-4 py-2 bg-[#F5F5F7] rounded-full text-sm outline-none"
                    readOnly
                  />
                  <button className="w-10 h-10 bg-[#141414] rounded-full flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. All Features Grid --- */}
      <section className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-white border-t border-[#E5E5E5]">
        <div className="max-w-[1280px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16 lg:mb-24">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-stone-50 to-stone-100 border border-stone-200/50 rounded-full mb-6">
              <Sparkles className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium text-stone-700">Everything You Need</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[56px] mb-6 leading-tight">
              Built for <span className="italic">modern photographers.</span>
            </h2>
            <p className="text-[#525252] text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Every feature designed to save you time, impress your clients, and grow your business.
            </p>
          </div>

          {/* Feature Categories */}
          <div className="space-y-16 lg:space-y-24">
            
            {/* Gallery & Delivery */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-2xl">Gallery & Delivery</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { icon: Film, title: "Cinematic Reel Player", desc: "30-second cinematic slideshow that auto-plays your best shots. The primary way clients experience your galleries.", badge: "Popular" },
                  { icon: Zap, title: "Mobile-First Galleries", desc: "Optimized for speed. Your galleries load instantly on any device with smart image grouping." },
                  { icon: Target, title: "Focal Point Editor", desc: "Set custom crop centers for every image. Perfect framing on any screen size or aspect ratio." },
                  { icon: Upload, title: "Auto ZIP Backups", desc: "Every upload automatically generates a ZIP archive emailed to you. Never lose a gallery." },
                  { icon: Mail, title: "Email Tracking", desc: "Know when clients open, view, and download. Track every interaction with your galleries." },
                  { icon: Lock, title: "Password Protection", desc: "Secure galleries with passwords. Control who sees your work and when." },
                ].map((feature, i) => (
                  <div key={i} className="group relative bg-white border border-[#E5E5E5] rounded-xl p-6 hover:border-[#141414] transition-all duration-300 hover:shadow-lg">
                    {feature.badge && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-violet-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {feature.badge}
                      </span>
                    )}
                    <feature.icon className="w-6 h-6 mb-4 text-violet-600" />
                    <h4 className="font-medium text-lg mb-2">{feature.title}</h4>
                    <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Management */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-2xl">Client Management</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { icon: FileText, title: "Smart Contracts", desc: "Professional templates with merge fields. Auto-fill client names, dates, and package details." },
                  { icon: PenTool, title: "E-Signatures", desc: "Legally-binding signatures on any device. Elegant handwriting fonts for a professional look." },
                  { icon: MessageCircle, title: "Built-in Messaging", desc: "Real-time chat with clients. Read receipts, typing indicators, and file attachments." },
                  { icon: Calendar, title: "Milestone Tracking", desc: "Track every project from contract to delivery. Visual timeline with status updates.", badge: "New" },
                  { icon: TrendingUp, title: "Delivery Countdown", desc: "Automatic countdown from event to delivery. Keep clients informed without manual updates." },
                  { icon: Globe, title: "Client Portal", desc: "One beautiful place for contracts, messages, and galleries. No client login required." },
                ].map((feature, i) => (
                  <div key={i} className="group relative bg-white border border-[#E5E5E5] rounded-xl p-6 hover:border-[#141414] transition-all duration-300 hover:shadow-lg">
                    {feature.badge && (
                      <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">
                        {feature.badge}
                      </span>
                    )}
                    <feature.icon className="w-6 h-6 mb-4 text-emerald-600" />
                    <h4 className="font-medium text-lg mb-2">{feature.title}</h4>
                    <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Your Brand */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-600 flex items-center justify-center">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-serif text-2xl">Your Brand</h3>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                {[
                  { icon: Globe, title: "Public Profile", desc: "Your own photographer profile page. Showcase your work and let clients find you." },
                  { icon: ImageIcon, title: "Curated Portfolio", desc: "Hand-pick your 10 best images. Drag to reorder. Your portfolio, your way." },
                  { icon: Palette, title: "Custom Branding", desc: "Your logo, your colors. Remove our branding entirely on paid plans." },
                  { icon: Shield, title: "Company Rebranding", desc: "Change your business name anytime. Old URLs redirect automatically for 90 days." },
                  { icon: Lock, title: "Visibility Controls", desc: "Public, private, or password-protected. Full control over who sees what." },
                  { icon: Zap, title: "Instant Updates", desc: "Changes go live immediately. No waiting, no cache issues, no delays." },
                ].map((feature, i) => (
                  <div key={i} className="group relative bg-white border border-[#E5E5E5] rounded-xl p-6 hover:border-[#141414] transition-all duration-300 hover:shadow-lg">
                    <feature.icon className="w-6 h-6 mb-4 text-orange-600" />
                    <h4 className="font-medium text-lg mb-2">{feature.title}</h4>
                    <p className="text-[#525252] text-sm leading-relaxed">{feature.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Bottom Stats */}
          <div className="mt-20 lg:mt-32 grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 text-center">
            {[
              { value: "40%", label: "More affordable than competitors" },
              { value: "<2s", label: "Average gallery load time" },
              { value: "100%", label: "Legally-binding contracts" },
              { value: "24/7", label: "Automatic backups" },
            ].map((stat, i) => (
              <div key={i}>
                <p className="font-serif text-4xl lg:text-5xl text-[#141414] mb-2">{stat.value}</p>
                <p className="text-sm text-[#525252]">{stat.label}</p>
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
