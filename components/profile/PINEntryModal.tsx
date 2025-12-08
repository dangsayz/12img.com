'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, Delete, Check } from 'lucide-react'
import { unlockGalleryWithPin } from '@/server/actions/profile.actions'

interface PINEntryModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  galleryId: string
  galleryTitle: string
}

export function PINEntryModal({
  isOpen,
  onClose,
  onSuccess,
  galleryId,
  galleryTitle,
}: PINEntryModalProps) {
  const [pin, setPin] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const maxLength = 6
  const minLength = 4

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setPin([])
      setError(null)
      setIsLoading(false)
      setShake(false)
    }
  }, [isOpen])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const handleKeyPress = useCallback((key: string) => {
    if (isLoading) return
    setError(null)

    if (key === 'delete') {
      setPin(prev => prev.slice(0, -1))
    } else if (key === 'submit') {
      handleSubmit()
    } else if (pin.length < maxLength) {
      setPin(prev => [...prev, key])
    }
  }, [pin.length, isLoading])

  // Handle keyboard input
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key)
      } else if (e.key === 'Backspace') {
        handleKeyPress('delete')
      } else if (e.key === 'Enter' && pin.length >= minLength) {
        handleKeyPress('submit')
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyPress, pin.length])

  const handleSubmit = async () => {
    if (pin.length < minLength) {
      setError(`PIN must be at least ${minLength} digits`)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await unlockGalleryWithPin(galleryId, pin.join(''))
      
      if (result.error) {
        setError(result.error)
        setShake(true)
        setTimeout(() => setShake(false), 500)
        setPin([])
      } else {
        onSuccess()
      }
    } catch {
      setError('An error occurred. Please try again.')
      setShake(true)
      setTimeout(() => setShake(false), 500)
      setPin([])
    } finally {
      setIsLoading(false)
    }
  }

  const numpadKeys = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'delete'],
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              animate={shake ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] pointer-events-auto overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-6 pb-4 text-center border-b border-stone-100">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-all"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-stone-100 flex items-center justify-center">
                  <Lock className="w-7 h-7 text-stone-600" />
                </div>
                
                <h2 className="text-lg font-semibold text-stone-900">
                  Enter PIN
                </h2>
                <p className="text-sm text-stone-500 mt-1 line-clamp-1">
                  {galleryTitle}
                </p>
              </div>

              {/* PIN Display */}
              <div className="px-6 py-6">
                <div className="flex justify-center gap-3 mb-6">
                  {Array.from({ length: maxLength }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={false}
                      animate={{
                        scale: pin[i] ? 1.1 : 1,
                        backgroundColor: pin[i] ? '#1c1917' : '#f5f5f4',
                      }}
                      transition={{ duration: 0.15 }}
                      className={`w-4 h-4 rounded-full ${
                        i < minLength ? '' : 'opacity-50'
                      }`}
                    />
                  ))}
                </div>

                {/* Error Message */}
                <AnimatePresence mode="wait">
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-center text-sm text-red-500 mb-4"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Numpad */}
                <div className="grid grid-cols-3 gap-3">
                  {numpadKeys.flat().map((key, i) => {
                    if (key === '') {
                      return <div key={i} />
                    }

                    if (key === 'delete') {
                      return (
                        <button
                          key={i}
                          onClick={() => handleKeyPress('delete')}
                          disabled={isLoading || pin.length === 0}
                          className="h-14 rounded-xl bg-stone-100 hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                        >
                          <Delete className="w-6 h-6 text-stone-600" />
                        </button>
                      )
                    }

                    return (
                      <button
                        key={i}
                        onClick={() => handleKeyPress(key)}
                        disabled={isLoading || pin.length >= maxLength}
                        className="h-14 rounded-xl bg-stone-50 hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xl font-medium text-stone-900 active:scale-95"
                      >
                        {key}
                      </button>
                    )
                  })}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={isLoading || pin.length < minLength}
                  className="w-full mt-6 h-12 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 disabled:cursor-not-allowed transition-colors text-white font-medium flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Unlock Gallery
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
