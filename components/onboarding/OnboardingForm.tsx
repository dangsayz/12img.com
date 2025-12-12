'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { completeOnboarding } from '@/server/actions/onboarding.actions'

// Showcase images for the rotating gallery
const SHOWCASE_IMAGES = [
  '/images/showcase/modern-wedding-gallery-01.jpg',
  '/images/showcase/modern-wedding-gallery-02.jpg',
  '/images/showcase/modern-wedding-gallery-03.jpg',
  '/images/showcase/modern-wedding-gallery-04.jpg',
  '/images/showcase/modern-wedding-gallery-05.jpg',
  '/images/showcase/modern-wedding-gallery-06.jpg',
  '/images/showcase/modern-wedding-gallery-07.jpg',
  '/images/showcase/modern-wedding-gallery-08.jpg',
  '/images/showcase/modern-wedding-gallery-09.jpg',
]

const PHOTOGRAPHY_TYPES = [
  { value: 'personal', label: 'Personal Use / Memories' },
  { value: 'wedding', label: 'Wedding Photography' },
  { value: 'portrait', label: 'Portrait Photography' },
  { value: 'event', label: 'Event Photography' },
  { value: 'commercial', label: 'Commercial Photography' },
  { value: 'family', label: 'Family Photography' },
  { value: 'newborn', label: 'Newborn Photography' },
  { value: 'boudoir', label: 'Boudoir Photography' },
  { value: 'real-estate', label: 'Real Estate Photography' },
  { value: 'product', label: 'Product Photography' },
  { value: 'hobbyist', label: 'Hobbyist / Enthusiast' },
  { value: 'other', label: 'Other' },
]

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'Germany',
  'France',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Sweden',
  'Norway',
  'Denmark',
  'Finland',
  'Ireland',
  'New Zealand',
  'South Africa',
  'Brazil',
  'Mexico',
  'India',
  'Japan',
  'South Korea',
  'Singapore',
  'United Arab Emirates',
  'Other',
]

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
]

interface FormData {
  businessName: string
  photographyType: string
  country: string
  state: string
  referralCode: string
  websiteUrl: string
  instagramUrl: string
}

export function OnboardingForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isImageLoaded, setIsImageLoaded] = useState(false)
  
  // Rotate images every 5 seconds with smooth transitions
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SHOWCASE_IMAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Block keyboard shortcuts for saving images
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl/Cmd + S (save), Ctrl/Cmd + Shift + S (save as)
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault()
      }
      // Block Ctrl/Cmd + Shift + I (dev tools - optional)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Preload next image for smooth transitions
  useEffect(() => {
    const nextIndex = (currentImageIndex + 1) % SHOWCASE_IMAGES.length
    const img = new window.Image()
    img.src = SHOWCASE_IMAGES[nextIndex]
  }, [currentImageIndex])
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    photographyType: '',
    country: '',
    state: '',
    referralCode: '',
    websiteUrl: '',
    instagramUrl: '',
  })

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Reset state when country changes
    if (field === 'country' && value !== 'United States') {
      setFormData(prev => ({ ...prev, state: '' }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await completeOnboarding(formData)
      if (result.success) {
        router.push('/welcome')
      } else {
        setError(result.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Business name is optional - we'll use Clerk display name as fallback
  const isValid = formData.photographyType.length > 0

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Cinematic Rotating Gallery */}
      <div 
        className="hidden lg:block lg:w-2/5 relative overflow-hidden bg-stone-950 select-none"
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        {/* Invisible overlay to block all interactions */}
        <div 
          className="absolute inset-0 z-50" 
          onContextMenu={(e) => e.preventDefault()}
          onDragStart={(e) => e.preventDefault()}
          style={{ WebkitTouchCallout: 'none' }}
        />
        
        {/* Rotating Images with Ken Burns Effect */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: { 
                opacity: { duration: 1, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 8, ease: 'linear' }
              }
            }}
            exit={{ 
              opacity: 0,
              transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] }
            }}
            className="absolute inset-0"
          >
            <motion.div
              animate={{ scale: 1.08 }}
              transition={{ duration: 8, ease: 'linear' }}
              className="absolute inset-0"
            >
              <Image
                src={SHOWCASE_IMAGES[currentImageIndex]}
                alt=""
                fill
                className="object-cover pointer-events-none"
                priority={currentImageIndex === 0}
                onLoad={() => setIsImageLoaded(true)}
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
                unoptimized={false}
              />
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Cinematic Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Vignette effect */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          
          {/* Top gradient for depth */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/30 to-transparent" />
          
          {/* Bottom gradient with stronger fade */}
          <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Subtle film grain texture */}
          <div 
            className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />
        </div>

        {/* Progress Indicators */}
        <div className="absolute bottom-8 left-8 right-8 flex gap-2">
          {SHOWCASE_IMAGES.map((_, index) => (
            <motion.div
              key={index}
              className="h-0.5 flex-1 bg-white/20 rounded-full overflow-hidden"
            >
              <motion.div
                className="h-full bg-white/80 rounded-full"
                initial={{ width: '0%' }}
                animate={{ 
                  width: index === currentImageIndex ? '100%' : index < currentImageIndex ? '100%' : '0%'
                }}
                transition={{ 
                  duration: index === currentImageIndex ? 5 : 0.3,
                  ease: index === currentImageIndex ? 'linear' : [0.22, 1, 0.36, 1]
                }}
              />
            </motion.div>
          ))}
        </div>

        {/* Floating Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-8 left-8"
        >
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/90 text-xs font-medium tracking-wide">
              {SHOWCASE_IMAGES.length} curated moments
            </span>
          </div>
        </motion.div>

        {/* Image Counter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="absolute bottom-8 right-8"
        >
          <span className="text-white/40 text-xs font-light tracking-[0.2em]">
            {String(currentImageIndex + 1).padStart(2, '0')} / {String(SHOWCASE_IMAGES.length).padStart(2, '0')}
          </span>
        </motion.div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-center py-8">
          <Link href="/" className="flex items-center gap-2">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="40" height="40" rx="8" fill="#212121"/>
              <path d="M12 14C12 12.8954 12.8954 12 14 12H26C27.1046 12 28 12.8954 28 14V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V14Z" stroke="white" strokeWidth="2"/>
              <circle cx="17" cy="17" r="2" fill="white"/>
              <path d="M12 24L16 20L19 23L24 18L28 22V26C28 27.1046 27.1046 28 26 28H14C12.8954 28 12 27.1046 12 26V24Z" fill="white"/>
            </svg>
          </Link>
        </div>

        {/* Form Content */}
        <div className="flex-1 flex items-center justify-center px-8 sm:px-12 lg:px-16 pb-12">
          <div className="w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-serif text-3xl sm:text-4xl text-center mb-2 tracking-wide">
                WELCOME TO 12IMG
              </h1>
              <p className="text-gray-500 text-center mb-10">
                Let&apos;s personalize your experience
              </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Display Name (optional) */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Display Name <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Studio name or your name"
                  className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                />
              </motion.div>

              {/* Photography Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  How will you use 12img?
                </label>
                <div className="relative">
                  <select
                    value={formData.photographyType}
                    onChange={(e) => handleChange('photographyType', e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all appearance-none text-slate-700"
                    required
                  >
                    <option value="">Select an option</option>
                    {PHOTOGRAPHY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* Country */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Country
                </label>
                <div className="relative">
                  <select
                    value={formData.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all appearance-none text-slate-700"
                  >
                    <option value="">Select your country</option>
                    {COUNTRIES.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>
              </motion.div>

              {/* State (US only) */}
              <AnimatePresence>
                {formData.country === 'United States' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      State
                    </label>
                    <div className="relative">
                      <select
                        value={formData.state}
                        onChange={(e) => handleChange('state', e.target.value)}
                        className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all appearance-none text-slate-700"
                      >
                        <option value="">Select your state</option>
                        {US_STATES.map((state) => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Website & Instagram */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Website <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="url"
                    value={formData.websiteUrl}
                    onChange={(e) => handleChange('websiteUrl', e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Instagram <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={formData.instagramUrl}
                    onChange={(e) => handleChange('instagramUrl', e.target.value)}
                    placeholder="@yourusername or full URL"
                    className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                  />
                </div>
              </motion.div>

              {/* Referral Code */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Referral Code <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.referralCode}
                  onChange={(e) => handleChange('referralCode', e.target.value)}
                  placeholder="Enter referral code here"
                  className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                />
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="pt-4"
              >
                <button
                  type="submit"
                  disabled={!isValid || isSubmitting}
                  className="w-full bg-slate-800 text-white py-4 rounded-2xl font-medium hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? 'Setting up...' : 'Continue'}
                  {!isSubmitting && (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </button>
              </motion.div>

              {/* Terms */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="text-xs text-gray-400 text-center"
              >
                By clicking &apos;CONTINUE&apos;, you accept 12img&apos;s{' '}
                <Link href="/terms" className="underline hover:text-gray-600">Terms of Service</Link>.
                Your data will be handled in accordance with our{' '}
                <Link href="/privacy" className="underline hover:text-gray-600">Privacy Policy</Link>.
              </motion.p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
