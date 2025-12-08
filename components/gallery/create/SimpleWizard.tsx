'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  ArrowRight,
  Check,
  Loader2,
  Lock,
  Download,
  ChevronDown,
  Sparkles,
  Save
} from 'lucide-react'
import { createGallery } from '@/server/actions/gallery.actions'
import { PhotosStep } from './steps/PhotosStep'
import { ShareStep } from './steps/ShareStep'
import { TemplateSelector } from '@/components/gallery/templates/TemplateSelector'
import { type GalleryTemplate, DEFAULT_TEMPLATE } from '@/components/gallery/templates'

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

      if (result.galleryId) {
        setGalleryId(result.galleryId)
        clearDraft() // Clear the draft after successful creation
        setCurrentStep(1)
      }
    } catch {
      setError('Failed to create gallery')
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Minimal Header */}
      <header className="border-b border-[#E5E5E5] bg-white">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link 
            href="/"
            className="flex items-center gap-2 text-[#525252] hover:text-[#141414] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          
          {/* Step Indicator - Super minimal */}
          <div className="flex items-center gap-2">
            {[0, 1, 2].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all ${
                  step === currentStep 
                    ? 'w-8 bg-[#141414]' 
                    : step < currentStep 
                      ? 'w-1.5 bg-emerald-500' 
                      : 'w-1.5 bg-[#E5E5E5]'
                }`}
              />
            ))}
          </div>

          <div className="w-16" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-12 md:py-16">
        <AnimatePresence mode="wait">
          {/* Step 1: Name Your Gallery */}
          {currentStep === 0 && (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h1 className="text-3xl font-serif text-[#141414] mb-2">
                  Name your gallery
                </h1>
                <p className="text-[#525252]">
                  This is what your clients will see
                </p>
              </div>

              {/* Draft Restored Notification */}
              <AnimatePresence>
                {showDraftRestored && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-3 bg-emerald-50 text-emerald-700 text-sm text-center border border-emerald-200 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Draft restored! Your previous work was saved automatically.
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="p-4 bg-red-50 text-red-600 rounded-[2px] text-sm text-center border border-red-200"
                  >
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Gallery Name Input - Big and prominent */}
              <div className="bg-white p-8 border border-[#E5E5E5]">
                <input
                  type="text"
                  value={galleryName}
                  onChange={(e) => setGalleryName(e.target.value)}
                  placeholder="Sarah & James Wedding"
                  className="w-full text-center text-2xl font-medium text-[#141414] placeholder:text-[#E5E5E5] border-0 border-b-2 border-[#E5E5E5] focus:border-[#141414] focus:ring-0 pb-4 bg-transparent transition-colors"
                  autoFocus
                />
              </div>

              {/* Optional Settings - Collapsed by default */}
              <div className="pt-4">
                <button
                  onClick={() => setShowOptions(!showOptions)}
                  className="flex items-center gap-2 mx-auto text-sm text-[#525252] hover:text-[#141414] transition-colors"
                >
                  <span>More options</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showOptions && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-6 space-y-4"
                    >
                      {/* Password */}
                      <div className="flex items-center justify-between p-4 bg-white border border-[#E5E5E5]">
                        <div className="flex items-center gap-3">
                          <Lock className="w-5 h-5 text-[#525252]" />
                          <div>
                            <p className="font-medium text-[#141414]">Password protect</p>
                            <p className="text-xs text-[#525252]">Require a password to view</p>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Optional"
                          className="w-36 text-right text-sm px-3 py-2 border border-stone-200 bg-stone-50 focus:ring-1 focus:ring-stone-400 focus:border-stone-400 text-[#141414] placeholder:text-stone-400"
                        />
                      </div>

                      {/* Downloads */}
                      <div className="flex items-center justify-between p-4 bg-white border border-[#E5E5E5]">
                        <div className="flex items-center gap-3">
                          <Download className="w-5 h-5 text-[#525252]" />
                          <div>
                            <p className="font-medium text-[#141414]">Allow downloads</p>
                            <p className="text-xs text-[#525252]">Let clients download photos</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setDownloadEnabled(!downloadEnabled)}
                          className={`w-12 h-7 rounded-full transition-colors ${
                            downloadEnabled ? 'bg-emerald-500' : 'bg-[#E5E5E5]'
                          }`}
                        >
                          <motion.div
                            animate={{ x: downloadEnabled ? 22 : 4 }}
                            className="w-5 h-5 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>

                      {/* Template Selection */}
                      <div className="pt-4">
                        <p className="font-medium text-[#141414] mb-3">Gallery Style</p>
                        <TemplateSelector selected={template} onSelect={setTemplate} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Continue Button */}
              <div className="pt-8">
                <button
                  onClick={handleCreateGallery}
                  disabled={!galleryName.trim() || isCreating}
                  className="w-full h-14 bg-[#141414] hover:bg-black disabled:bg-[#E5E5E5] disabled:text-[#525252] text-white rounded-[2px] font-medium text-lg transition-all flex items-center justify-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Add Photos */}
          {currentStep === 1 && galleryId && (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              <PhotosStep 
                galleryId={galleryId}
                onComplete={() => setCurrentStep(2)}
              />
            </motion.div>
          )}

          {/* Step 3: Share */}
          {currentStep === 2 && galleryId && (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ShareStep 
                galleryId={galleryId}
                galleryName={galleryName}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
