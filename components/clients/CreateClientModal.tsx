'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, User, Calendar, Package, FileText } from 'lucide-react'
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-medium text-stone-900">New Client</h2>
                <p className="text-xs text-stone-500">
                  {step === 'client' && 'Contact info'}
                  {step === 'event' && 'Event details'}
                  {step === 'package' && 'Package'}
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-stone-500" />
              </button>
            </div>

            {/* Progress */}
            <div className="flex gap-1 px-4 pt-3">
              {(['client', 'event', 'package'] as Step[]).map((s, i) => (
                <div
                  key={s}
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    i <= ['client', 'event', 'package'].indexOf(step)
                      ? 'bg-stone-900'
                      : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-4 py-4 overflow-y-auto flex-1 min-h-0">
              <AnimatePresence mode="wait">
                {step === 'client' && (
                  <motion.div
                    key="client"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-3"
                  >
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={e => updateField('firstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="Jane"
                          maxLength={50}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={e => updateField('lastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="Smith"
                          maxLength={50}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => updateField('email', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="jane@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={e => updateField('phone', formatPhoneNumber(e.target.value))}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="000-000-0000"
                        maxLength={12}
                      />
                    </div>

                    <div className="pt-3 border-t border-stone-100">
                      <p className="text-xs font-medium text-stone-600 mb-2">
                        Partner (optional)
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={formData.partnerFirstName}
                          onChange={e => updateField('partnerFirstName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="First name"
                          maxLength={50}
                        />
                        <input
                          type="text"
                          value={formData.partnerLastName}
                          onChange={e => updateField('partnerLastName', e.target.value.replace(/[^a-zA-ZÀ-ÿ\s'-]/g, ''))}
                          className="px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
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
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Event Type
                      </label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {EVENT_TYPES.map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => updateField('eventType', type)}
                            className={`px-2 py-1.5 text-xs rounded-lg border transition-colors ${
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

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Event Date
                      </label>
                      <input
                        type="date"
                        value={formData.eventDate}
                        onChange={e => updateField('eventDate', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-medium text-stone-600 mb-1">
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
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="City, State"
                        maxLength={200}
                      />
                      {/* Location Suggestions Dropdown */}
                      {showLocationSuggestions && filteredLocations.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                          {filteredLocations.map(loc => (
                            <button
                              key={loc}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventLocation', loc)
                                setShowLocationSuggestions(false)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                            >
                              <span className="w-4 h-4 rounded border border-stone-300 flex items-center justify-center text-emerald-600">
                                ✓
                              </span>
                              {loc}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <label className="block text-xs font-medium text-stone-600 mb-1">
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
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="Venue name"
                        maxLength={200}
                      />
                      {/* Venue Suggestions Dropdown */}
                      {showVenueSuggestions && filteredVenues.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-stone-200 rounded-lg shadow-lg max-h-32 overflow-y-auto">
                          {filteredVenues.map(venue => (
                            <button
                              key={venue}
                              type="button"
                              onMouseDown={() => {
                                updateField('eventVenue', venue)
                                setShowVenueSuggestions(false)
                              }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-stone-50 flex items-center gap-2"
                            >
                              <span className="w-4 h-4 rounded border border-stone-300 flex items-center justify-center text-emerald-600">
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
                    className="space-y-3"
                  >
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Package Name
                      </label>
                      <input
                        type="text"
                        value={formData.packageName}
                        onChange={e => updateField('packageName', e.target.value)}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                        placeholder="e.g., Full Day Coverage"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          Total Price ($)
                        </label>
                        <input
                          type="number"
                          value={formData.packagePrice}
                          onChange={e => updateField('packagePrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="3500"
                          min="0"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-stone-600 mb-1">
                          Hours
                        </label>
                        <input
                          type="number"
                          value={formData.packageHours}
                          onChange={e => updateField('packageHours', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="8"
                          min="1"
                          max="24"
                        />
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="pt-3 border-t border-stone-100">
                      <p className="text-xs font-medium text-stone-600 mb-2">
                        Payment Details
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">
                            Deposit/Retainer ($)
                          </label>
                          <input
                            type="number"
                            value={formData.retainerFee}
                            onChange={e => updateField('retainerFee', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                            placeholder="1000"
                            min="0"
                            max="99999"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-stone-600 mb-1">
                            Balance Due Date
                          </label>
                          <input
                            type="date"
                            value={formData.balanceDueDate}
                            onChange={e => updateField('balanceDueDate', e.target.value)}
                            className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Notes
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        rows={2}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 resize-none"
                        placeholder="Any additional notes..."
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {error && (
                <p className="mt-3 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-lg">
                  {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 bg-stone-50">
              <button
                onClick={() => {
                  if (step === 'event') setStep('client')
                  else if (step === 'package') setStep('event')
                  else handleClose()
                }}
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
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
                  className="px-4 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
