'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight,
  Loader2,
  Lock,
  Download,
  ChevronDown,
} from 'lucide-react'
import { createGallery } from '@/server/actions/gallery.actions'
import { PhotosStep } from './steps/PhotosStep'
import { TemplateSelector } from '@/components/gallery/templates/TemplateSelector'
import { type GalleryTemplate, DEFAULT_TEMPLATE } from '@/components/gallery/templates'

// Apple-style easing
const EASE = [0.22, 1, 0.36, 1] as const

// Auto-save key for localStorage
const AUTOSAVE_KEY = '12img_gallery_draft'

interface DraftData {
  galleryName: string
  password: string
  downloadEnabled: boolean
  template: GalleryTemplate
  showOptions: boolean
  savedAt: number
}

export function SimpleWizard() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [galleryName, setGalleryName] = useState('')
  const [password, setPassword] = useState('')
  const [downloadEnabled, setDownloadEnabled] = useState(true)
  const [template, setTemplate] = useState<GalleryTemplate>(DEFAULT_TEMPLATE)
  const [showOptions, setShowOptions] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [galleryId, setGalleryId] = useState<string | null>(null)
  const [gallerySlug, setGallerySlug] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasDraft, setHasDraft] = useState(false)
  const [showDraftRestored, setShowDraftRestored] = useState(false)

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        const draft: DraftData = JSON.parse(saved)
        // Only restore if saved within last 24 hours
        const isRecent = Date.now() - draft.savedAt < 24 * 60 * 60 * 1000
        if (isRecent && draft.galleryName) {
          setGalleryName(draft.galleryName)
          setPassword(draft.password || '')
          setDownloadEnabled(draft.downloadEnabled ?? true)
          setTemplate(draft.template || DEFAULT_TEMPLATE)
          setShowOptions(draft.showOptions || false)
          setHasDraft(true)
          setShowDraftRestored(true)
          // Hide the "draft restored" message after 3 seconds
          setTimeout(() => setShowDraftRestored(false), 3000)
        }
      }
    } catch (e) {
      console.error('Failed to load draft:', e)
    }
  }, [])

  // Auto-save to localStorage when form data changes
  const saveDraft = useCallback(() => {
    if (currentStep !== 0) return // Only save on step 1
    
    const draft: DraftData = {
      galleryName,
      password,
      downloadEnabled,
      template,
      showOptions,
      savedAt: Date.now(),
    }
    
    try {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(draft))
    } catch (e) {
      console.error('Failed to save draft:', e)
    }
  }, [galleryName, password, downloadEnabled, template, showOptions, currentStep])

  // Debounced auto-save (save 500ms after user stops typing)
  useEffect(() => {
    const timer = setTimeout(saveDraft, 500)
    return () => clearTimeout(timer)
  }, [saveDraft])

  // Clear draft after successful gallery creation
  const clearDraft = () => {
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
      setHasDraft(false)
    } catch (e) {
      console.error('Failed to clear draft:', e)
    }
  }

  const handleCreateGallery = async () => {
    if (!galleryName.trim()) {
      setError('Please enter a gallery name')
      return
    }

    setIsCreating(true)
    setError(null)

    try {
      const form = new FormData()
      form.append('title', galleryName)
      if (password) form.append('password', password)
      form.append('downloadEnabled', String(downloadEnabled))
      form.append('template', template)

      const result = await createGallery(form)

      if (result.error) {
        setError(result.error)
        setIsCreating(false)
        return
      }

      if (result.galleryId && result.slug) {
        setGalleryId(result.galleryId)
        setGallerySlug(result.slug)
        clearDraft() // Clear the draft after successful creation
        setCurrentStep(1)
      }
    } catch {
      setError('Failed to create gallery')
    } finally {
      setIsCreating(false)
    }
  }

  // Input focus state for visual feedback
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputFocused, setInputFocused] = useState(false)
  
  // Subtle cursor animation
  const cursorOpacity = useMotionValue(1)
  
  useEffect(() => {
    if (inputFocused && !galleryName) {
      const interval = setInterval(() => {
        cursorOpacity.set(cursorOpacity.get() === 1 ? 0 : 1)
      }, 530)
      return () => clearInterval(interval)
    }
  }, [inputFocused, galleryName, cursorOpacity])

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Ultra-minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-stone-100">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link 
            href="/"
            className="group flex items-center gap-2 text-stone-400 hover:text-stone-900 transition-colors duration-300"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="text-[11px] font-medium tracking-[0.15em] uppercase">Back</span>
          </Link>
          
          {/* Step Indicator - Elegant line */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3">
            <motion.div
              className="h-px bg-stone-900 origin-left"
              initial={{ width: 0 }}
              animate={{ width: currentStep === 0 ? 24 : 48 }}
              transition={{ duration: 0.6, ease: EASE }}
            />
            <span className="text-[10px] font-medium tracking-[0.2em] text-stone-400 uppercase">
              {currentStep === 0 ? 'Name' : 'Photos'}
            </span>
          </div>

          <div className="w-16" />
        </div>
      </header>

      {/* Content */}
      <main className="min-h-screen flex flex-col items-center justify-center px-6 pt-14">
        <AnimatePresence mode="wait">
          {/* Step 1: Name Your Gallery */}
          {currentStep === 0 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-xl"
            >
              {/* Title Section */}
              <motion.div 
                className="text-center mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
              >
                <h1 className="text-[32px] md:text-[40px] font-light text-stone-900 tracking-[-0.02em] mb-3">
                  Name your gallery
                </h1>
                <p className="text-[13px] text-stone-400 tracking-[0.02em]">
                  This is what your clients will see
                </p>
              </motion.div>

              {/* Draft Restored Notification */}
              <AnimatePresence>
                {showDraftRestored && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="mb-8 p-3 bg-stone-100 text-stone-600 text-[11px] tracking-[0.05em] text-center"
                  >
                    Draft restored from your previous session
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="mb-8 p-4 bg-red-50 text-red-600 text-[12px] text-center border border-red-100"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gallery Name Input - Editorial style */}
              <motion.div 
                className="relative mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.2 }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={galleryName}
                  onChange={(e) => setGalleryName(e.target.value)}
                  onFocus={() => setInputFocused(true)}
                  onBlur={() => setInputFocused(false)}
                  placeholder="Sarah & James Wedding"
                  className="w-full text-center text-[24px] md:text-[28px] font-light text-stone-900 placeholder:text-stone-200 border-0 border-b border-stone-200 focus:border-stone-900 focus:ring-0 pb-4 bg-transparent transition-colors duration-500 tracking-[-0.01em]"
                  autoFocus
                />
                {/* Animated underline */}
                <motion.div
                  className="absolute bottom-0 left-1/2 h-px bg-stone-900"
                  initial={{ width: 0, x: '-50%' }}
                  animate={{ 
                    width: inputFocused ? '100%' : 0,
                    x: '-50%'
                  }}
                  transition={{ duration: 0.4, ease: EASE }}
                />
              </motion.div>

              {/* Optional Settings - Collapsed by default */}
              <motion.div 
                className="mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.3 }}
              >
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 mx-auto text-[11px] tracking-[0.15em] uppercase text-stone-400 hover:text-stone-600 transition-colors duration-300"
                >
                  <span>More options</span>
                  <motion.div
                    animate={{ rotate: showOptions ? 180 : 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <ChevronDown className="w-3.5 h-3.5" />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="mt-8 space-y-3 overflow-hidden"
                    >
                      {/* Password */}
                      <div className="flex items-center justify-between p-5 bg-white border border-stone-100 hover:border-stone-200 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center">
                            <Lock className="w-4 h-4 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-stone-900">Password protect</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">Require a password to view</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Optional"
                          className="w-32 text-right text-[13px] px-3 py-2 border-0 border-b border-stone-100 bg-transparent focus:ring-0 focus:border-stone-300 text-stone-900 placeholder:text-stone-300 transition-colors duration-300"
                        />
                      </div>

                      {/* Downloads */}
                      <div className="flex items-center justify-between p-5 bg-white border border-stone-100 hover:border-stone-200 transition-colors duration-300">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-stone-50 flex items-center justify-center">
                            <Download className="w-4 h-4 text-stone-400" />
                          </div>
                          <div>
                            <p className="text-[13px] font-medium text-stone-900">Allow downloads</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">Let clients download photos</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDownloadEnabled(!downloadEnabled)}
                          className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                            downloadEnabled ? 'bg-stone-900' : 'bg-stone-200'
                          }`}
                        >
                          <motion.div
                            animate={{ x: downloadEnabled ? 22 : 4 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                            className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>

                      {/* Template Selection */}
                      <div className="pt-6">
                        <p className="text-[11px] tracking-[0.15em] uppercase text-stone-400 mb-4">Gallery Style</p>
                        <TemplateSelector selected={template} onSelect={setTemplate} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Continue Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: EASE, delay: 0.4 }}
              >
                <motion.button
                  onClick={handleCreateGallery}
                  disabled={!galleryName.trim() || isCreating}
                  whileHover={{ scale: galleryName.trim() && !isCreating ? 1.01 : 1 }}
                  whileTap={{ scale: galleryName.trim() && !isCreating ? 0.99 : 1 }}
                  className="w-full h-14 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-200 disabled:text-stone-400 text-white text-[13px] font-medium tracking-[0.05em] transition-colors duration-300 flex items-center justify-center gap-3"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <span>Continue</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
                
                {/* Subtle hint */}
                <p className="text-center text-[10px] text-stone-300 mt-6 tracking-[0.05em]">
                  You can add photos in the next step
                </p>
              </motion.div>
            </motion.div>
          )}

          {/* Step 2: Add Photos */}
          {currentStep === 1 && galleryId && gallerySlug && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="w-full max-w-4xl"
            >
              <PhotosStep 
                galleryId={galleryId}
                gallerySlug={gallerySlug}
                onComplete={() => router.push(`/view-reel/${gallerySlug}`)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
