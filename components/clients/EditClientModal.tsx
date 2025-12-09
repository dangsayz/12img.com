'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wand2, ChevronLeft, ChevronRight, User, Users, Mail, Calendar, MapPin, Package, Check } from 'lucide-react'
import { updateClientProfile, getClientLocationSuggestions } from '@/server/actions/client.actions'
import { type EventType } from '@/types/database'
import { type ClientProfile, EVENT_TYPE_LABELS } from '@/lib/contracts/types'

interface EditClientModalProps {
  isOpen: boolean
  onClose: () => void
  client: ClientProfile
}

type Step = 'names' | 'contact' | 'event' | 'location' | 'package'

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
  { key: 'names', label: 'Names', icon: Users },
  { key: 'contact', label: 'Contact', icon: Mail },
  { key: 'event', label: 'Event', icon: Calendar },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'package', label: 'Package', icon: Package },
]

export function EditClientModal({ isOpen, onClose, client }: EditClientModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>('names')
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
    eventTime: client.eventTime || '',
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
      eventTime: client.eventTime || '',
      eventLocation: client.eventLocation || '',
      eventVenue: client.eventVenue || '',
      packageName: client.packageName || '',
      packagePrice: client.packagePrice?.toString() || '',
      packageHours: client.packageHours?.toString() || '',
      retainerFee: client.retainerFee?.toString() || '',
      packageDescription: client.packageDescription || '',
      notes: client.notes || '',
    })
    setStep('names')
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
        eventTime: formData.eventTime || null,
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

      // Force a hard refresh to ensure all data is updated
      router.refresh()
      // Small delay to ensure revalidation completes
      setTimeout(() => {
        onClose()
      }, 100)
    })
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

            {/* Content - No scroll needed with fewer fields per step */}
            <div className="flex-1 px-5 py-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Names - Primary + Partner */}
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
                        />
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={e => updateField('lastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="Last name *"
                          maxLength={50}
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
                        />
                        <input
                          type="text"
                          value={formData.partnerLastName}
                          onChange={e => updateField('partnerLastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="Last name"
                          maxLength={50}
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Contact - Email + Phone */}
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
                      />
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Event - Type + Date/Time */}
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

                {/* Step 4: Location - Venue + City */}
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

                {/* Step 5: Package - Simplified */}
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
                        className="w-full h-12 px-4 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                        placeholder="e.g., Full Day Coverage"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Price
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={formData.packagePrice}
                            onChange={e => updateField('packagePrice', e.target.value)}
                            className="w-full h-12 pl-7 pr-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            placeholder="5000"
                            min="0"
                          />
                        </div>
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
                          className="w-full h-12 px-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                          placeholder="8"
                          min="1"
                          max="24"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-stone-700 mb-2">
                          Deposit
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={formData.retainerFee}
                            onChange={e => {
                              const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                              updateField('retainerFee', value)
                            }}
                            className="w-full h-12 pl-7 pr-3 text-base border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400"
                            placeholder="1000"
                            maxLength={5}
                          />
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
                            const clientName = formData.partnerFirstName
                              ? `${formData.firstName} ${formData.lastName} & ${formData.partnerFirstName} ${formData.partnerLastName || formData.lastName}`
                              : `${formData.firstName} ${formData.lastName}`
                            lines.push(`CLIENT: ${clientName}`)
                            if (formData.email) lines.push(`Email: ${formData.email}`)
                            if (formData.phone) lines.push(`Phone: ${formData.phone}`)
                            lines.push('')
                            lines.push(`EVENT: ${EVENT_TYPE_LABELS[formData.eventType]}`)
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
                        rows={3}
                        className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 resize-none"
                        placeholder="Special requests, notes..."
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
              <div className="flex items-center justify-between gap-3">
                {/* Back button */}
                <button
                  onClick={currentStepIndex > 0 ? goPrev : onClose}
                  className="h-12 px-4 text-sm font-medium text-stone-600 hover:text-stone-900 active:bg-stone-100 rounded-xl transition-colors"
                >
                  {currentStepIndex > 0 ? 'Back' : 'Cancel'}
                </button>

                <div className="flex items-center gap-2">
                  {/* Save button - always visible */}
                  <button
                    onClick={handleSubmit}
                    disabled={isPending || !formData.firstName || !formData.lastName || !formData.email}
                    className="h-12 px-5 inline-flex items-center justify-center gap-2 text-sm font-medium border border-stone-200 text-stone-700 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                    Save
                  </button>

                  {/* Next button - only show if not on last step */}
                  {currentStepIndex < STEPS.length - 1 && (
                    <button
                      onClick={goNext}
                      disabled={!canProceed()}
                      className="h-12 px-5 inline-flex items-center justify-center gap-2 text-sm font-medium bg-stone-900 text-white rounded-xl hover:bg-stone-800 active:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
