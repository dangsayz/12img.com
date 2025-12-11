'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, ChevronRight, ChevronLeft, Mail, UserCheck, Send } from 'lucide-react'
import {
  Vendor,
  CreateVendorInput,
  UpdateVendorInput,
  VENDOR_CATEGORY_OPTIONS,
} from '@/lib/vendors/types'
import { VendorCategoryIcon } from './VendorCategoryIcon'
import { 
  lookupUserByEmail, 
  getVendorEmailSuggestions,
  type RegisteredUser 
} from '@/server/actions/vendor.actions'

interface AddVendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: CreateVendorInput | UpdateVendorInput) => Promise<void>
  vendor?: Vendor | null
}

type Step = 'email' | 'category' | 'details'

export function AddVendorModal({ isOpen, onClose, onSave, vendor }: AddVendorModalProps) {
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<Step>('email')
  
  // Email lookup state
  const [email, setEmail] = useState('')
  const [emailSuggestions, setEmailSuggestions] = useState<string[]>([])
  const [foundUser, setFoundUser] = useState<RegisteredUser | null>(null)
  const [lookupDone, setLookupDone] = useState(false)

  const [formData, setFormData] = useState<CreateVendorInput>({
    business_name: '',
    category: 'other',
    contact_name: '',
    email: '',
    phone: '',
    instagram_handle: '',
    website: '',
    notes: '',
  })

  // Reset form when modal opens/closes or vendor changes
  useEffect(() => {
    if (isOpen) {
      if (vendor) {
        // Editing existing vendor
        setFormData({
          business_name: vendor.business_name || '',
          category: vendor.category || 'other',
          contact_name: vendor.contact_name || '',
          email: vendor.email || '',
          phone: vendor.phone || '',
          instagram_handle: vendor.instagram_handle || '',
          website: vendor.website || '',
          notes: vendor.notes || '',
        })
        setEmail(vendor.email || '')
        setStep('details') // Skip to details when editing
      } else {
        setFormData({
          business_name: '',
          category: 'other',
          contact_name: '',
          email: '',
          phone: '',
          instagram_handle: '',
          website: '',
          notes: '',
        })
        setEmail('')
        setStep('email')
      }
      setFoundUser(null)
      setLookupDone(false)
      setEmailSuggestions([])
      setError(null)
    }
  }, [isOpen, vendor])

  // Debounced email suggestions
  useEffect(() => {
    if (email.length < 2 || lookupDone) {
      setEmailSuggestions([])
      return
    }

    const timer = setTimeout(async () => {
      try {
        const suggestions = await getVendorEmailSuggestions(email)
        setEmailSuggestions(suggestions.filter(s => s !== email))
      } catch (err) {
        console.error('Suggestions error:', err)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [email, lookupDone])

  const handleEmailLookup = async () => {
    if (!email.includes('@')) return
    
    setChecking(true)
    setError(null)
    
    try {
      const user = await lookupUserByEmail(email)
      setFoundUser(user)
      setLookupDone(true)
      
      if (user) {
        // Auto-fill from registered user
        setFormData({
          ...formData,
          business_name: user.business_name || user.display_name || '',
          email: email,
          instagram_handle: user.instagram_handle || '',
          linked_user_id: user.id,
        })
      } else {
        // Not registered - just set email
        setFormData({
          ...formData,
          email: email,
          invite_email: email,
        })
      }
    } catch (err) {
      setError('Failed to check email')
    } finally {
      setChecking(false)
    }
  }

  const handleSelectSuggestion = (suggestedEmail: string) => {
    setEmail(suggestedEmail)
    setEmailSuggestions([])
  }

  const handleSubmit = async () => {
    setError(null)
    setLoading(true)

    try {
      await onSave(formData)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const isEditing = !!vendor

  const canProceed = () => {
    if (step === 'email') return lookupDone && email.includes('@')
    if (step === 'category') return true
    if (step === 'details') return formData.business_name.trim().length > 0
    return true
  }

  const goNext = () => {
    if (step === 'email') setStep('category')
    else if (step === 'category') setStep('details')
  }

  const goPrev = () => {
    if (step === 'details') setStep('category')
    else if (step === 'category') setStep('email')
  }

  const handleClose = () => {
    onClose()
  }

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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto max-h-[calc(100vh-2rem)] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
                <h2 className="text-lg font-semibold text-stone-900">
                  {isEditing ? 'Edit Vendor' : 'Add Vendor'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Indicator */}
              {!isEditing && (
                <div className="flex gap-1 px-6 pt-4">
                  {(['email', 'category', 'details'] as Step[]).map((s, i) => (
                    <div
                      key={s}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= ['email', 'category', 'details'].indexOf(step)
                          ? 'bg-stone-900'
                          : 'bg-stone-200'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {/* Step 1: Email */}
                  {step === 'email' && (
                    <motion.div
                      key="email"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Vendor's Email
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                            <input
                              type="email"
                              autoFocus
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value)
                                setLookupDone(false)
                                setFoundUser(null)
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && email.includes('@') && !lookupDone) {
                                  e.preventDefault()
                                  handleEmailLookup()
                                }
                              }}
                              placeholder="vendor@email.com"
                              className="w-full h-12 pl-10 pr-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            />
                          </div>
                          {!lookupDone && (
                            <button
                              onClick={handleEmailLookup}
                              disabled={!email.includes('@') || checking}
                              className="px-4 h-12 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                            >
                              {checking ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                'Check'
                              )}
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Email Suggestions */}
                      {emailSuggestions.length > 0 && !lookupDone && (
                        <div className="border border-stone-200 rounded-xl overflow-hidden">
                          <div className="px-3 py-2 bg-stone-50 border-b border-stone-200">
                            <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                              Previously Used
                            </p>
                          </div>
                          {emailSuggestions.map((suggestedEmail) => (
                            <button
                              key={suggestedEmail}
                              onClick={() => handleSelectSuggestion(suggestedEmail)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-0 text-left"
                            >
                              <Mail className="w-4 h-4 text-stone-400" />
                              <span className="text-sm text-stone-700">{suggestedEmail}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Lookup Result */}
                      {lookupDone && (
                        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
                          foundUser 
                            ? 'bg-stone-50 border-stone-200' 
                            : 'bg-stone-50 border-stone-200'
                        }`}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            foundUser ? 'bg-stone-900' : 'bg-stone-200'
                          }`}>
                            {foundUser ? (
                              <UserCheck className="w-5 h-5 text-white" />
                            ) : (
                              <Send className="w-5 h-5 text-stone-500" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            {foundUser ? (
                              <>
                                <p className="font-medium text-stone-900 truncate">
                                  {foundUser.business_name || foundUser.display_name}
                                </p>
                                <p className="text-xs text-stone-500">Registered on 12img</p>
                              </>
                            ) : (
                              <>
                                <p className="font-medium text-stone-900">Not registered</p>
                                <p className="text-xs text-stone-500">We'll send an invite when you save</p>
                              </>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setLookupDone(false)
                              setFoundUser(null)
                              setEmail('')
                            }}
                            className="p-1 text-stone-400 hover:text-stone-600"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Category */}
                  {step === 'category' && (
                    <motion.div
                      key="category"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <label className="block text-sm font-medium text-stone-700 mb-3">
                        Category
                      </label>
                      <div className="grid grid-cols-4 gap-1.5 max-h-[320px] overflow-y-auto">
                        {VENDOR_CATEGORY_OPTIONS.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, category: cat.id })}
                            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
                              formData.category === cat.id
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 hover:border-stone-300 text-stone-600'
                            }`}
                          >
                            <VendorCategoryIcon 
                              category={cat.id} 
                              size={18}
                              className={formData.category === cat.id ? 'text-white' : 'text-stone-500'}
                            />
                            <span className="text-[10px] font-medium leading-tight text-center">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Details */}
                  {step === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-4"
                    >
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-1">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          autoFocus={!foundUser}
                          value={formData.business_name}
                          onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                          placeholder="e.g., Fleur Boutique"
                          className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">
                            Contact Name
                          </label>
                          <input
                            type="text"
                            value={formData.contact_name || ''}
                            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                            placeholder="Sarah"
                            className="w-full h-10 px-3 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-500 mb-1">
                            Instagram
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">@</span>
                            <input
                              type="text"
                              value={(formData.instagram_handle || '').replace('@', '')}
                              onChange={(e) => setFormData({ ...formData, instagram_handle: e.target.value.replace('@', '') })}
                              placeholder="handle"
                              className="w-full h-10 pl-7 pr-3 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            />
                          </div>
                        </div>
                      </div>

                      {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                          {error}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-100 bg-stone-50 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    if (step === 'email' || isEditing) handleClose()
                    else goPrev()
                  }}
                  className="px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1"
                >
                  {step !== 'email' && !isEditing && <ChevronLeft className="w-4 h-4" />}
                  {step === 'email' || isEditing ? 'Cancel' : 'Back'}
                </button>

                {step !== 'details' ? (
                  <button
                    type="button"
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading || !canProceed()}
                    className="px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isEditing ? 'Save' : foundUser ? 'Add Vendor' : 'Add & Invite'}
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
