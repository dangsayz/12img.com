'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Check, Loader2, X, Calendar, Mail, User, MessageSquare } from 'lucide-react'
import { submitContactInquiry } from '@/server/actions/inquiry.actions'

interface ContactFormProps {
  photographerId: string
  photographerName: string
  onClose?: () => void
  variant?: 'modal' | 'inline'
}

const EVENT_TYPES = [
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'portrait', label: 'Portrait' },
  { value: 'family', label: 'Family' },
  { value: 'event', label: 'Event' },
  { value: 'corporate', label: 'Corporate' },
  { value: 'other', label: 'Other' },
]

export function ContactForm({ photographerId, photographerName, onClose, variant = 'modal' }: ContactFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [eventType, setEventType] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Anti-spam: honeypot field (hidden, bots fill it) + form load timestamp
  const [honeypot, setHoneypot] = useState('')
  const [formLoadedAt] = useState(() => Date.now())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const result = await submitContactInquiry({
      photographerId,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || undefined,
      message: message.trim(),
      eventType: eventType || undefined,
      eventDate: eventDate || undefined,
      // Anti-spam fields
      honeypot,
      formLoadedAt,
    })

    setIsSubmitting(false)

    if (result.success) {
      setIsSuccess(true)
    } else {
      setError(result.error || 'Failed to send message')
    }
  }

  const formContent = (
    <AnimatePresence mode="wait">
      {isSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="text-center py-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-8 h-8 text-emerald-600" />
          </motion.div>
          <h3 className="text-xl font-medium text-stone-900 mb-2">Message Sent!</h3>
          <p className="text-stone-500 mb-2">
            {photographerName} will get back to you soon.
          </p>
          <p className="text-xs text-stone-400 mb-8">
            We'll reply to <span className="font-medium text-stone-500">{email}</span>
          </p>
          {onClose && (
            <button
              onClick={onClose}
              className="px-6 py-3 min-h-[44px] bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 active:bg-stone-700 transition-colors"
            >
              Done
            </button>
          )}
        </motion.div>
      ) : (
        <motion.form
          key="form"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          {/* Honeypot field - hidden from users, bots will fill it */}
          <input
            type="text"
            name="website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            className="absolute -left-[9999px] opacity-0 h-0 w-0 pointer-events-none"
          />
          
          {/* Name & Email Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Your name"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Event Type & Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all appearance-none cursor-pointer"
              >
                <option value="">Select type...</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                Event Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
              Message *
            </label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-stone-400" />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                minLength={10}
                rows={4}
                placeholder={`Tell ${photographerName.split(' ')[0]} about your project...`}
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900/10 focus:border-stone-400 transition-all resize-none"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600"
            >
              {error}
            </motion.div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 min-h-[48px] bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 active:bg-stone-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>

          <p className="text-xs text-stone-400 text-center">
            Your information will only be shared with {photographerName.split(' ')[0]}.
          </p>
        </motion.form>
      )}
    </AnimatePresence>
  )

  if (variant === 'inline') {
    return formContent
  }

  const modalContent = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="contact-form-title"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 id="contact-form-title" className="text-lg font-medium text-stone-900">Contact {photographerName}</h2>
              <p className="text-sm text-stone-500 mt-0.5">Send a message to get started</p>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                aria-label="Close contact form"
                className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-stone-100 active:bg-stone-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto flex-1">
          {formContent}
        </div>
      </motion.div>
    </motion.div>
  )

  // Use portal to render modal at document body level
  if (typeof window === 'undefined') return null
  return createPortal(modalContent, document.body)
}

export function ContactButton({ 
  photographerId, 
  photographerName,
  className = ''
}: { 
  photographerId: string
  photographerName: string
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        aria-label={`Contact ${photographerName}`}
        className={`inline-flex items-center gap-2 px-5 py-3 min-h-[44px] bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 active:bg-stone-700 transition-colors ${className}`}
      >
        <MessageSquare className="w-4 h-4" />
        Contact
      </button>

      <AnimatePresence>
        {isOpen && (
          <ContactForm
            photographerId={photographerId}
            photographerName={photographerName}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
