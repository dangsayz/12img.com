'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wand2, ChevronLeft, ChevronRight, User, Calendar, Package } from 'lucide-react'
import { updateClientProfile, getClientLocationSuggestions } from '@/server/actions/client.actions'
import { type EventType } from '@/types/database'
import { type ClientProfile, EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientProfile
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

const STEPS: { key: Step; label: string; icon: typeof User }[] = [
  { key: 'client', label: 'Contact', icon: User },
  { key: 'event', label: 'Event', icon: Calendar },
  { key: 'package', label: 'Package', icon: Package },
]

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('client')
  const [error, setError] = useState<string | null>(null)
  
  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<{ locations: string[], venues: string[] }>({ locations: [], venues: [] })
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [showVenueSuggestions, setShowVenueSuggestions] = useState(false)

  // Form state - initialized from client
  const [formData, setFormData] = useState({
    firstName: client.firstName,
    lastName: client.lastName,
    email: client.email,
    phone: client.phone || '',
    partnerFirstName: client.partnerFirstName || '',
    partnerLastName: client.partnerLastName || '',
    partnerEmail: client.partnerEmail || '',
    partnerPhone: client.partnerPhone || '',
    eventType: client.eventType,
    eventDate: client.eventDate || '',
    eventLocation: client.eventLocation || '',
    eventVenue: client.eventVenue || '',
    packageName: client.packageName || '',
    packagePrice: client.packagePrice?.toString() || '',
    packageHours: client.packageHours?.toString() || '',
    retainerFee: client.retainerFee?.toString() || '',
    packageDescription: client.packageDescription || '',
    notes: client.notes || '',
  })

  // Reset form when client changes
  useEffect(() => {
    setFormData({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone || '',
      partnerFirstName: client.partnerFirstName || '',
      partnerLastName: client.partnerLastName || '',
      partnerEmail: client.partnerEmail || '',
      partnerPhone: client.partnerPhone || '',
      eventType: client.eventType,
      eventDate: client.eventDate || '',
      eventLocation: client.eventLocation || '',
      eventVenue: client.eventVenue || '',
      packageName: client.packageName || '',
      packagePrice: client.packagePrice?.toString() || '',
      packageHours: client.packageHours?.toString() || '',
      retainerFee: client.retainerFee?.toString() || '',
      packageDescription: client.packageDescription || '',
      notes: client.notes || '',
    })
    setStep('client')
    setError(null)
  }, [client, isOpen])

  // Load suggestions when modal opens
  useEffect(() => {
    if (isOpen) {
      getClientLocationSuggestions().then(setSuggestions)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

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

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateClientProfile(client.id, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        partnerFirstName: formData.partnerFirstName || null,
        partnerLastName: formData.partnerLastName || null,
        partnerEmail: formData.partnerEmail || null,
        partnerPhone: formData.partnerPhone || null,
        eventType: formData.eventType,
        eventDate: formData.eventDate || null,
        eventLocation: formData.eventLocation || null,
        eventVenue: formData.eventVenue || null,
        packageName: formData.packageName || null,
        packagePrice: formData.packagePrice ? parseFloat(formData.packagePrice) : null,
        packageHours: formData.packageHours ? parseInt(formData.packageHours) : null,
        retainerFee: formData.retainerFee ? parseFloat(formData.retainerFee) : null,
        packageDescription: formData.packageDescription || null,
        notes: formData.notes || null,
      })

      if (!result.success) {
        setError(result.error?.message || 'Failed to update client')
        return
      }

      router.refresh()
      onClose()
    })
  }

  const canProceed = () => {
    if (step === 'client') {
      return formData.firstName && formData.lastName && formData.email
    }
    return true
  }

  const currentStepIndex = STEPS.findIndex(s => s.key === step)
  const goNext = () => {
    if (currentStepIndex < STEPS.length - 1) {
      setStep(STEPS[currentStepIndex + 1].key)
    }
  }
  const goPrev = () => {
    if (currentStepIndex > 0) {
      setStep(STEPS[currentStepIndex - 1].key)
    }
  }

  // Mobile-first bottom sheet animation
  const sheetVariants = {
    hidden: { 
      opacity: 0,
      y: '100%',
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring' as const,
        damping: 30,
        stiffness: 300,
      }
    },
    exit: { 
      opacity: 0,
      y: '100%',
      transition: {
        duration: 0.2,
      }
    }
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal - Full screen on mobile, centered on desktop */}
          <motion.div
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={e => e.stopPropagation()}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[20px] sm:rounded-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-[5vh] sm:-translate-x-1/2 sm:max-w-lg sm:w-[calc(100%-2rem)] max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {/* Drag Handle - Mobile only */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-stone-300 rounded-full" />
            </div>

            {/* Header - Sticky */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-4 border-b border-stone-100">
              <div className="flex items-center gap-3">
                {currentStepIndex > 0 && (
                  <button
                    onClick={goPrev}
                    className="w-10 h-10 -ml-2 flex items-center justify-center rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-stone-600" />
                  </button>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">Edit Client</h2>
                  <p className="text-sm text-stone-500">
                    {STEPS[currentStepIndex].label}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 active:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Step Indicators - Tappable pills */}
            <div className="flex-shrink-0 flex gap-2 px-5 py-3 bg-stone-50/50">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isActive = i === currentStepIndex
                const isCompleted = i < currentStepIndex
                return (
                  <button
                    key={s.key}
                    onClick={() => setStep(s.key)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all active:scale-[0.98] ${
                      isActive
                        ? 'bg-stone-900 text-white shadow-lg'
                        : isCompleted
                        ? 'bg-stone-200 text-stone-700'
                        : 'bg-white text-stone-400 border border-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:inline">{s.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
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
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="Jane"
                          maxLength={50}
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
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="Smith"
                          maxLength={50}
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                        placeholder="jane@example.com"
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                        placeholder="000-000-0000"
                        maxLength={12}
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
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="First name"
                          maxLength={50}
                        />
                        <input
                          type="text"
                          value={formData.partnerLastName}
                          onChange={e => updateField('partnerLastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="Last name"
                          maxLength={50}
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
                            className={`h-11 px-3 text-sm font-medium rounded-xl border transition-all active:scale-[0.98] ${
                              formData.eventType === type
                                ? 'border-stone-900 bg-stone-900 text-white shadow-md'
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                        placeholder="City, State"
                        maxLength={200}
                      />
                      {/* Location Suggestions Dropdown */}
                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filteredLocations.map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventLocation', loc)
                                setShowLocationSuggestions(false)
                              }}
                              className="w-full h-12 px-4 text-left text-base hover:bg-stone-50 active:bg-stone-100 flex items-center gap-3 border-b border-stone-100 last:border-0"
                            >
                              <span className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs">
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                        placeholder="Venue name"
                        maxLength={200}
                      />
                      {/* Venue Suggestions Dropdown */}
                      {showVenueSuggestions && filteredVenues.length > 0 && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-stone-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                          {filteredVenues.map(venue => (
                            <button
                              key={venue}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventVenue', venue)
                                setShowVenueSuggestions(false)
                              }}
                              className="w-full h-12 px-4 text-left text-base hover:bg-stone-50 active:bg-stone-100 flex items-center gap-3 border-b border-stone-100 last:border-0"
                            >
                              <span className="w-5 h-5 rounded-full bg-stone-900 flex items-center justify-center text-white text-xs">
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
                        value={formData.packageName}
                        onChange={e => updateField('packageName', e.target.value)}
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                        placeholder="e.g., Full Day Coverage"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={formData.packagePrice}
                          onChange={e => updateField('packagePrice', e.target.value)}
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="5000"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Hours
                        </label>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={formData.packageHours}
                          onChange={e => updateField('packageHours', e.target.value)}
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="8"
                          min="1"
                          max="24"
                        />
                      </div>
                    </div>

                    {/* Retainer Fee */}
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Retainer Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 text-base">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.retainerFee}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                            updateField('retainerFee', value)
                          }}
                          className="w-full h-12 pl-8 pr-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 transition-shadow"
                          placeholder="1000"
                          maxLength={5}
                        />
                      </div>
                      <p className="text-xs text-stone-400 mt-2">Deposit to secure the date</p>
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
                            if (formData.packageName) {
                              lines.push(`📦 ${formData.packageName.toUpperCase()}`)
                              lines.push('')
                            }
                            if (formData.packageHours) {
                              lines.push(`Coverage: ${formData.packageHours} hours`)
                            }
                            if (formData.packagePrice) {
                              const price = parseFloat(formData.packagePrice)
                              lines.push(`Investment: $${price.toLocaleString()}`)
                            }
                            if (formData.retainerFee || formData.packagePrice) {
                              lines.push('')
                              lines.push('— Payment Schedule —')
                              if (formData.retainerFee) {
                                const retainer = parseFloat(formData.retainerFee)
                                lines.push(`Retainer: $${retainer.toLocaleString()} (due upon signing)`)
                              }
                              if (formData.packagePrice) {
                                const price = parseFloat(formData.packagePrice)
                                const retainer = formData.retainerFee ? parseFloat(formData.retainerFee) : 0
                                const remaining = price - retainer
                                lines.push(`Balance: $${remaining.toLocaleString()} (due 14 days before event)`)
                              }
                            }
                            updateField('notes', lines.join('\n'))
                          }}
                          className="h-9 inline-flex items-center gap-1.5 px-3 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 active:bg-amber-200 rounded-lg transition-colors"
                        >
                          <Wand2 className="w-4 h-4" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 resize-none transition-shadow"
                        placeholder="Package summary, payment terms, special requests..."
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

            {/* Footer - Sticky with large touch targets and safe area */}
            <div className="flex-shrink-0 px-5 pt-4 pb-6 border-t border-stone-100 bg-white" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <div className="flex items-center justify-between gap-4">
                {/* Cancel / Back button */}
                <button
                  onClick={currentStepIndex > 0 ? goPrev : onClose}
                  className="h-14 min-w-[100px] px-6 text-base font-medium text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-xl transition-colors"
                >
                  {currentStepIndex > 0 ? 'Back' : 'Cancel'}
                </button>

                {/* Next / Save button */}
                {currentStepIndex < STEPS.length - 1 ? (
                  <button
                    onClick={goNext}
                    disabled={!canProceed()}
                    className="h-14 min-w-[120px] px-8 inline-flex items-center justify-center gap-2 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !canProceed()}
                    className="h-14 min-w-[120px] px-8 inline-flex items-center justify-center gap-2 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50"
                  >
                    {isPending && <Loader2 className="w-5 h-5 animate-spin" />}
                    Save
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
