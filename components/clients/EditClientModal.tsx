'use client'

import { useState, useTransition, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Wand2 } from 'lucide-react'
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

  const handleClose = () => {
    onClose()
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
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm sm:max-w-md max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <div>
                <h2 className="text-base font-medium text-stone-900">Edit Client</h2>
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
                <button
                  key={s}
                  onClick={() => setStep(s)}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    i <= ['client', 'event', 'package'].indexOf(step)
                      ? 'bg-stone-900'
                      : 'bg-stone-200 hover:bg-stone-300'
                  }`}
                />
              ))}
            </div>

            {/* Content */}
            <div className="px-4 py-4 overflow-y-auto max-h-[55vh]">
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
                          Price ($)
                        </label>
                        <input
                          type="number"
                          value={formData.packagePrice}
                          onChange={e => updateField('packagePrice', e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="5000"
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

                    {/* Retainer Fee - beautifully displayed */}
                    <div className="relative">
                      <label className="block text-xs font-medium text-stone-600 mb-1">
                        Retainer Fee
                      </label>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-sm">$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={formData.retainerFee}
                          onChange={e => {
                            // Only allow digits, max 5 digits
                            const value = e.target.value.replace(/\D/g, '').slice(0, 5)
                            updateField('retainerFee', value)
                          }}
                          className="w-full pl-6 pr-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400"
                          placeholder="1000"
                          maxLength={5}
                        />
                      </div>
                      <p className="text-[10px] text-stone-400 mt-1">Deposit to secure the date (max $99,999)</p>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-xs font-medium text-stone-600">
                          Notes
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            // Generate world-class professional note
                            const lines: string[] = []
                            
                            // Package header
                            if (formData.packageName) {
                              lines.push(`📦 ${formData.packageName.toUpperCase()}`)
                              lines.push('')
                            }
                            
                            // Coverage details
                            if (formData.packageHours) {
                              lines.push(`Coverage: ${formData.packageHours} hours`)
                            }
                            
                            // Investment breakdown
                            if (formData.packagePrice) {
                              const price = parseFloat(formData.packagePrice)
                              lines.push(`Investment: $${price.toLocaleString()}`)
                            }
                            
                            // Payment terms
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-full transition-colors"
                        >
                          <Wand2 className="w-3 h-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        value={formData.notes}
                        onChange={e => updateField('notes', e.target.value)}
                        rows={3}
                        className="w-full px-2.5 py-1.5 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 resize-none"
                        placeholder="Package summary, payment terms, special requests..."
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
                onClick={handleClose}
                className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {step !== 'package' && (
                  <button
                    onClick={() => {
                      if (step === 'client') setStep('event')
                      else if (step === 'event') setStep('package')
                    }}
                    disabled={!canProceed()}
                    className="px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={isPending || !canProceed()}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
