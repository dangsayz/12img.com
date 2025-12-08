'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Send,
  Users,
  Eye,
  Loader2,
  Sparkles,
  ChevronDown,
  Check,
} from 'lucide-react'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  subscriberCount: number
}

type TargetAudience = 'all' | 'free' | 'paid' | 'custom'

const audienceOptions: { value: TargetAudience; label: string; description: string }[] = [
  { value: 'all', label: 'All Subscribers', description: 'Send to everyone on your list' },
  { value: 'free', label: 'Free Users', description: 'Users on the free plan' },
  { value: 'paid', label: 'Paid Users', description: 'Users with active subscriptions' },
  { value: 'custom', label: 'Custom Segment', description: 'Filter by tags or criteria' },
]

export function CreateCampaignModal({ isOpen, onClose, subscriberCount }: CreateCampaignModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [previewText, setPreviewText] = useState('')
  const [htmlContent, setHtmlContent] = useState('')
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all')
  const [customTags, setCustomTags] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'details' | 'content' | 'audience' | 'review'>('details')
  
  const handleSubmit = async (asDraft: boolean = true) => {
    setError(null)
    
    if (!name.trim()) {
      setError('Campaign name is required')
      return
    }
    if (!subject.trim()) {
      setError('Subject line is required')
      return
    }
    if (!htmlContent.trim()) {
      setError('Email content is required')
      return
    }
    
    startTransition(async () => {
      try {
        const response = await fetch('/api/admin/campaigns', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            subject: subject.trim(),
            preview_text: previewText.trim() || null,
            html_content: htmlContent,
            text_content: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML for text version
            status: asDraft ? 'draft' : 'scheduled',
            segment_filter: targetAudience === 'all' ? {} : { plan: targetAudience },
            tags_filter: customTags,
          }),
        })
        
        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Failed to create campaign')
        }
        
        router.refresh()
        onClose()
        resetForm()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create campaign')
      }
    })
  }
  
  const resetForm = () => {
    setName('')
    setSubject('')
    setPreviewText('')
    setHtmlContent('')
    setTargetAudience('all')
    setCustomTags([])
    setError(null)
    setStep('details')
  }
  
  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }
  
  const canProceed = () => {
    switch (step) {
      case 'details':
        return name.trim() && subject.trim()
      case 'content':
        return htmlContent.trim()
      case 'audience':
        return true
      case 'review':
        return true
      default:
        return false
    }
  }
  
  const steps = ['details', 'content', 'audience', 'review'] as const
  const currentStepIndex = steps.indexOf(step)
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[calc(100vh-4rem)] bg-white rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center">
                  <Send className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h2 className="font-semibold text-[#141414]">Create Campaign</h2>
                  <p className="text-sm text-[#525252]">
                    {subscriberCount.toLocaleString()} subscribers available
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-[#525252]" />
              </button>
            </div>
            
            {/* Progress Steps */}
            <div className="px-6 py-3 border-b border-[#E5E5E5] bg-stone-50">
              <div className="flex items-center gap-2">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center">
                    <button
                      onClick={() => i <= currentStepIndex && setStep(s)}
                      disabled={i > currentStepIndex}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        step === s
                          ? 'bg-stone-900 text-white'
                          : i < currentStepIndex
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-200 text-stone-500'
                      }`}
                    >
                      {i < currentStepIndex ? (
                        <Check className="w-3.5 h-3.5" />
                      ) : (
                        <span className="w-4 text-center">{i + 1}</span>
                      )}
                      <span className="capitalize hidden sm:inline">{s}</span>
                    </button>
                    {i < steps.length - 1 && (
                      <div className={`w-8 h-0.5 mx-1 ${i < currentStepIndex ? 'bg-emerald-300' : 'bg-stone-200'}`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700">
                  {error}
                </div>
              )}
              
              {/* Step 1: Details */}
              {step === 'details' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Campaign Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., December Newsletter"
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-stone-400 transition-colors"
                    />
                    <p className="text-xs text-[#8A8A8A] mt-1">Internal name for your reference</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Subject Line *
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g., Your December gallery highlights"
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-stone-400 transition-colors"
                    />
                    <p className="text-xs text-[#8A8A8A] mt-1">{subject.length}/60 characters recommended</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Preview Text
                    </label>
                    <input
                      type="text"
                      value={previewText}
                      onChange={(e) => setPreviewText(e.target.value)}
                      placeholder="e.g., See what's new this month..."
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-stone-400 transition-colors"
                    />
                    <p className="text-xs text-[#8A8A8A] mt-1">Shows after subject in inbox preview</p>
                  </div>
                </div>
              )}
              
              {/* Step 2: Content */}
              {step === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-2">
                      Email Content *
                    </label>
                    <textarea
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Write your email content here... HTML is supported."
                      rows={12}
                      className="w-full px-4 py-3 border border-[#E5E5E5] rounded-lg focus:outline-none focus:border-stone-400 transition-colors font-mono text-sm"
                    />
                    <p className="text-xs text-[#8A8A8A] mt-1">
                      Supports HTML. Use {"{{name}}"} for personalization.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-stone-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span className="text-sm font-medium text-[#141414]">Quick Templates</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setHtmlContent(`<h1>Hello {{name}}!</h1>\n<p>We have exciting news to share with you.</p>\n<p>Best regards,<br>The 12img Team</p>`)}
                        className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded text-xs hover:border-stone-300 transition-colors"
                      >
                        Simple Announcement
                      </button>
                      <button
                        onClick={() => setHtmlContent(`<h1>New Features Alert!</h1>\n<p>Hi {{name}},</p>\n<p>We've been working hard to bring you new features:</p>\n<ul>\n  <li>Feature 1</li>\n  <li>Feature 2</li>\n  <li>Feature 3</li>\n</ul>\n<p><a href="#">Check them out →</a></p>`)}
                        className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded text-xs hover:border-stone-300 transition-colors"
                      >
                        Feature Update
                      </button>
                      <button
                        onClick={() => setHtmlContent(`<h1>Special Offer Inside!</h1>\n<p>Hi {{name}},</p>\n<p>For a limited time, enjoy exclusive benefits:</p>\n<p style="font-size: 24px; font-weight: bold;">20% OFF</p>\n<p>Use code: SPECIAL20</p>\n<p><a href="#">Claim Your Discount →</a></p>`)}
                        className="px-3 py-1.5 bg-white border border-[#E5E5E5] rounded text-xs hover:border-stone-300 transition-colors"
                      >
                        Promotional
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 3: Audience */}
              {step === 'audience' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#141414] mb-3">
                      Target Audience
                    </label>
                    <div className="space-y-2">
                      {audienceOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setTargetAudience(option.value)}
                          className={`w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-colors ${
                            targetAudience === option.value
                              ? 'border-stone-900 bg-stone-50'
                              : 'border-[#E5E5E5] hover:border-stone-300'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            targetAudience === option.value
                              ? 'border-stone-900 bg-stone-900'
                              : 'border-stone-300'
                          }`}>
                            {targetAudience === option.value && (
                              <Check className="w-3 h-3 text-white" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-[#141414]">{option.label}</p>
                            <p className="text-sm text-[#525252]">{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-800">
                        Estimated Recipients: {subscriberCount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Review */}
              {step === 'review' && (
                <div className="space-y-6">
                  <div className="p-4 bg-stone-50 rounded-lg space-y-3">
                    <div>
                      <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Campaign Name</p>
                      <p className="font-medium text-[#141414]">{name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Subject</p>
                      <p className="font-medium text-[#141414]">{subject}</p>
                    </div>
                    {previewText && (
                      <div>
                        <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Preview Text</p>
                        <p className="text-[#525252]">{previewText}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Audience</p>
                      <p className="font-medium text-[#141414] capitalize">{targetAudience} subscribers</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xs text-[#8A8A8A] uppercase tracking-wider mb-2">Email Preview</p>
                    <div className="border border-[#E5E5E5] rounded-lg p-4 bg-white max-h-48 overflow-y-auto">
                      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5E5] bg-stone-50">
              <button
                onClick={currentStepIndex > 0 ? () => setStep(steps[currentStepIndex - 1]) : handleClose}
                className="px-4 py-2 text-sm font-medium text-[#525252] hover:text-[#141414] transition-colors"
              >
                {currentStepIndex > 0 ? 'Back' : 'Cancel'}
              </button>
              
              <div className="flex items-center gap-3">
                {step === 'review' && (
                  <button
                    onClick={() => handleSubmit(true)}
                    disabled={isPending}
                    className="px-4 py-2 text-sm font-medium text-[#525252] border border-[#E5E5E5] rounded-lg hover:border-stone-300 transition-colors disabled:opacity-50"
                  >
                    Save as Draft
                  </button>
                )}
                
                <button
                  onClick={() => {
                    if (step === 'review') {
                      handleSubmit(true) // Save as draft for now
                    } else if (canProceed()) {
                      setStep(steps[currentStepIndex + 1])
                    }
                  }}
                  disabled={!canProceed() || isPending}
                  className="flex items-center gap-2 px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : step === 'review' ? (
                    <>
                      <Send className="w-4 h-4" />
                      Create Campaign
                    </>
                  ) : (
                    'Continue'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
