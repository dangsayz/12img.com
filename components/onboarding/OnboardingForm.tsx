'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { completeOnboarding } from '@/server/actions/onboarding.actions'

const PHOTOGRAPHY_TYPES = [
  { value: 'wedding', label: 'Wedding Photography' },
  { value: 'portrait', label: 'Portrait Photography' },
  { value: 'event', label: 'Event Photography' },
  { value: 'commercial', label: 'Commercial Photography' },
  { value: 'family', label: 'Family Photography' },
  { value: 'newborn', label: 'Newborn Photography' },
  { value: 'boudoir', label: 'Boudoir Photography' },
  { value: 'real-estate', label: 'Real Estate Photography' },
  { value: 'product', label: 'Product Photography' },
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
}

export function OnboardingForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    photographyType: '',
    country: '',
    state: '',
    referralCode: '',
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

  const isValid = formData.businessName.trim().length > 0 && formData.photographyType

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Full Bleed Image */}
      <div className="hidden lg:block lg:w-2/5 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          className="absolute inset-0"
        >
          <Image
            src="/images/showcase/auth-hero.jpg"
            alt="Photography showcase"
            fill
            className="object-cover"
            priority
          />
          {/* Subtle gradient overlay for depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/10" />
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
                LET&apos;S BEGIN WITH THE DETAILS
              </h1>
              <p className="text-gray-500 text-center mb-10">
                Tell us about your photography business
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

              {/* Business Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleChange('businessName', e.target.value)}
                  placeholder="Your studio name"
                  className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all placeholder:text-slate-400"
                  required
                />
              </motion.div>

              {/* Photography Type */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  I Primarily Shoot
                </label>
                <div className="relative">
                  <select
                    value={formData.photographyType}
                    onChange={(e) => handleChange('photographyType', e.target.value)}
                    className="w-full px-4 py-3.5 bg-slate-100 border-0 rounded-2xl focus:outline-none focus:ring-2 focus:ring-slate-300 transition-all appearance-none text-slate-700"
                    required
                  >
                    <option value="">Select your specialty</option>
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

              {/* Referral Code */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
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
