'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, ArrowRight, Upload, Lock, Shield, Zap, Check, Instagram, Quote, Star, Image as ImageIcon, Palette, Mail, LayoutDashboard, FileText, MessageCircle, Users, PenTool, Calendar, TrendingUp, Layers, Globe, Camera, Send, Download, Eye, Heart } from 'lucide-react'
import { PricingMatrix } from '@/components/pricing/PricingMatrix'
import { useAuthModal } from '@/components/auth/AuthModal'
import { useAuth, UserButton } from '@clerk/nextjs'
import { CommunitySpotlightCardClient } from '@/components/spotlight/CommunitySpotlightCardClient'
import { PromoModal } from './PromoHint'
import { PromoTopBar } from './PromoTopBar'
import { FeatureGrid } from './FeatureGrid'
import { FeatureBento } from './FeatureBento'
import { AnimatePresence, motion } from 'framer-motion'

// Notification data for rotating cards
const leftNotifications = [
  { icon: Check, iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', title: 'Contract Signed', subtitle: 'Sarah Johnson • Just now' },
  { icon: MessageCircle, iconBg: 'bg-violet-100', iconColor: 'text-violet-600', title: 'New Message', subtitle: 'Client Portal • 1m ago' },
  { icon: Calendar, iconBg: 'bg-amber-100', iconColor: 'text-amber-600', title: 'Reminder Sent', subtitle: 'Automation • 3m ago' },
  { icon: Users, iconBg: 'bg-rose-100', iconColor: 'text-rose-600', title: 'Vendor Downloaded', subtitle: 'Bloom Florals • 5m ago' },
  { icon: Heart, iconBg: 'bg-pink-100', iconColor: 'text-pink-600', title: 'Favorited 12 Photos', subtitle: 'Emma & James • 8m ago' },
]

const rightNotifications = [
  { icon: Mail, iconBg: 'bg-blue-100', iconColor: 'text-blue-600', title: 'Gallery Opened', subtitle: 'john@email.com • 2m ago' },
  { icon: Download, iconBg: 'bg-teal-100', iconColor: 'text-teal-600', title: 'Gallery Downloaded', subtitle: 'Full resolution • 4m ago' },
  { icon: Eye, iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600', title: '47 Views Today', subtitle: 'Wedding Gallery • Live' },
  { icon: Send, iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600', title: 'Email Delivered', subtitle: 'Gallery invite • 6m ago' },
  { icon: FileText, iconBg: 'bg-orange-100', iconColor: 'text-orange-600', title: 'Contract Viewed', subtitle: 'Mike Chen • 10m ago' },
]

function RotatingNotification({ position }: { position: 'left' | 'right' }) {
  const [index, setIndex] = useState(0)
  const notifications = position === 'left' ? leftNotifications : rightNotifications
  
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % notifications.length)
    }, 3000)
    return () => clearInterval(interval)
  }, [notifications.length])
  
  const current = notifications[index]
  const Icon = current.icon
  
  return (
    <div className={`absolute -bottom-6 ${position === 'left' ? 'left-4 lg:left-8' : 'right-4 lg:right-8'} z-20 hidden md:block`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white p-4 shadow-xl border border-gray-100 rounded-xl flex items-center gap-3"
        >
          <div className={`w-10 h-10 rounded-full ${current.iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${current.iconColor}`} />
          </div>
          <div>
            <p className="font-medium text-sm text-[#141414]">{current.title}</p>
            <p className="text-xs text-stone-500">{current.subtitle}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

// --- Landing Page Component ---

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [featureModalOpen, setFeatureModalOpen] = useState(false)
  const [featureRequest, setFeatureRequest] = useState('')
  const [featureEmail, setFeatureEmail] = useState('')
  const [featureSubmitted, setFeatureSubmitted] = useState(false)
  const [featureSubmitting, setFeatureSubmitting] = useState(false)
  const { openAuthModal } = useAuthModal()
  const { isSignedIn, isLoaded } = useAuth()

  const handleFeatureSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!featureRequest.trim()) return
    
    setFeatureSubmitting(true)
    
    try {
      const response = await fetch('/api/feature-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: featureEmail.trim() || null,
          request: featureRequest.trim(),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit')
      }

      setFeatureSubmitted(true)
      
      // Reset after showing success
      setTimeout(() => {
        setFeatureModalOpen(false)
        setTimeout(() => {
          setFeatureSubmitted(false)
          setFeatureRequest('')
          setFeatureEmail('')
        }, 300)
      }, 2000)
    } catch (error) {
      console.error('Error submitting feature request:', error)
      // Still show success to user (we don't want to frustrate them)
      setFeatureSubmitted(true)
    } finally {
      setFeatureSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#141414] font-sans selection:bg-black selection:text-white">
      
      {/* Promo Top Bar - Flash sale announcement */}
      <PromoTopBar />
      
      {/* Promo Modal - Subtle popup on visit */}
      <PromoModal />
      
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
            
            {/* Nav Links - Desktop (simplified) */}
            <div className="hidden md:flex items-center">
              <a href="#features" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Features
              </a>
              <a href="#pricing" className="px-3 py-1.5 rounded-full text-sm font-medium text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition-all">
                Pricing
              </a>
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
                <a href="#features" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Features</span>
                </a>
                <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all">
                  <span className="font-medium">Pricing</span>
                </a>
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
            {/* Pain Point - Hook them with their problem */}
            <p className="text-sm sm:text-base text-stone-500 mb-4 tracking-wide">
              Tired of juggling 5 different apps just to run your business?
            </p>
            
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-[64px] leading-[1.1] text-[#141414] mb-6">
              Stop chasing clients.<br className="hidden sm:block" />
              <span className="italic font-light">Start creating.</span>
            </h1>
            
            {/* Agitate + Solve - Show you understand, then offer the solution */}
            <p className="text-base sm:text-lg lg:text-xl text-[#525252] leading-relaxed mb-8 max-w-2xl mx-auto">
              No more lost emails. No more unsigned contracts. No more "did they see my gallery?" 
              <span className="text-stone-900 font-medium"> Everything in one place—</span>so you can focus on what you love.
            </p>
            
            {/* CTA Button - Single, elegant */}
            <div className="flex justify-center">
              <button 
                onClick={() => openAuthModal('sign-up')}
                className="group bg-[#141414] text-white px-10 py-4 text-center font-medium hover:bg-black transition-all rounded-[2px] flex items-center justify-center gap-3"
              >
                Start free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            
          </div>

          {/* Visual Showcase */}
          <div className="relative">
            {/* Main dashboard mockup */}
            <div className="relative z-10 bg-white p-2 shadow-2xl border border-gray-100 aspect-[16/9] w-full max-w-[1000px] mx-auto rounded-lg overflow-hidden">
              <div className="relative w-full h-full bg-gray-100 overflow-hidden rounded">
                <Image 
                  src="/images/showcase/modern-wedding-gallery-02.jpg" 
                  alt="Beautiful wedding gallery showcase" 
                  fill 
                  className="object-cover"
                  priority
                />
                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
              </div>
            </div>
            
            {/* Floating feature cards - Rotating */}
            <RotatingNotification position="left" />
            <RotatingNotification position="right" />
            
            {/* Mobile phone mockup */}
            <div className="absolute -top-8 -right-4 lg:right-12 z-20 w-32 lg:w-40 hidden lg:block">
              <div className="bg-[#1a1a1a] rounded-[1.5rem] p-1.5 shadow-2xl border border-white/10">
                <div className="relative aspect-[9/19] rounded-[1.25rem] overflow-hidden bg-black">
                  <Image 
                    src="/images/showcase 2/CaseyxStacyxdnpixelsweddingphotos-374.jpg" 
                    alt="Mobile gallery view" 
                    fill 
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Compact Feature Grid --- */}
      <FeatureGrid />

      {/* --- Feature Bento Grid --- */}
      <FeatureBento />

      {/* --- 2. End the "When will my gallery be ready?" texts --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5] hidden">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Left: Before/After comparison */}
          <div className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4 max-w-[500px] mx-auto lg:mx-0">
              
              {/* BEFORE - The chaos */}
              <div className="relative">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-3 text-center">Before</p>
                <div className="bg-stone-50 rounded-2xl p-4 border border-stone-200 relative overflow-hidden">
                  {/* Notification badges chaos */}
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white">7</div>
                  
                  {/* Scattered messages */}
                  <div className="space-y-2.5">
                    <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded bg-blue-500" />
                        <span className="text-[10px] font-medium text-stone-500">iMessage</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight">Any update on photos?</p>
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500" />
                        <span className="text-[10px] font-medium text-stone-500">Instagram</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight">Hey! When will gallery...</p>
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded bg-stone-700" />
                        <span className="text-[10px] font-medium text-stone-500">Email</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight">Following up on...</p>
                    </div>
                    <div className="bg-white rounded-xl px-3 py-2 shadow-sm border border-stone-100 opacity-60">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-4 h-4 rounded bg-green-500" />
                        <span className="text-[10px] font-medium text-stone-500">WhatsApp</span>
                      </div>
                      <p className="text-[11px] text-stone-600 leading-tight">Just checking in!</p>
                    </div>
                  </div>
                  
                  {/* Stress indicator */}
                  <div className="mt-3 pt-3 border-t border-stone-200 text-center">
                    <p className="text-[10px] text-stone-400">Scattered everywhere</p>
                  </div>
                </div>
              </div>

              {/* AFTER - The solution */}
              <div className="relative">
                <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-3 text-center">After</p>
                <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
                  {/* Portal header */}
                  <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between bg-stone-50">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white">SJ</span>
                      </div>
                      <div>
                        <p className="font-medium text-xs text-stone-900">Client Portal</p>
                      </div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  </div>

                  {/* Clean status */}
                  <div className="p-4">
                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-medium text-stone-600">Progress</span>
                        <span className="text-[10px] text-stone-500">65%</span>
                      </div>
                      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                        <div className="h-full w-[65%] bg-stone-900 rounded-full" />
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-stone-900" />
                        <span className="text-[11px] text-stone-600">Event completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-stone-900" />
                        <span className="text-[11px] text-stone-600">Editing in progress</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3.5 h-3.5 rounded-full border border-stone-300" />
                        <span className="text-[11px] text-stone-400">Gallery delivery</span>
                      </div>
                    </div>

                    {/* Delivery date */}
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <p className="text-[9px] uppercase tracking-wider text-stone-400">Delivery</p>
                      <p className="text-sm font-medium text-stone-900">Dec 22</p>
                    </div>
                  </div>
                  
                  {/* Peace indicator */}
                  <div className="px-4 py-2 bg-stone-50 border-t border-stone-100 text-center">
                    <p className="text-[10px] text-stone-500">One place. Zero chaos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Copy */}
          <div className="order-1 lg:order-2">
            <p className="text-sm text-stone-500 mb-3 tracking-wide">
              Sound familiar?
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4 lg:mb-6 leading-tight">
              "When will my<br />gallery be ready?"
            </h2>
            <p className="text-[#525252] text-lg leading-relaxed mb-6">
              The texts. The emails. The DMs. Clients asking for updates while you're trying to edit. 
              <span className="text-stone-900 font-medium"> It stops here.</span>
            </p>
            <p className="text-[#525252] text-lg leading-relaxed mb-8">
              Give every client their own portal. They see real-time progress, estimated delivery dates, 
              and can message you in one place—not scattered across your phone, email, and Instagram.
            </p>
            
            {/* Benefits */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-stone-700" />
                </div>
                <span className="text-stone-700">Clients check status themselves</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-stone-700" />
                </div>
                <span className="text-stone-700">All messages in one thread</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center">
                  <Check className="w-4 h-4 text-stone-700" />
                </div>
                <span className="text-stone-700">No more "just checking in" texts</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* --- 3. Client Galleries Experience --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7] hidden">
        <div className="max-w-[1280px] mx-auto grid lg:grid-cols-2 gap-8 lg:gap-32 items-center">
          
          {/* Left: Visual */}
          <div className="relative">
             <div className="aspect-[3/4] max-w-[320px] sm:max-w-[400px] lg:max-w-[500px] bg-white p-2 shadow-xl border border-gray-100 mx-auto lg:mr-auto">
               <div className="w-full h-full bg-gray-50 overflow-hidden relative">
                  <Image 
                     src="/images/showcase 2/CaseyxStacyxdnpixelsweddingphotos-383.jpg" 
                     alt="Client gallery experience" 
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
      <section id="backup" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-y border-[#E5E5E5] hidden">
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
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#141414] text-white hidden">
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
      <section id="contracts" className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-white relative overflow-hidden hidden">
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
                              Provider agrees to deliver 8 hours of professional services on the event date, including all agreed-upon deliverables as outlined in this agreement...
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

      {/* --- Vendor Network - Ultra Minimal Editorial Section --- */}
      <section id="vendors" className="py-24 lg:py-40 px-4 sm:px-6 bg-[#FAFAFA] scroll-mt-20 relative overflow-hidden hidden">
        {/* Subtle texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #000 0.5px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />
        
        <div className="max-w-[1200px] mx-auto relative">
          {/* Editorial Header */}
          <div className="max-w-3xl mx-auto text-center mb-16 lg:mb-24">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-stone-300" />
              <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-stone-400">Vendor Network</span>
              <div className="h-px w-12 bg-stone-300" />
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.1] tracking-[-0.02em] mb-8">
              Share once.<br />
              <span className="italic font-light">Everyone wins.</span>
            </h2>
            
            <p className="text-stone-500 text-lg lg:text-xl leading-relaxed max-w-xl mx-auto font-light">
              Stop emailing ZIP files. Give vendors their own portal to download images for their portfolios.
            </p>
          </div>

          {/* Main Visual - The Flow */}
          <div className="relative mb-16 lg:mb-24">
            {/* Connection Lines - Desktop Only */}
            <div className="hidden lg:block absolute top-1/2 left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
            
            {/* Three Step Flow */}
            <div className="grid md:grid-cols-3 gap-8 lg:gap-4 max-w-4xl mx-auto">
              {/* Step 1: Add Vendor */}
              <div className="relative group">
                <div className="bg-white rounded-2xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Step 1</p>
                  <h4 className="font-medium text-lg text-stone-900 mb-2">Add your vendors</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    Enter their email. We'll check if they're on 12img. If not, send an invite.
                  </p>
                  
                  {/* Mini mockup */}
                  <div className="mt-5 p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex items-center gap-2 text-xs text-stone-400 mb-2">
                      <Mail className="w-3 h-3" />
                      <span>florist@email.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-stone-900 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-xs text-stone-600">Registered on 12img</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Share Gallery */}
              <div className="relative group">
                <div className="bg-white rounded-2xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                    <Send className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Step 2</p>
                  <h4 className="font-medium text-lg text-stone-900 mb-2">Share the gallery</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    One click. They get a private link with your usage terms built in.
                  </p>
                  
                  {/* Mini mockup */}
                  <div className="mt-5 p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-stone-700">Sarah & James Wedding</span>
                      <span className="text-[10px] text-emerald-600">Sent ✓</span>
                    </div>
                    <div className="flex gap-1">
                      {['Florist', 'Venue', 'Planner'].map((v, i) => (
                        <span key={i} className="px-2 py-0.5 bg-stone-200 rounded text-[10px] text-stone-600">{v}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: They Download */}
              <div className="relative group">
                <div className="bg-white rounded-2xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                  <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center mb-5">
                    <ImageIcon className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mb-2">Step 3</p>
                  <h4 className="font-medium text-lg text-stone-900 mb-2">They download</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">
                    Vendors accept terms, pick their images, download. You get notified.
                  </p>
                  
                  {/* Mini mockup */}
                  <div className="mt-5 p-3 bg-stone-50 rounded-lg border border-stone-100">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Check className="w-3 h-3 text-emerald-600" />
                      </div>
                      <span className="text-xs text-stone-600">Terms accepted</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-stone-500 rotate-90" />
                      </div>
                      <span className="text-xs text-stone-600">12 images downloaded</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center mb-16 lg:mb-24">
            <div className="inline-flex items-center gap-8 lg:gap-16 px-8 py-6 bg-white rounded-2xl border border-stone-200">
              <div className="text-center">
                <p className="text-4xl lg:text-5xl font-extralight text-stone-900 tracking-tight">20+</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">Categories</p>
              </div>
              <div className="w-px h-12 bg-stone-200" />
              <div className="text-center">
                <p className="text-4xl lg:text-5xl font-extralight text-stone-900 tracking-tight">1</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">Click share</p>
              </div>
              <div className="w-px h-12 bg-stone-200" />
              <div className="text-center">
                <p className="text-4xl lg:text-5xl font-extralight text-stone-900 tracking-tight">0</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-1">ZIP files</p>
              </div>
            </div>
          </div>

          {/* Vendor Categories Preview */}
          <div className="max-w-3xl mx-auto">
            <p className="text-center text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Works with every vendor type</p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Florist', 'Planner', 'Venue', 'DJ', 'Caterer', 'Bakery', 'Hair & Makeup', 'Videographer', 'Photo Booth', 'Lighting', 'Stationery', 'Bridal'].map((cat, i) => (
                <span 
                  key={i} 
                  className="px-3 py-1.5 bg-white border border-stone-200 rounded-full text-xs text-stone-600 hover:border-stone-300 hover:bg-stone-50 transition-colors cursor-default"
                >
                  {cat}
                </span>
              ))}
              <span className="px-3 py-1.5 bg-stone-900 text-white rounded-full text-xs">
                +8 more
              </span>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <button 
              onClick={() => openAuthModal('sign-up')}
              className="inline-flex items-center gap-2 bg-stone-900 text-white px-8 py-4 font-medium hover:bg-black transition-colors rounded-full"
            >
              Build Your Vendor Network
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* --- Automated Workflows - Ultra Minimal White Section --- */}
      <section id="automations" className="py-24 lg:py-40 px-4 sm:px-6 bg-white scroll-mt-20 relative overflow-hidden hidden">
        {/* Subtle grid texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)`,
          backgroundSize: '80px 80px'
        }} />
        
        <div className="max-w-[1200px] mx-auto relative">
          {/* Editorial Header */}
          <div className="max-w-3xl mx-auto text-center mb-20 lg:mb-28">
            <div className="inline-flex items-center gap-3 mb-8">
              <div className="h-px w-12 bg-stone-300" />
              <span className="text-[11px] font-medium uppercase tracking-[0.25em] text-stone-400">Automations</span>
              <div className="h-px w-12 bg-stone-300" />
            </div>
            
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-stone-900 leading-[1.1] tracking-[-0.02em] mb-8">
              Emails that send<br />
              <span className="italic font-light">themselves.</span>
            </h2>
            
            <p className="text-stone-500 text-lg lg:text-xl leading-relaxed max-w-xl mx-auto font-light">
              Set it once. Your clients get the right email at the right time, automatically.
            </p>
          </div>

          {/* Main Visual - Horizontal Timeline */}
          <div className="relative mb-20 lg:mb-28">
            {/* Timeline Container */}
            <div className="relative">
              {/* Horizontal line */}
              <div className="absolute top-[28px] left-0 right-0 h-px bg-stone-200" />
              
              {/* Timeline Items */}
              <div className="relative flex justify-between items-start max-w-4xl mx-auto px-4">
                {[
                  { days: '-30', label: 'Planning', sublabel: 'Questionnaire', done: true },
                  { days: '-14', label: 'What to', sublabel: 'Wear', done: true },
                  { days: '-7', label: 'Timeline', sublabel: 'Reminder', done: true },
                  { days: '-2', label: 'Final', sublabel: 'Check-in', current: true },
                  { days: '+1', label: 'Thank', sublabel: 'You', future: true },
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group">
                    {/* Node */}
                    <div className={`relative z-10 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 ${
                      item.done 
                        ? 'bg-stone-100 border border-stone-200' 
                        : item.current 
                          ? 'bg-stone-900 shadow-xl shadow-stone-900/10' 
                          : 'bg-white border border-stone-200'
                    }`}>
                      {item.done ? (
                        <Check className="w-5 h-5 text-stone-400" />
                      ) : item.current ? (
                        <Mail className="w-5 h-5 text-white" />
                      ) : (
                        <Mail className="w-5 h-5 text-stone-300" />
                      )}
                      
                      {/* Pulse ring for current */}
                      {item.current && (
                        <div className="absolute inset-0 rounded-full bg-stone-900/20 animate-ping" style={{ animationDuration: '2s' }} />
                      )}
                    </div>
                    
                    {/* Day badge */}
                    <div className={`mt-4 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide ${
                      item.current 
                        ? 'bg-stone-900 text-white' 
                        : 'bg-stone-100 text-stone-500'
                    }`}>
                      {item.days}d
                    </div>
                    
                    {/* Label */}
                    <div className="mt-3">
                      <p className={`text-sm font-medium ${
                        item.done ? 'text-stone-400' : item.current ? 'text-stone-900' : 'text-stone-400'
                      }`}>
                        {item.label}
                      </p>
                      <p className={`text-xs ${
                        item.done ? 'text-stone-300' : item.current ? 'text-stone-500' : 'text-stone-300'
                      }`}>
                        {item.sublabel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status indicator */}
            <div className="flex justify-center mt-12">
              <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-stone-50 rounded-full border border-stone-100">
                <div className="w-2 h-2 rounded-full bg-stone-900 animate-pulse" />
                <span className="text-sm text-stone-600">Next email sends in <span className="font-medium text-stone-900">2 days</span></span>
              </div>
            </div>
          </div>

          {/* Feature Grid - Ultra Minimal */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-stone-200 border border-stone-200 max-w-4xl mx-auto">
            {[
              { title: 'Event-based', desc: 'Triggers relative to event date' },
              { title: 'Smart templates', desc: 'Merge fields for personalization' },
              { title: 'Custom timing', desc: 'Set exactly when emails send' },
              { title: 'Preview first', desc: 'See what clients receive' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 lg:p-8 group hover:bg-stone-50 transition-colors duration-300">
                <p className="text-stone-900 font-medium text-sm mb-1">{item.title}</p>
                <p className="text-stone-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bottom Stats - Editorial Style */}
          <div className="mt-20 lg:mt-28 flex justify-center">
            <div className="flex items-center gap-12 lg:gap-20">
              <div className="text-center">
                <p className="text-5xl lg:text-6xl font-extralight text-stone-900 tracking-tight">5</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-2">Automated</p>
              </div>
              <div className="w-px h-16 bg-stone-200" />
              <div className="text-center">
                <p className="text-5xl lg:text-6xl font-extralight text-stone-900 tracking-tight">0</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-2">Manual</p>
              </div>
              <div className="w-px h-16 bg-stone-200" />
              <div className="text-center">
                <p className="text-5xl lg:text-6xl font-extralight text-stone-900 tracking-tight">∞</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-stone-400 mt-2">Hours saved</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. All Features Grid - Jaw-Dropping Redesign --- */}
      <section className="py-16 md:py-24 lg:py-40 px-4 sm:px-6 bg-white border-t border-[#E5E5E5] overflow-hidden hidden">
        <div className="max-w-[1400px] mx-auto">
          {/* Section Header - Pain Point Focused */}
          <div className="text-center mb-20 lg:mb-32">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-stone-100 border border-stone-200/50 rounded-full mb-6">
              <Layers className="w-4 h-4 text-stone-600" />
              <span className="text-sm font-medium text-stone-700">We Get It</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[56px] mb-6 leading-tight">
              We built this because<br /><span className="italic">we felt your pain.</span>
            </h2>
            <p className="text-[#525252] text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed">
              Late nights chasing invoices. Clients ghosting contracts. Wondering if anyone even opened your gallery. 
              <span className="text-stone-900 font-medium"> We've been there.</span> That's why we built these tools.
            </p>
          </div>

          {/* Feature Categories - Each Unique */}
          <div className="space-y-32 lg:space-y-48">
            
            {/* ═══════════════════════════════════════════════════════════════
                GALLERY & DELIVERY - Bento Grid with Live Preview Mockups
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative">
              {/* Section Label */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/20">
                  <ImageIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-3xl lg:text-4xl text-stone-900">Gallery & Delivery</h3>
                  <p className="text-stone-500 text-sm mt-1">"Did they even look at my gallery?" — Never wonder again.</p>
                </div>
              </div>
              
              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 lg:gap-5">
                
                {/* Beautiful Galleries - Large Hero Card */}
                <div className="lg:col-span-7 group relative bg-stone-50 rounded-3xl p-6 lg:p-8 overflow-hidden min-h-[320px] lg:min-h-[400px] border border-stone-100 hover:border-stone-200 transition-all duration-500">
                  {/* Floating Gallery Mockup */}
                  <div className="absolute right-2 sm:right-4 lg:-right-4 top-1/2 -translate-y-1/2 w-[200px] sm:w-[280px] lg:w-[360px] opacity-90 group-hover:opacity-100 motion-safe:group-hover:translate-x-[-4px] transition-all duration-700 ease-out">
                    <div className="bg-white rounded-2xl shadow-2xl shadow-stone-900/10 p-3 rotate-[-4deg] motion-safe:group-hover:rotate-[-2deg] transition-transform duration-700">
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          'MitchellexJohnWedding-11.jpg',
                          'MitchellexJohnWedding-16.jpg',
                          'MitchellexJohnWedding-107.jpg',
                          'MitchellexJohnWedding-112.jpg',
                          'MitchellexJohnWedding-170.jpg',
                          'MitchellexJohnWedding-251.jpg',
                          'MitchellexJohnWedding-358.jpg',
                          'MitchellexJohnWedding-402.jpg',
                          'MitchellexJohnWedding-408.jpg',
                        ].map((img, i) => (
                          <div key={i} className="aspect-square bg-stone-200 rounded-lg overflow-hidden relative">
                            <Image src={`/images/showcase/${img}`} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-stone-900" />
                          <div className="w-20 h-2 bg-stone-200 rounded-full" />
                        </div>
                        <div className="w-16 h-6 bg-stone-900 rounded-full" />
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 max-w-[60%] sm:max-w-[55%] lg:max-w-[50%]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/80 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-600 mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-900" />
                      Core Feature
                    </div>
                    <h4 className="font-serif text-2xl lg:text-3xl text-stone-900 mb-3">Beautiful Galleries</h4>
                    <p className="text-stone-600 text-sm lg:text-base leading-relaxed">Stunning, minimal galleries that showcase your work. Designed to impress clients and win referrals.</p>
                  </div>
                </div>
                
                {/* Mobile-First - Vertical Phone Mockup */}
                <div className="lg:col-span-5 group relative bg-stone-900 rounded-3xl p-6 lg:p-8 overflow-hidden min-h-[320px] lg:min-h-[400px]">
                  {/* Phone Mockup */}
                  <div className="absolute right-4 lg:right-8 top-1/2 -translate-y-1/2 motion-safe:group-hover:translate-y-[-52%] transition-transform duration-700 ease-out">
                    <div className="w-[140px] lg:w-[180px] bg-stone-800 rounded-[2rem] p-2 shadow-2xl">
                      <div className="bg-stone-950 rounded-[1.5rem] overflow-hidden aspect-[9/19]">
                        <div className="w-full h-full flex flex-col">
                          <div className="h-6 bg-stone-900 flex items-center justify-center">
                            <div className="w-16 h-1.5 bg-stone-800 rounded-full" />
                          </div>
                          <div className="flex-1 p-2 space-y-1.5">
                            {[
                              'MitchellexJohnWedding-422.jpg',
                              'MitchellexJohnWedding-473.jpg',
                              'MitchellexJohnWedding-485.jpg',
                              'MitchellexJohnWedding-539.jpg',
                            ].map((img, i) => (
                              <div key={i} className="aspect-[4/3] bg-stone-800 rounded-lg overflow-hidden relative">
                                <Image src={`/images/showcase/${img}`} alt="" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 max-w-[60%] sm:max-w-[55%]">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white/10 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-4">
                      <Zap className="w-3 h-3" />
                      Lightning Fast
                    </div>
                    <h4 className="font-serif text-2xl lg:text-3xl text-white mb-3">Mobile-First</h4>
                    <p className="text-stone-400 text-sm lg:text-base leading-relaxed">Optimized for speed. Your galleries load instantly on any device.</p>
                  </div>
                </div>
                
{/* Auto ZIP Backups - Archive Animation */}
                <div className="lg:col-span-4 group relative bg-stone-50 rounded-3xl p-6 overflow-hidden min-h-[280px] border border-stone-100 hover:border-stone-200 transition-all duration-500">
                  {/* Stacked Files Animation */}
                  <div className="absolute right-4 bottom-4 flex flex-col items-end gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div 
                        key={i} 
                        className="bg-white rounded-lg shadow-sm border border-stone-200 px-3 py-2 flex items-center gap-2 motion-safe:group-hover:translate-x-[-4px] transition-transform duration-500"
                        style={{ transitionDelay: `${i * 50}ms` }}
                      >
                        <div className="w-8 h-8 bg-stone-100 rounded" />
                        <div className="w-12 h-1.5 bg-stone-200 rounded-full" />
                      </div>
                    ))}
                    <div className="mt-2 bg-stone-900 text-white rounded-lg px-4 py-2 text-xs font-bold flex items-center gap-2 motion-safe:group-hover:scale-105 transition-transform duration-300">
                      <Upload className="w-3 h-3" />
                      .ZIP
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 max-w-[60%]">
                    <Upload className="w-6 h-6 text-stone-700 mb-3" />
                    <h4 className="font-medium text-lg text-stone-900 mb-2">Auto ZIP Backups</h4>
                    <p className="text-stone-600 text-sm leading-relaxed">Every upload generates a ZIP archive emailed to you. Never lose a gallery.</p>
                  </div>
                </div>
                
                {/* Email Tracking - Live Activity Feed */}
                <div className="lg:col-span-4 group relative bg-stone-900 rounded-3xl p-6 overflow-hidden min-h-[280px]">
                  {/* Activity Feed */}
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[160px] sm:w-[180px] space-y-2">
                    {[
                      { status: 'opened', time: '2m ago', color: 'bg-stone-300' },
                      { status: 'clicked', time: '5m ago', color: 'bg-stone-400' },
                      { status: 'downloaded', time: '12m ago', color: 'bg-stone-500' },
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        className="bg-stone-800/80 backdrop-blur-sm rounded-xl px-3 py-2 flex items-center gap-2 motion-safe:group-hover:translate-x-[-4px] transition-transform duration-500"
                        style={{ transitionDelay: `${i * 100}ms` }}
                      >
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-white text-xs font-medium capitalize">{item.status}</span>
                        <span className="text-stone-500 text-[10px] ml-auto">{item.time}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Content */}
                  <div className="relative z-10 max-w-[55%] sm:max-w-[50%]">
                    <Mail className="w-6 h-6 text-stone-400 mb-3" />
                    <h4 className="font-medium text-lg text-white mb-2">Email Tracking</h4>
                    <p className="text-stone-400 text-sm leading-relaxed">Know when clients open, view, and download. Track every interaction.</p>
                  </div>
                </div>
                
                {/* Password Protection - Lock Animation */}
                <div className="lg:col-span-12 group relative bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 rounded-3xl p-6 lg:p-8 overflow-hidden border border-stone-100">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-12">
                    {/* Lock Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 lg:w-24 lg:h-24 bg-stone-900 rounded-2xl flex items-center justify-center shadow-xl shadow-stone-900/20 motion-safe:group-hover:scale-105 transition-transform duration-500">
                        <Lock className="w-10 h-10 lg:w-12 lg:h-12 text-white" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h4 className="font-serif text-2xl lg:text-3xl text-stone-900 mb-2">Password Protection</h4>
                      <p className="text-stone-600 text-base lg:text-lg leading-relaxed max-w-2xl">Secure galleries with passwords. Control who sees your work and when. Every gallery gets a unique access code.</p>
                    </div>
                    
                    {/* Password Input Mockup */}
                    <div className="flex-shrink-0 hidden lg:block">
                      <div className="bg-white rounded-xl shadow-sm border border-stone-200 px-4 py-3 flex items-center gap-3 min-w-[240px]">
                        <Lock className="w-4 h-4 text-stone-400" />
                        <div className="flex gap-1.5">
                          {[...Array(8)].map((_, i) => (
                            <div key={i} className="w-2 h-2 bg-stone-900 rounded-full" />
                          ))}
                        </div>
                        <ArrowRight className="w-4 h-4 text-stone-400 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                CLIENT MANAGEMENT - Timeline/Flow Design
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative">
              {/* Section Label */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/20">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-3xl lg:text-4xl text-stone-900">Client Management</h3>
                  <p className="text-stone-500 text-sm mt-1">"I sent the contract 3 weeks ago..." — Contracts that actually get signed.</p>
                </div>
              </div>
              
              {/* Horizontal Scroll Container for Mobile */}
              <div className="relative">
                {/* Connection Line - Desktop */}
                <div className="hidden lg:block absolute top-[140px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-stone-200 to-transparent" />
                
                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                  
                  {/* Smart Contracts */}
                  <div className="group relative">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 min-h-[320px] flex flex-col">
                      {/* Step Number */}
                      <div className="absolute -top-3 left-6 lg:left-8">
                        <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-white text-xs font-bold">1</div>
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stone-100 transition-colors duration-300">
                        <FileText className="w-7 h-7 text-stone-700" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-3">Smart Contracts</h4>
                      <p className="text-stone-500 text-sm leading-relaxed flex-1">Professional templates with merge fields. Auto-fill client names, dates, and package details.</p>
                      
                      {/* Mini Preview */}
                      <div className="mt-6 pt-6 border-t border-stone-100">
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <div className="flex -space-x-1">
                            <div className="w-5 h-5 rounded-full bg-stone-200 border-2 border-white" />
                            <div className="w-5 h-5 rounded-full bg-stone-300 border-2 border-white" />
                          </div>
                          <span>Used by 2,400+ creatives</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* E-Signatures */}
                  <div className="group relative">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 min-h-[320px] flex flex-col">
                      {/* Step Number */}
                      <div className="absolute -top-3 left-6 lg:left-8">
                        <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-white text-xs font-bold">2</div>
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stone-100 transition-colors duration-300">
                        <PenTool className="w-7 h-7 text-stone-700" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-3">E-Signatures</h4>
                      <p className="text-stone-500 text-sm leading-relaxed flex-1">Legally-binding signatures on any device. Elegant handwriting fonts for a professional look.</p>
                      
                      {/* Signature Preview */}
                      <div className="mt-6 pt-6 border-t border-stone-100">
                        <div className="font-serif italic text-2xl text-stone-300 group-hover:text-stone-400 transition-colors duration-300">Sarah Johnson</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Built-in Messaging */}
                  <div className="group relative">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 min-h-[320px] flex flex-col">
                      {/* Step Number */}
                      <div className="absolute -top-3 left-6 lg:left-8">
                        <div className="w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center text-white text-xs font-bold">3</div>
                      </div>
                      
                      {/* Icon */}
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stone-100 transition-colors duration-300">
                        <MessageCircle className="w-7 h-7 text-stone-700" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-3">Built-in Messaging</h4>
                      <p className="text-stone-500 text-sm leading-relaxed flex-1">Real-time chat with clients. Read receipts, typing indicators, and file attachments.</p>
                      
                      {/* Chat Preview */}
                      <div className="mt-6 pt-6 border-t border-stone-100 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-xs text-stone-400">Online now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Automated Workflows - Featured */}
                  <div className="group relative sm:col-span-2 lg:col-span-1">
                    <div className="absolute -top-2 -right-2 z-10">
                      <span className="px-2.5 py-1 bg-stone-900 text-white text-[10px] font-bold uppercase tracking-wider rounded-full">New</span>
                    </div>
                    <div className="bg-stone-900 rounded-3xl p-6 lg:p-8 min-h-[320px] flex flex-col overflow-hidden relative">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                          backgroundSize: '24px 24px'
                        }} />
                      </div>
                      
                      {/* Icon */}
                      <div className="relative w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                        <Send className="w-7 h-7 text-white" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="relative font-serif text-xl lg:text-2xl text-white mb-3">Automated Workflows</h4>
                      <p className="relative text-stone-400 text-sm leading-relaxed flex-1">Emails that send themselves. Timeline reminders, what-to-wear guides, thank you notes—all on autopilot.</p>
                      
                      {/* Timeline Preview */}
                      <div className="relative mt-6 pt-6 border-t border-white/10 flex items-center gap-3">
                        {['-30d', '-14d', '-7d', '+1d'].map((day, i) => (
                          <div key={i} className="flex flex-col items-center gap-1">
                            <div className={`w-3 h-3 rounded-full ${i < 2 ? 'bg-white/30' : i === 2 ? 'bg-white' : 'bg-white/10'}`} />
                            <span className="text-[9px] text-stone-500">{day}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Milestone Tracking */}
                  <div className="group relative">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 min-h-[320px] flex flex-col">
                      {/* Icon */}
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stone-100 transition-colors duration-300">
                        <Calendar className="w-7 h-7 text-stone-700" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-3">Milestone Tracking</h4>
                      <p className="text-stone-500 text-sm leading-relaxed flex-1">Track every project from contract to delivery. Visual timeline with status updates.</p>
                      
                      {/* Progress Preview */}
                      <div className="mt-6 pt-6 border-t border-stone-100">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                            <div className="w-3/4 h-full bg-stone-900 rounded-full" />
                          </div>
                          <span className="text-xs text-stone-500 font-medium">75%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Client Portal */}
                  <div className="group relative">
                    <div className="bg-white rounded-3xl border border-stone-200 p-6 lg:p-8 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-900/5 transition-all duration-500 min-h-[320px] flex flex-col">
                      {/* Icon */}
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-stone-100 transition-colors duration-300">
                        <Globe className="w-7 h-7 text-stone-700" />
                      </div>
                      
                      {/* Content */}
                      <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-3">Client Portal</h4>
                      <p className="text-stone-500 text-sm leading-relaxed flex-1">One beautiful place for contracts, messages, and galleries. No client login required.</p>
                      
                      {/* Portal Preview */}
                      <div className="mt-6 pt-6 border-t border-stone-100">
                        <div className="flex items-center gap-2 text-xs text-stone-400">
                          <Globe className="w-3 h-3" />
                          <span>12img.com/portal/sarah</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════════════════════
                YOUR BRAND - Magazine/Editorial Layout
            ═══════════════════════════════════════════════════════════════ */}
            <div className="relative">
              {/* Section Label */}
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center shadow-lg shadow-stone-900/20">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-3xl lg:text-4xl text-stone-900">Your Brand</h3>
                  <p className="text-stone-500 text-sm mt-1">"Why does my gallery have their logo on it?" — Your work, your name. Period.</p>
                </div>
              </div>
              
              {/* Editorial Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                
                {/* Left Column - Stacked Cards */}
                <div className="space-y-6">
                  
                  {/* Public Profile - Large */}
                  <div className="group relative bg-stone-50 rounded-3xl p-8 lg:p-10 overflow-hidden border border-stone-100 hover:border-stone-200 transition-all duration-500">
                    {/* Browser Mockup */}
                    <div className="absolute right-2 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 w-[160px] sm:w-[200px] lg:w-[280px] opacity-80 group-hover:opacity-100 motion-safe:group-hover:translate-x-[-4px] transition-all duration-700">
                      <div className="bg-white rounded-xl shadow-xl border border-stone-200 overflow-hidden">
                        {/* Browser Bar */}
                        <div className="bg-stone-100 px-3 py-2 flex items-center gap-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 rounded-full bg-stone-300" />
                            <div className="w-2 h-2 rounded-full bg-stone-300" />
                            <div className="w-2 h-2 rounded-full bg-stone-300" />
                          </div>
                          <div className="flex-1 bg-white rounded px-2 py-0.5 text-[8px] text-stone-400">12img.com/sarah-photos</div>
                        </div>
                        {/* Content */}
                        <div className="p-4">
                          <div className="w-12 h-12 rounded-full bg-stone-200 mb-3" />
                          <div className="w-24 h-2 bg-stone-200 rounded mb-2" />
                          <div className="w-16 h-1.5 bg-stone-100 rounded" />
                          <div className="mt-4 grid grid-cols-3 gap-1">
                            {[
                              'MitchellexJohnWedding-551.jpg',
                              'MitchellexJohnWedding-559.jpg',
                              'MitchellexJohnWedding-567.jpg',
                              'MitchellexJohnWedding-586.jpg',
                              'MitchellexJohnWedding-590.jpg',
                              'MitchellexJohnWedding-619.jpg',
                            ].map((img, i) => (
                              <div key={i} className="aspect-square bg-stone-100 rounded overflow-hidden relative">
                                <Image src={`/images/showcase/${img}`} alt="" fill className="object-cover" />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="relative z-10 max-w-[55%] sm:max-w-[50%]">
                      <Globe className="w-8 h-8 text-stone-700 mb-4" />
                      <h4 className="font-serif text-2xl lg:text-3xl text-stone-900 mb-3">Public Profile</h4>
                      <p className="text-stone-600 text-sm lg:text-base leading-relaxed">Your own professional profile page. Showcase your work and let clients find you.</p>
                    </div>
                  </div>
                  
                  {/* Two Column Row */}
                  <div className="grid grid-cols-2 gap-6">
                    
                    {/* Curated Portfolio */}
                    <div className="group bg-white rounded-3xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                      <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-stone-100 transition-colors">
                        <ImageIcon className="w-6 h-6 text-stone-700" />
                      </div>
                      <h4 className="font-medium text-lg text-stone-900 mb-2">Curated Portfolio</h4>
                      <p className="text-stone-500 text-sm leading-relaxed">Hand-pick your 10 best images. Drag to reorder.</p>
                      
                      {/* Mini Grid */}
                      <div className="mt-4 grid grid-cols-5 gap-1">
                        {[
                          'MitchellexJohnWedding-736.jpg',
                          'MitchellexJohnWedding-853.jpg',
                          'MitchellexJohnWedding-855.jpg',
                          'MitchellexJohnprt1-68.jpg',
                          'MitchellexJohnprt1-76.jpg',
                          'MitchellexJohnWedding-1.jpg',
                          'WxGweddinggalleryprt3-00931.jpg',
                          'MitchellexJohnWedding-102.jpg',
                          'MitchellexJohnWedding-107.jpg',
                          'MitchellexJohnWedding-112.jpg',
                        ].map((img, i) => (
                          <div key={i} className="aspect-square bg-stone-100 rounded overflow-hidden relative motion-safe:group-hover:scale-105 transition-transform" style={{ transitionDelay: `${i * 30}ms` }}>
                            <Image src={`/images/showcase/${img}`} alt="" fill className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Custom Branding */}
                    <div className="group bg-white rounded-3xl border border-stone-200 p-6 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                      <div className="w-12 h-12 bg-stone-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-stone-100 transition-colors">
                        <Palette className="w-6 h-6 text-stone-700" />
                      </div>
                      <h4 className="font-medium text-lg text-stone-900 mb-2">Custom Branding</h4>
                      <p className="text-stone-500 text-sm leading-relaxed">Your logo, your colors. Remove our branding entirely.</p>
                      
                      {/* Color Swatches */}
                      <div className="mt-4 flex gap-2">
                        {['bg-stone-900', 'bg-stone-600', 'bg-stone-400', 'bg-stone-200'].map((color, i) => (
                          <div key={i} className={`w-8 h-8 rounded-lg ${color} motion-safe:group-hover:scale-110 transition-transform`} style={{ transitionDelay: `${i * 50}ms` }} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right Column - Feature Stack */}
                <div className="space-y-6">
                  
                  {/* Company Rebranding */}
                  <div className="group bg-stone-900 rounded-3xl p-8 lg:p-10 overflow-hidden relative">
                    {/* Animated Redirect */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:block">
                      <div className="flex items-center gap-3 text-stone-500">
                        <div className="px-3 py-1.5 bg-stone-800 rounded-lg text-xs font-mono">/old-name</div>
                        <ArrowRight className="w-4 h-4 motion-safe:group-hover:translate-x-1 transition-transform" />
                        <div className="px-3 py-1.5 bg-white/10 rounded-lg text-xs font-mono text-white">/new-name</div>
                      </div>
                    </div>
                    
                    <div className="relative z-10 max-w-[60%] lg:max-w-[50%]">
                      <Shield className="w-8 h-8 text-stone-400 mb-4" />
                      <h4 className="font-serif text-2xl lg:text-3xl text-white mb-3">Company Rebranding</h4>
                      <p className="text-stone-400 text-sm lg:text-base leading-relaxed">Change your business name anytime. Old URLs redirect automatically for 90 days.</p>
                    </div>
                  </div>
                  
                  {/* Visibility Controls */}
                  <div className="group bg-white rounded-3xl border border-stone-200 p-8 hover:border-stone-300 hover:shadow-lg transition-all duration-500">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-stone-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-stone-100 transition-colors">
                        <Lock className="w-7 h-7 text-stone-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-2">Visibility Controls</h4>
                        <p className="text-stone-500 text-sm leading-relaxed mb-4">Public, private, or password-protected. Full control over who sees what.</p>
                        
                        {/* Toggle Pills */}
                        <div className="flex flex-wrap gap-2">
                          {['Public', 'Private', 'Protected'].map((option, i) => (
                            <div 
                              key={i} 
                              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                                i === 0 ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 group-hover:bg-stone-200'
                              }`}
                            >
                              {option}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Instant Updates */}
                  <div className="group bg-gradient-to-br from-stone-100 to-stone-50 rounded-3xl p-8 border border-stone-100 hover:border-stone-200 transition-all duration-500">
                    <div className="flex items-start gap-6">
                      <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                        <Zap className="w-7 h-7 text-stone-700" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-serif text-xl lg:text-2xl text-stone-900 mb-2">Instant Updates</h4>
                        <p className="text-stone-500 text-sm leading-relaxed mb-4">Changes go live immediately. No waiting, no cache issues, no delays.</p>
                        
                        {/* Live Indicator - Static to reduce CPU usage */}
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <div className="w-3 h-3 bg-stone-900 rounded-full" />
                            <div className="absolute inset-0 w-3 h-3 bg-stone-900 rounded-full motion-safe:animate-ping opacity-25" />
                          </div>
                          <span className="text-xs text-stone-700 font-medium">Live</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom Stats - Redesigned */}
          <div className="mt-32 lg:mt-48">
            <div className="bg-stone-900 rounded-3xl p-8 lg:p-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                {[
                  { value: "~40%", label: "More affordable", sublabel: "vs. Pixieset & Pic-Time" },
                  { value: "<2s", label: "Gallery load time", sublabel: "on any device" },
                  { value: "100%", label: "Legally binding", sublabel: "e-signatures" },
                  { value: "24/7", label: "Auto backups", sublabel: "to your inbox" },
                ].map((stat, i) => (
                  <div key={i} className="text-center lg:text-left">
                    <p className="font-serif text-4xl lg:text-5xl text-white mb-2">{stat.value}</p>
                    <p className="text-sm text-stone-400">{stat.label}</p>
                    <p className="text-xs text-stone-600">{stat.sublabel}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 7. Why 12img --- */}
      <section className="py-12 md:py-20 px-4 sm:px-6 border-t border-[#E5E5E5] bg-white hidden">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-[36px] mb-4">Built different.</h2>
          <p className="text-[#525252] text-lg max-w-2xl mx-auto">
            No bloat. No complexity. Just the features creative professionals actually need, 
            at a price that makes sense.
          </p>
        </div>
      </section>

      {/* --- 8. Testimonials --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7] hidden">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 lg:mb-16">
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">What creatives are saying</h2>
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
                  <p className="text-xs text-[#525252]">Wedding Creative, Austin TX</p>
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
                  <p className="text-xs text-[#525252]">Portrait Artist, Seattle WA</p>
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
                  <p className="text-xs text-[#525252]">Destination Wedding Professional</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- 9. How It Works --- */}
      <section className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-white border-t border-[#E5E5E5] hidden">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-12 lg:mb-20">
            <span className="inline-block px-3 py-1 border border-[#141414] text-xs font-medium uppercase tracking-wider mb-6">
              How It Works
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">
              From upload to delivery in minutes
            </h2>
            <p className="text-[#525252] text-lg max-w-2xl mx-auto">
              A streamlined workflow designed for busy professionals. No complexity, just results.
            </p>
          </div>

          {/* Step 1: Upload */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center mb-16 lg:mb-24">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F5F5F7] rounded-full text-sm font-medium mb-4">
                <span className="w-6 h-6 rounded-full bg-[#141414] text-white flex items-center justify-center text-xs font-bold">1</span>
                Upload
              </div>
              <h3 className="font-serif text-2xl lg:text-3xl mb-4">
                Drop your photos.
              </h3>
              <p className="text-[#525252] text-lg leading-relaxed mb-6">
                Drag and drop hundreds of images at once. Our turbo upload system handles everything—compression, optimization, and organization.
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Turbo-fast uploads
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Auto-compression & optimization
                </li>
                <li className="flex items-center gap-3 text-[#525252]">
                  <Check className="w-5 h-5 text-emerald-600" />
                  Drag & drop simplicity
                </li>
              </ul>
            </div>
            <div className="order-1 lg:order-2 relative">
              <div className="aspect-[4/3] bg-[#F5F5F7] border border-[#E5E5E5] rounded-lg p-6 overflow-hidden">
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 h-full flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-stone-400" />
                  </div>
                  <p className="text-stone-600 font-medium mb-1">Drop photos here</p>
                  <p className="text-stone-400 text-sm">or click to browse</p>
                </div>
              </div>
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

      {/* --- Community Spotlight --- */}
      <CommunitySpotlightCardClient />

      {/* --- 10. Pricing Preview --- */}
      <section id="pricing" className="py-12 md:py-20 lg:py-32 px-4 sm:px-6 bg-[#F5F5F7] scroll-mt-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-8 lg:mb-12">
            <p className="text-sm text-stone-500 mb-3 tracking-wide">
              Stop overpaying for features you don't use
            </p>
            <h2 className="font-serif text-2xl sm:text-3xl lg:text-[42px] mb-4">
              Pricing that <span className="italic">actually</span> makes sense.
            </h2>
            <p className="text-[#525252] text-lg max-w-2xl mx-auto">
              More storage than Pixieset. Lower prices than Pic-Time. All the features you need.
            </p>
          </div>

          {/* Value Props */}
          <div className="flex flex-wrap justify-center gap-6 mb-10">
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Check className="w-4 h-4 text-stone-900" />
              <span>5GB free forever</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Check className="w-4 h-4 text-stone-900" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-stone-600">
              <Check className="w-4 h-4 text-stone-900" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* Pricing Matrix */}
          <PricingMatrix showAllFeatures={false} />
          
          <div className="text-center mt-10 space-y-4">
            <Link href="/pricing" className="inline-flex items-center gap-2 text-sm font-medium text-[#141414] hover:text-gray-600 transition-colors">
              View full feature comparison
              <ArrowRight className="w-4 h-4" />
            </Link>
            <p className="text-xs text-stone-400">
              Annual plans save up to 30%. All prices in USD.
            </p>
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
            Join thousands of creatives who have simplified their workflow.
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
               Beautiful client experiences for creative professionals.
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
              <li><button onClick={() => setFeatureModalOpen(true)} className="hover:text-white transition-colors">Request a Feature</button></li>
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
           <p>Made for creatives.</p>
        </div>
      </footer>

      {/* --- Feature Request Modal --- */}
      {featureModalOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity"
            onClick={() => !featureSubmitting && setFeatureModalOpen(false)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <div 
              className="bg-white w-full max-w-md rounded-2xl shadow-2xl pointer-events-auto overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {!featureSubmitted ? (
                <>
                  {/* Header */}
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-serif text-xl text-[#141414]">Shape the future</h3>
                      <button 
                        onClick={() => setFeatureModalOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors"
                      >
                        <X className="w-4 h-4 text-stone-400" />
                      </button>
                    </div>
                    <p className="text-sm text-stone-500">
                      Tell us what you need. We'll notify you when it ships.
                    </p>
                  </div>
                  
                  {/* Form */}
                  <form onSubmit={handleFeatureSubmit} className="px-6 pb-6">
                    <div className="space-y-4">
                      <div>
                        <textarea
                          value={featureRequest}
                          onChange={(e) => setFeatureRequest(e.target.value)}
                          placeholder="Describe the feature you'd like to see..."
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 transition-all placeholder:text-stone-400"
                          rows={4}
                          required
                          disabled={featureSubmitting}
                        />
                      </div>
                      <div>
                        <input
                          type="email"
                          value={featureEmail}
                          onChange={(e) => setFeatureEmail(e.target.value)}
                          placeholder="Your email (optional — for updates)"
                          className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-300 transition-all placeholder:text-stone-400"
                          disabled={featureSubmitting}
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={featureSubmitting || !featureRequest.trim()}
                      className="mt-4 w-full bg-[#141414] text-white py-3 rounded-xl text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {featureSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Request
                        </>
                      )}
                    </button>
                    
                    <p className="mt-4 text-xs text-stone-400 text-center">
                      We read every request. Seriously.
                    </p>
                  </form>
                </>
              ) : (
                /* Success State */
                <div className="px-6 py-12 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-serif text-xl text-[#141414] mb-2">Request received</h3>
                  <p className="text-sm text-stone-500">
                    We'll let you know when this ships.
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  )
}
