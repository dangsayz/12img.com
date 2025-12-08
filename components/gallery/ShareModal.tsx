'use client'

import { useState, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Send, 
  Smartphone, 
  Loader2, 
  Check, 
  User,
  SendHorizonal,
  Layers,
  LayoutGrid,
  Film,
  BookOpen
} from 'lucide-react'
import { sendGalleryToClient } from '@/server/actions/gallery.actions'
import { type GalleryTemplate, GALLERY_TEMPLATES } from './templates'

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  galleryId: string
  gallerySlug: string
  galleryTitle: string
  shareUrl: string
  currentTemplate?: GalleryTemplate
}

// Map template to the correct view URL path (using slug for clean URLs)
function getTemplateUrl(gallerySlug: string, template: GalleryTemplate): string {
  switch (template) {
    case 'cinematic':
      return `/view-reel/${gallerySlug}`
    case 'editorial':
      return `/view-live/${gallerySlug}`
    case 'mosaic':
    case 'clean-grid':
    default:
      return `/view-reel/${gallerySlug}`
  }
}

const templateIcons: Record<GalleryTemplate, React.ReactNode> = {
  'mosaic': <Layers className="w-4 h-4" />,
  'clean-grid': <LayoutGrid className="w-4 h-4" />,
  'cinematic': <Film className="w-4 h-4" />,
  'editorial': <BookOpen className="w-4 h-4" />,
}

interface SavedContact {
  email: string
  name?: string
  lastUsed: number
}

const CONTACTS_STORAGE_KEY = '12img_saved_contacts'

function getSavedContacts(): SavedContact[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(CONTACTS_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveContact(email: string, name?: string) {
  const contacts = getSavedContacts()
  const existing = contacts.findIndex(c => c.email.toLowerCase() === email.toLowerCase())
  
  if (existing >= 0) {
    contacts[existing].lastUsed = Date.now()
    if (name) contacts[existing].name = name
  } else {
    contacts.unshift({ email, name, lastUsed: Date.now() })
  }
  
  // Keep only last 10 contacts
  const trimmed = contacts.slice(0, 10)
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(trimmed))
}

function removeContact(email: string) {
  const contacts = getSavedContacts()
  const filtered = contacts.filter(c => c.email.toLowerCase() !== email.toLowerCase())
  localStorage.setItem(CONTACTS_STORAGE_KEY, JSON.stringify(filtered))
}

// Generate a professional default message for the client
function getDefaultMessage(galleryTitle: string): string {
  return `Hi there! 🎉

Your photos from "${galleryTitle}" are ready to view!

I've put together a beautiful gallery for you to browse, share with family and friends, and download your favorites.

Take your time looking through them — I hope they bring back wonderful memories!`
}

export function ShareModal({ isOpen, onClose, galleryId, gallerySlug, galleryTitle, shareUrl, currentTemplate = 'mosaic' }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [savedContacts, setSavedContacts] = useState<SavedContact[]>([])
  const [isPending, startTransition] = useTransition()
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<GalleryTemplate>(currentTemplate)

  // Load saved contacts on mount
  useEffect(() => {
    setSavedContacts(getSavedContacts())
  }, [isOpen])

  // Reset state when modal opens and set default message
  useEffect(() => {
    if (isOpen) {
      setStatus('idle')
      setErrorMessage('')
      setSelectedTemplate(currentTemplate)
      // Pre-fill with a professional default message
      setMessage(getDefaultMessage(galleryTitle))
    }
  }, [isOpen, currentTemplate, galleryTitle])

  const handleSendEmail = () => {
    if (!email.trim()) return

    setStatus('idle')
    setErrorMessage('')

    startTransition(async () => {
      const result = await sendGalleryToClient(
        galleryId,
        email.trim(),
        message.trim() || undefined,
        undefined, // password
        selectedTemplate // template
      )

      if (result.error) {
        setStatus('error')
        setErrorMessage(result.error)
      } else {
        setStatus('success')
        saveContact(email.trim())
        setSavedContacts(getSavedContacts())
        
        // Reset form after success
        setTimeout(() => {
          setEmail('')
          setMessage('')
          setStatus('idle')
        }, 2000)
      }
    })
  }

  const handleSendSMS = () => {
    if (!phone.trim()) return
    
    // Format phone number (basic cleanup)
    const cleanPhone = phone.replace(/[^\d+]/g, '')
    const templateUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}${getTemplateUrl(gallerySlug, selectedTemplate)}`
      : shareUrl
    const smsBody = message.trim() 
      ? `${message}\n\n${galleryTitle}: ${templateUrl}`
      : `${galleryTitle}: ${templateUrl}`
    
    window.open(`sms:${cleanPhone}?body=${encodeURIComponent(smsBody)}`)
    setStatus('success')
    
    setTimeout(() => {
      setPhone('')
      setMessage('')
      setStatus('idle')
    }, 1500)
  }

  const handleSelectContact = (contact: SavedContact) => {
    setEmail(contact.email)
  }

  const handleRemoveContact = (e: React.MouseEvent, contactEmail: string) => {
    e.stopPropagation()
    removeContact(contactEmail)
    setSavedContacts(getSavedContacts())
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-stone-100 flex-shrink-0">
            <h2 className="text-base font-semibold text-stone-900">Share Gallery</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-stone-100 flex-shrink-0">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <SendHorizonal className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setActiveTab('sms')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                activeTab === 'sms'
                  ? 'text-stone-900 border-b-2 border-stone-900'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Text Message
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1">
            {activeTab === 'email' ? (
              <div className="space-y-3">
                {/* Saved Contacts */}
                {savedContacts.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                      Recent Contacts
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {savedContacts.slice(0, 5).map((contact) => (
                        <div
                          key={contact.email}
                          className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all cursor-pointer ${
                            email === contact.email
                              ? 'bg-stone-900 text-white'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <span 
                            onClick={() => handleSelectContact(contact)}
                            className="flex items-center gap-1.5"
                          >
                            <User className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">{contact.email}</span>
                          </span>
                          <button
                            onClick={(e) => handleRemoveContact(e, contact.email)}
                            className={`ml-1 p-0.5 rounded-full transition-colors ${
                              email === contact.email
                                ? 'hover:bg-white/20'
                                : 'hover:bg-stone-300'
                            }`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="client@example.com"
                    className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Gallery View
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GALLERY_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedTemplate === template.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {templateIcons[template.id]}
                        <span>{template.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-stone-400">
                    Client will see the gallery in this view
                  </p>
                </div>

                {/* Personal Message */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Personal Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal note to your client..."
                    rows={5}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Status Messages */}
                {status === 'error' && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                {status === 'success' && (
                  <div className="p-2.5 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-600 flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Email sent successfully!
                  </div>
                )}

                {/* Send Button */}
                <button
                  onClick={handleSendEmail}
                  disabled={!email.trim() || isPending}
                  className="w-full h-11 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : status === 'success' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Email
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Phone Input */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full h-11 px-3 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all"
                  />
                </div>

                {/* Template Selector */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Gallery View
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {GALLERY_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setSelectedTemplate(template.id)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedTemplate === template.id
                            ? 'border-stone-900 bg-stone-900 text-white'
                            : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {templateIcons[template.id]}
                        <span>{template.name}</span>
                      </button>
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-stone-400">
                    Client will see the gallery in this view
                  </p>
                </div>

                {/* Personal Message */}
                <div>
                  <label className="block text-xs font-medium text-stone-500 uppercase tracking-wider mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Add a personal note..."
                    rows={2}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent transition-all resize-none"
                  />
                </div>

                {/* Info Note */}
                <p className="text-xs text-stone-400">
                  Opens your messaging app with the link pre-filled.
                </p>

                {/* Send Button */}
                <button
                  onClick={handleSendSMS}
                  disabled={!phone.trim()}
                  className="w-full h-11 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  {status === 'success' ? (
                    <>
                      <Check className="w-4 h-4" />
                      Opening Messages...
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-4 h-4" />
                      Send Text
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
