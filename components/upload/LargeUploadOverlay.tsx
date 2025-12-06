'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Coffee, Image, Sparkles, CheckCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { COFFEE_BREAK_THRESHOLD } from '@/lib/utils/constants'

interface LargeUploadOverlayProps {
  isVisible: boolean
  totalFiles: number
  completedFiles: number
  totalProgress: number
  estimatedMinutes: number
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
}: LargeUploadOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0)
  const isCoffeeBreak = totalFiles >= COFFEE_BREAK_THRESHOLD
  
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
              
              {/* Sparkle decorations */}
              <motion.div
                className="absolute -top-2 -right-2"
                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Sparkles className="w-5 h-5 text-amber-400" />
              </motion.div>
              <motion.div
                className="absolute -bottom-1 -left-3"
                animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
              >
                <Sparkles className="w-4 h-4 text-blue-400" />
              </motion.div>
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

            {/* Rotating message */}
            <AnimatePresence mode="wait">
              <motion.p
                key={messageIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="text-gray-600 font-medium"
              >
                {currentMessage}
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
                <p className="text-xs text-gray-500">
                  💡 <span className="font-medium">Pro tip:</span> You can close this tab and come back later. 
                  Uploads continue in the background.
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
