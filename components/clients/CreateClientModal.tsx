'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wand2, ChevronLeft, ChevronRight, Users, Mail, Calendar, MapPin, Package } from 'lucide-react'
import { createClientProfile, getClientLocationSuggestions } from '@/server/actions/client.actions'
import { type EventType } from '@/types/database'
import { EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
}

type Step = 'names' | 'contact' | 'event' | 'location' | 'package'

const STEPS: { key: Step; label: string; icon: typeof Users }[] = [
  { key: 'names', label: 'Names', icon: Users },
  { key: 'contact', label: 'Contact', icon: Mail },
  { key: 'event', label: 'Event', icon: Calendar },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'package', label: 'Package', icon: Package },
]

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
  const [step, setStep] = useState<Step>('names')
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
      eventTime: '',
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
        eventTime: formData.eventTime || null,
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
      eventTime: '',
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
    setStep('names')
    setError(null)
    // Clear saved draft
    localStorage.removeItem('create-client-draft')
  }

  const canProceed = () => {
    if (step === 'names') {
      return formData.firstName && formData.lastName
    }
    if (step === 'contact') {
      return formData.email
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
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3 border-b border-stone-100 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">New Client</h2>
                <p className="text-sm text-stone-500">{STEPS[currentStepIndex]?.label}</p>
              </div>
              <button
                onClick={handleClose}
                className="p-3 -mr-2 hover:bg-stone-100 rounded-full transition-colors active:bg-stone-200"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-stone-500" />
              </button>
            </div>

            {/* Step Indicators */}
            <div className="flex gap-1.5 px-5 pt-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon
                const isCompleted = i < currentStepIndex
                const isCurrent = i === currentStepIndex
                const canNavigate = i <= currentStepIndex
                
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => canNavigate && setStep(s.key)}
                    disabled={!canNavigate}
                    className={`flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition-all ${
                      isCurrent
                        ? 'bg-stone-900 text-white'
                        : isCompleted
                        ? 'bg-stone-100 text-stone-600'
                        : 'bg-white text-stone-400 border border-stone-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden xs:inline">{s.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Content - No scroll needed with fewer fields per step */}
            <div className="flex-1 px-5 py-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Names */}
                {step === 'names' && (
                  <motion.div
                    key="names"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                        Client
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={e => updateField('firstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="First name *"
                          maxLength={50}
                          autoComplete="given-name"
                        />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={e => updateField('lastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="Last name *"
                          maxLength={50}
                          autoComplete="family-name"
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-3">
                        Partner <span className="text-stone-300 font-normal">(optional)</span>
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={formData.partnerFirstName}
                          onChange={e => updateField('partnerFirstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="First name"
                          maxLength={50}
                          autoComplete="off"
                        />
                        <input
                          type="text"
                          value={formData.partnerLastName}
                          onChange={e => updateField('partnerLastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="Last name"
                          maxLength={50}
                          autoComplete="off"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Contact */}
                {step === 'contact' && (
                  <motion.div
                    key="contact"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder="jane@example.com"
                        autoComplete="email"
                        inputMode="email"
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder="000-000-0000"
                        maxLength={12}
                        autoComplete="tel"
                        inputMode="tel"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Event */}
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
                            className={`h-10 px-2 text-sm font-medium rounded-lg border transition-all active:scale-[0.98] ${
                              formData.eventType === type
                                ? 'border-stone-900 bg-stone-900 text-white'
                                : 'border-stone-200 hover:border-stone-300'
                            }`}
                          >
                            {EVENT_TYPE_LABELS[type]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Date
                        </label>
                        <input
                          type="date"
                          value={formData.eventDate}
                          onChange={e => updateField('eventDate', e.target.value)}
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Arrival Time
                        </label>
                        <input
                          type="time"
                          value={formData.eventTime}
                          onChange={e => updateField('eventTime', e.target.value)}
                          className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 4: Location */}
                {step === 'location' && (
                  <motion.div
                    key="location"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder="Venue name"
                        maxLength={200}
                      />
                      {showVenueSuggestions && filteredVenues.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-32 overflow-y-auto">
                          {filteredVenues.slice(0, 4).map(venue => (
                            <button
                              key={venue}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventVenue', venue)
                                setShowVenueSuggestions(false)
                              }}
                              className="w-full h-10 px-4 text-left text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0"
                            >
                              {venue}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        City / Area
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder="Dallas, TX"
                        maxLength={200}
                      />
                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-xl shadow-lg max-h-32 overflow-y-auto">
                          {filteredLocations.slice(0, 4).map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventLocation', loc)
                                setShowLocationSuggestions(false)
                              }}
                              className="w-full h-10 px-4 text-left text-sm hover:bg-stone-50 border-b border-stone-100 last:border-0"
                            >
                              {loc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Step 5: Package */}
                {step === 'package' && (
                  <motion.div
                    key="package"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Package Name
                      </label>
                      <input
                        type="text"
                        value={formData.packageName}
                        onChange={e => updateField('packageName', e.target.value)}
                        className="w-full h-11 px-4 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder={`${EVENT_TYPE_LABELS[formData.eventType as EventType]} Photography`}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5">Price</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                          <input
                            type="text"
                            value={formData.packagePrice}
                            onChange={e => updateField('packagePrice', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className="w-full h-11 pl-7 pr-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            placeholder="3500"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5">Hours</label>
                        <input
                          type="text"
                          value={formData.packageHours}
                          onChange={e => updateField('packageHours', e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}
                          className="w-full h-11 px-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="8"
                          inputMode="numeric"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-500 mb-1.5">Deposit</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                          <input
                            type="text"
                            value={formData.retainerFee}
                            onChange={e => updateField('retainerFee', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            className="w-full h-11 pl-7 pr-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            placeholder="1000"
                            inputMode="numeric"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-stone-700">Notes</label>
                        <button
                          type="button"
                          onClick={() => {
                            const lines: string[] = []
                            const clientName = formData.partnerFirstName
                              ? `${formData.firstName} ${formData.lastName} & ${formData.partnerFirstName} ${formData.partnerLastName || formData.lastName}`
                              : `${formData.firstName} ${formData.lastName}`
                            lines.push(`CLIENT: ${clientName}`)
                            if (formData.email) lines.push(`Email: ${formData.email}`)
                            if (formData.phone) lines.push(`Phone: ${formData.phone}`)
                            lines.push('')
                            lines.push(`EVENT: ${EVENT_TYPE_LABELS[formData.eventType as EventType]}`)
                            if (formData.eventDate) {
                              const date = new Date(formData.eventDate + 'T00:00:00')
                              lines.push(`Date: ${date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`)
                            }
                            if (formData.eventTime) {
                              const [hours, minutes] = formData.eventTime.split(':').map(Number)
                              const period = hours >= 12 ? 'PM' : 'AM'
                              const displayHours = hours % 12 || 12
                              lines.push(`Arrival: ${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`)
                            }
                            if (formData.eventVenue) lines.push(`Venue: ${formData.eventVenue}`)
                            if (formData.eventLocation) lines.push(`Location: ${formData.eventLocation}`)
                            if (formData.packageName || formData.packagePrice) {
                              lines.push('')
                              if (formData.packageName) lines.push(`PACKAGE: ${formData.packageName}`)
                              if (formData.packageHours) lines.push(`Coverage: ${formData.packageHours} hours`)
                              if (formData.packagePrice) lines.push(`Investment: $${parseFloat(formData.packagePrice).toLocaleString()}`)
                              if (formData.retainerFee) lines.push(`Deposit: $${parseFloat(formData.retainerFee).toLocaleString()}`)
                            }
                            updateField('notes', lines.join('\n'))
                          }}
                          className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-stone-100 active:bg-stone-200 transition-colors"
                          title="Generate summary"
                        >
                          <Wand2 className="w-4 h-4 text-stone-500" />
                        </button>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 resize-none font-mono"
                        placeholder="Click the wand icon to generate a summary..."
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

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 pb-[max(5rem,calc(env(safe-area-inset-bottom)+4rem))] sm:pb-4 border-t border-stone-100 bg-white sticky bottom-0">
              <button
                onClick={() => {
                  if (currentStepIndex > 0) goPrev()
                  else handleClose()
                }}
                className="px-5 py-3 text-base font-medium text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-xl transition-colors"
              >
                {currentStepIndex === 0 ? 'Cancel' : 'Back'}
              </button>

              {step !== 'package' ? (
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-2 px-6 py-3 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50"
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
