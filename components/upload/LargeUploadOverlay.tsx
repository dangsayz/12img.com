'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Image, CheckCircle, X } from 'lucide-react'
import { useEffect, useState, useCallback } from 'react'
import { COFFEE_BREAK_THRESHOLD } from '@/lib/utils/constants'

interface LargeUploadOverlayProps {
  isVisible: boolean
  totalFiles: number
  completedFiles: number
  totalProgress: number
  estimatedMinutes: number
  phaseMessage?: string
  onMinimize?: () => void
}

const ENCOURAGING_MESSAGES = [
  "We're uploading your beautiful work...",
  "Processing your masterpieces...",
  "Almost there, hang tight...",
  "Your photos are on their way...",
  "Making magic happen...",
]

const COFFEE_MESSAGES = [
  "Perfect time for a coffee break ☕",
  "Go stretch your legs, we've got this",
  "Take a breather, you've earned it",
  "This is a great time to check your emails",
  "Your photos are in good hands",
]

export function LargeUploadOverlay({
  isVisible,
  totalFiles,
  completedFiles,
  totalProgress,
  estimatedMinutes,
  phaseMessage,
  onMinimize,
}: LargeUploadOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const isCoffeeBreak = totalFiles >= COFFEE_BREAK_THRESHOLD
  
  // Handle ESC key to minimize overlay
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && onMinimize) {
      onMinimize()
    }
  }, [onMinimize])
  
  useEffect(() => {
    if (!isVisible) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isVisible, handleKeyDown])
  
  // Rotate messages every 5 seconds
  useEffect(() => {
    if (!isVisible) return
    const messages = isCoffeeBreak ? COFFEE_MESSAGES : ENCOURAGING_MESSAGES
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isVisible, isCoffeeBreak])

  const messages = isCoffeeBreak ? COFFEE_MESSAGES : ENCOURAGING_MESSAGES
  const currentMessage = messages[messageIndex]

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-white/98 backdrop-blur-xl flex items-center justify-center"
        >
          {/* Close button */}
          {onMinimize && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onMinimize}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors group"
              title="Minimize (ESC)"
            >
              <X className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </motion.button>
          )}
          
          <div className="max-w-md w-full mx-4 text-center">
            {/* Animated Icon */}
            <motion.div
              className="relative mx-auto mb-8"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              {isCoffeeBreak ? (
                <motion.div
                  animate={{ 
                    y: [0, -8, 0],
                    rotate: [0, -5, 5, 0]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut'
                  }}
                  className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mx-auto"
                >
                  <Coffee className="w-10 h-10 text-amber-600" />
                </motion.div>
              ) : (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center mx-auto"
                >
                  <Image className="w-10 h-10 text-gray-600" />
                </motion.div>
              )}
              
              {/* Minimal dot decorations */}
              <motion.div
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400"
                animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="absolute -bottom-0.5 -left-2 w-2 h-2 rounded-full bg-gray-300"
                animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              />
            </motion.div>

            {/* File counter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 text-gray-900">
                <span className="text-4xl font-bold tabular-nums">{completedFiles}</span>
                <span className="text-2xl text-gray-300">/</span>
                <span className="text-2xl text-gray-500 tabular-nums">{totalFiles}</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">images uploaded</p>
            </motion.div>

            {/* Progress bar */}
            <div className="mb-8 px-4">
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-gray-800 to-gray-600 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${totalProgress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
              
              {/* Time estimate */}
              {estimatedMinutes > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-gray-400 mt-3"
                >
                  {estimatedMinutes < 1 
                    ? 'Less than a minute remaining'
                    : estimatedMinutes === 1
                    ? 'About 1 minute remaining'
                    : `About ${estimatedMinutes} minutes remaining`
                  }
                </motion.p>
              )}
            </div>

            {/* Phase-aware status message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={phaseMessage || messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-gray-600 font-medium"
              >
                {phaseMessage || currentMessage}
              </motion.p>
            </AnimatePresence>

            {/* Pro tip for large uploads */}
            {isCoffeeBreak && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1 }}
                className="mt-8 p-4 bg-gray-50 rounded-xl"
              >
                <p className="text-xs text-gray-500 flex items-start gap-2">
                  <svg 
                    className="w-4 h-4 text-amber-500 flex-shrink-0 mt-px" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                  >
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                    <path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2Z" />
                  </svg>
                  <span>
                    <span className="font-medium text-gray-600">Pro tip:</span> You can close this tab and come back later. 
                    Uploads continue in the background.
                  </span>
                </p>
              </motion.div>
            )}

            {/* Completion state */}
            {totalProgress >= 100 && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="mt-8"
              >
                <div className="inline-flex items-center gap-2 text-green-600 font-medium">
                  <CheckCircle className="w-5 h-5" />
                  All done!
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
