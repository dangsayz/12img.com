'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wand2 } from 'lucide-react'
import { createClientProfile, getClientLocationSuggestions } from '@/server/actions/client.actions'
import { type EventType } from '@/types/database'
import { EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'client' | 'event' | 'package'

const EVENT_TYPES: EventType[] = [
  'wedding',
  'engagement',
  'portrait',
  'family',
  'newborn',
  'maternity',
  'corporate',
  'event',
  'other',
]

export function CreateClientModal({ isOpen, onClose }: CreateClientModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('client')
  const [error, setError] = useState<string | null>(null)
  
  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<{ locations: string[], venues: string[] }>({ locations: [], venues: [] })
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false)

  // Form state - load from localStorage if available
  const [formData, setFormData] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('create-client-draft')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {}
      }
    }
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      partnerFirstName: '',
      partnerLastName: '',
      partnerEmail: '',
      eventType: 'wedding' as EventType,
      eventDate: '',
      eventLocation: '',
      eventVenue: '',
      packageName: '',
      packagePrice: '',
      packageHours: '',
      packageDescription: '',
      retainerFee: '',
      balanceDueDate: '',
      notes: '',
    }
  })

  // Auto-save form data to localStorage
  useEffect(() => {
    if (isOpen) {
      localStorage.setItem('create-client-draft', JSON.stringify(formData))
    }
  }, [formData, isOpen])

  // Load suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      getClientLocationSuggestions().then(setSuggestions)
    }
  }, [isOpen])

  // Filter suggestions based on input
  const filteredLocations = suggestions.locations.filter(loc => 
    loc.toLowerCase().includes(formData.eventLocation.toLowerCase()) && 
    loc.toLowerCase() !== formData.eventLocation.toLowerCase()
  )
  const filteredVenues = suggestions.venues.filter(venue => 
    venue.toLowerCase().includes(formData.eventVenue.toLowerCase()) &&
    venue.toLowerCase() !== formData.eventVenue.toLowerCase()
  )

  // Format phone number as user types: 000-000-0000
  const formatPhoneNumber = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 10)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }

  const updateField = (field: string, value: string) => {
    setFormData((prev: typeof formData) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createClientProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        partnerFirstName: formData.partnerFirstName || null,
        partnerLastName: formData.partnerLastName || null,
        partnerEmail: formData.partnerEmail || null,
        eventType: formData.eventType,
        eventDate: formData.eventDate || null,
        eventLocation: formData.eventLocation || null,
        eventVenue: formData.eventVenue || null,
        packageName: formData.packageName || null,
        packagePrice: formData.packagePrice ? parseFloat(formData.packagePrice) : null,
        packageHours: formData.packageHours ? parseInt(formData.packageHours) : null,
        packageDescription: formData.packageDescription || null,
        retainerFee: formData.retainerFee ? parseFloat(formData.retainerFee) : null,
        balanceDueDate: formData.balanceDueDate || null,
        notes: formData.notes || null,
      })

      if (!result.success) {
        setError(result.error?.message || 'Failed to create client')
        return
      }

      router.push(`/dashboard/clients/${result.data?.id}`)
      onClose()
      resetForm()
    })
  }

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      partnerFirstName: '',
      partnerLastName: '',
      partnerEmail: '',
      eventType: 'wedding',
      eventDate: '',
      eventLocation: '',
      eventVenue: '',
      packageName: '',
      packagePrice: '',
      packageHours: '',
      packageDescription: '',
      retainerFee: '',
      balanceDueDate: '',
      notes: '',
    })
    setStep('client')
    setError(null)
    // Clear saved draft
    localStorage.removeItem('create-client-draft')
  }

  const canProceed = () => {
    if (step === 'client') {
      return formData.firstName && formData.lastName && formData.email
    }
    return true
  }

  const handleClose = () => {
    onClose()
    setTimeout(resetForm, 300)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 md:flex md:items-center md:justify-center md:p-4"
          onClick={handleClose}
        >
          {/* Mobile: Full-screen sheet from bottom | Desktop: Centered modal */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:w-full md:max-w-md md:rounded-xl md:shadow-2xl flex flex-col"
          >
            {/* Header - Safe area for notch */}
            <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-stone-100 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">New Client</h2>
                <p className="text-sm text-stone-500">
                  {step === 'client' && 'Contact info'}
                  {step === 'event' && 'Event details'}
                  {step === 'package' && 'Package'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-3 -mr-2 hover:bg-stone-100 rounded-full transition-colors active:bg-stone-200"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Progress - Tappable navigation */}
            <div className="flex gap-2 px-5 pt-4">
              {(['client', 'event', 'package'] as Step[]).map((s, i) => {
                const currentIndex = ['client', 'event', 'package'].indexOf(step)
                const isCompleted = i < currentIndex
                const isCurrent = i === currentIndex
                const canNavigate = i <= currentIndex // Can go back to completed steps
                
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => canNavigate && setStep(s)}
                    disabled={!canNavigate}
                    className={`h-2 flex-1 rounded-full transition-all ${
                      isCompleted || isCurrent
                        ? 'bg-stone-900'
                        : 'bg-stone-200'
                    } ${canNavigate ? 'cursor-pointer active:scale-95' : 'cursor-default'}`}
                    aria-label={`Go to ${s} step`}
                  />
                )
              })}
            </div>

            {/* Content - Scrollable area with generous padding */}
            <div className="px-5 py-5 overflow-y-auto flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {step === 'client' && (
                  <motion.div
                    key="client"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={e => updateField('firstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="Jane"
                          maxLength={50}
                          autoComplete="given-name"
                          enterKeyHint="next"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={e => updateField('lastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="Smith"
                          maxLength={50}
                          autoComplete="family-name"
                          enterKeyHint="next"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="jane@example.com"
                        autoComplete="email"
                        inputMode="email"
                        enterKeyHint="next"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => updateField('phone', formatPhoneNumber(e.target.value))}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="000-000-0000"
                        maxLength={12}
                        autoComplete="tel"
                        inputMode="tel"
                        enterKeyHint="next"
                      />
                    </div>

                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-sm font-medium text-stone-700 mb-3">
                        Partner (optional)
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          value={formData.partnerFirstName}
                          onChange={e => updateField('partnerFirstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="First name"
                          maxLength={50}
                          autoComplete="off"
                          enterKeyHint="next"
                        />
                        <input
                          type="text"
                          value={formData.partnerLastName}
                          onChange={e => updateField('partnerLastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="Last name"
                          maxLength={50}
                          autoComplete="off"
                          enterKeyHint="done"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {step === 'event' && (
                  <motion.div
                    key="event"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-3">
                        Event Type
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {EVENT_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField('eventType', type)}
                            className={`px-3 py-3 text-sm font-medium rounded-xl border transition-all active:scale-95 ${
                              formData.eventType === type
                                ? 'border-stone-900 bg-stone-900 text-white shadow-sm'
                                : 'border-stone-200 hover:border-stone-300 active:bg-stone-50'
                            }`}
                          >
                            {EVENT_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={e => updateField('eventDate', e.target.value)}
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 bg-white appearance-none"
                        style={{ colorScheme: 'light' }}
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.eventLocation}
                        onChange={e => {
                          updateField('eventLocation', e.target.value)
                          setShowLocationSuggestions(true)
                        }}
                        onFocus={() => setShowLocationSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 150)}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="City, State"
                        maxLength={200}
                        autoComplete="off"
                        enterKeyHint="next"
                      />
                      {/* Location Suggestions Dropdown */}
                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filteredLocations.map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventLocation', loc)
                                setShowLocationSuggestions(false)
                              }}
                              className="w-full px-4 py-3 text-left text-base hover:bg-stone-50 active:bg-stone-100 flex items-center gap-3 border-b border-stone-100 last:border-0"
                            >
                              <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-emerald-600 text-xs">
                                ✓
                              </span>
                              {loc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Venue
                      </label>
                      <input
                        type="text"
                        value={formData.eventVenue}
                        onChange={e => {
                          updateField('eventVenue', e.target.value)
                          setShowVenueSuggestions(true)
                        }}
                        onFocus={() => setShowVenueSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowVenueSuggestions(false), 150)}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="Venue name"
                        maxLength={200}
                        autoComplete="off"
                        enterKeyHint="done"
                      />
                      {/* Venue Suggestions Dropdown */}
                      {showVenueSuggestions && filteredVenues.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filteredVenues.map(venue => (
                            <button
                              key={venue}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventVenue', venue)
                                setShowVenueSuggestions(false)
                              }}
                              className="w-full px-4 py-3 text-left text-base hover:bg-stone-50 active:bg-stone-100 flex items-center gap-3 border-b border-stone-100 last:border-0"
                            >
                              <span className="w-5 h-5 rounded-full border border-stone-300 flex items-center justify-center text-emerald-600 text-xs">
                                ✓
                              </span>
                              {venue}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {step === 'package' && (
                  <motion.div
                    key="package"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Package Name
                      </label>
                      <input
                        type="text"
                        value={formData.packageName || `${EVENT_TYPE_LABELS[formData.eventType as EventType]} Photography`}
                        onChange={e => updateField('packageName', e.target.value)}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="e.g., Full Day Coverage"
                        autoComplete="off"
                        enterKeyHint="next"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Total Price ($)
                        </label>
                        <input
                          type="text"
                          value={formData.packagePrice}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7)
                            const num = parseInt(value)
                            if (value === '' || (num >= 0 && num <= 999999)) {
                              updateField('packagePrice', value)
                            }
                          }}
                          className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="3500"
                          maxLength={7}
                          inputMode="numeric"
                          enterKeyHint="next"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Hours
                        </label>
                        <input
                          type="text"
                          value={formData.packageHours}
                          onChange={e => {
                            const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 2)
                            const num = parseInt(value)
                            if (value === '' || (num >= 1 && num <= 99)) {
                              updateField('packageHours', value)
                            }
                          }}
                          className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="8"
                          maxLength={2}
                          inputMode="numeric"
                          enterKeyHint="next"
                        />
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="pt-4 border-t border-stone-100">
                      <p className="text-sm font-medium text-stone-700 mb-3">
                        Payment Details
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">
                            Deposit ($)
                          </label>
                          <input
                            type="text"
                            value={formData.retainerFee}
                            onChange={e => {
                              const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7)
                              const num = parseInt(value)
                              const maxDeposit = formData.packagePrice ? parseInt(formData.packagePrice) : 999999
                              if (value === '' || (num >= 0 && num <= Math.min(maxDeposit, 999999))) {
                                updateField('retainerFee', value)
                              }
                            }}
                            className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                            placeholder="1000"
                            maxLength={7}
                            inputMode="numeric"
                            enterKeyHint="next"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-stone-700 mb-2">
                            Balance Due
                          </label>
                          <div className="h-12 px-4 flex items-center text-base border border-stone-200 rounded-xl bg-stone-50">
                            <span className="text-stone-600">
                              {formData.packagePrice && formData.retainerFee
                                ? `$${(parseFloat(formData.packagePrice) - parseFloat(formData.retainerFee)).toLocaleString()}`
                                : formData.packagePrice
                                ? `$${parseFloat(formData.packagePrice).toLocaleString()}`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-stone-700">
                          Notes
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const lines: string[] = []
                            
                            // Client info
                            const clientName = formData.partnerFirstName
                              ? `${formData.firstName} ${formData.lastName} & ${formData.partnerFirstName} ${formData.partnerLastName || formData.lastName}`
                              : `${formData.firstName} ${formData.lastName}`
                            lines.push(`CLIENT: ${clientName}`)
                            if (formData.email) lines.push(`Email: ${formData.email}`)
                            if (formData.phone) lines.push(`Phone: ${formData.phone}`)
                            lines.push('')
                            
                            // Event info
                            lines.push(`EVENT: ${EVENT_TYPE_LABELS[formData.eventType as EventType]}`)
                            if (formData.eventDate) {
                              const date = new Date(formData.eventDate + 'T00:00:00')
                              lines.push(`Date: ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`)
                            }
                            if (formData.eventVenue) lines.push(`Venue: ${formData.eventVenue}`)
                            if (formData.eventLocation) lines.push(`Location: ${formData.eventLocation}`)
                            lines.push('')
                            
                            // Package info
                            if (formData.packageName) {
                              lines.push(`PACKAGE: ${formData.packageName}`)
                            } else {
                              lines.push('PACKAGE DETAILS')
                            }
                            if (formData.packageHours) lines.push(`Coverage: ${formData.packageHours} hours`)
                            if (formData.packagePrice) {
                              const price = parseFloat(formData.packagePrice)
                              lines.push(`Investment: $${price.toLocaleString()}`)
                            }
                            lines.push('')
                            
                            // Payment breakdown
                            if (formData.retainerFee || formData.packagePrice) {
                              lines.push('PAYMENT SCHEDULE')
                              if (formData.retainerFee) {
                                const retainer = parseFloat(formData.retainerFee)
                                lines.push(`Deposit: $${retainer.toLocaleString()} (due upon signing)`)
                              }
                              if (formData.packagePrice) {
                                const price = parseFloat(formData.packagePrice)
                                const retainer = formData.retainerFee ? parseFloat(formData.retainerFee) : 0
                                const remaining = price - retainer
                                if (remaining > 0) {
                                  lines.push(`Balance: $${remaining.toLocaleString()} (due before event)`)
                                }
                              }
                            }
                            
                            updateField('notes', lines.join('\n'))
                          }}
                          className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 rounded-lg transition-colors"
                        >
                          <Wand2 className="w-4 h-4" />
                          Generate Summary
                        </button>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        rows={6}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 resize-none font-mono text-sm"
                        placeholder="Tap 'Generate Summary' to create a detailed overview..."
                        enterKeyHint="done"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p className="mt-4 text-sm text-red-600 bg-red-50 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}
            </div>

            {/* Footer - Sticky at bottom with safe area padding + extra space for floating widgets */}
            <div className="flex items-center justify-between px-5 py-4 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] sm:pb-4 border-t border-stone-100 bg-white sticky bottom-0">
              <button
                onClick={() => {
                  if (step === 'event') setStep('client')
                  else if (step === 'package') setStep('event')
                  else handleClose()
                }}
                className="px-5 py-3 text-base font-medium text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-xl transition-colors"
              >
                {step === 'client' ? 'Cancel' : 'Back'}
              </button>

              {step !== 'package' ? (
                <button
                  onClick={() => {
                    if (step === 'client') setStep('event')
                    else if (step === 'event') setStep('package')
                  }}
                  disabled={!canProceed()}
                  className="px-6 py-3 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50 min-w-[120px]"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Client
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
