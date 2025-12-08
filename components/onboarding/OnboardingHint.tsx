'use client'

import React, { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { HintStep, OnboardingSection, hasCompletedOnboarding, markOnboardingComplete } from '@/lib/onboarding/types'
import { getOnboardingFlow } from '@/lib/onboarding/flows'

interface OnboardingHintProps {
  section: OnboardingSection
  onComplete?: () => void
  delay?: number // Delay before showing (ms)
}

interface TooltipPosition {
  top?: number
  bottom?: number
  left?: number
  right?: number
  arrowPosition: 'top' | 'bottom' | 'left' | 'right'
}

export function OnboardingHint({ section, onComplete, delay = 500 }: OnboardingHintProps) {
  const [isActive, setIsActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition | null>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)

  const flow = getOnboardingFlow(section)
  const steps = flow?.steps || []
  const step = steps[currentStep]

  // Check if onboarding should show
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompletedOnboarding(section) && steps.length > 0) {
        setIsActive(true)
      }
    }, delay)

    return () => clearTimeout(timer)
  }, [section, steps.length, delay])

  // Find and highlight target element
  useEffect(() => {
    if (!isActive || !step) return

    const findTarget = () => {
      const target = document.querySelector(step.targetSelector)
      if (target) {
        const rect = target.getBoundingClientRect()
        setTargetRect(rect)
        
        // Calculate tooltip position
        const padding = 16
        const tooltipWidth = 320
        const tooltipHeight = 180 // Approximate
        
        let position: TooltipPosition = { arrowPosition: 'top' }
        
        switch (step.position) {
          case 'bottom':
            position = {
              top: rect.bottom + padding,
              left: Math.max(padding, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                window.innerWidth - tooltipWidth - padding
              )),
              arrowPosition: 'top'
            }
            break
          case 'top':
            position = {
              bottom: window.innerHeight - rect.top + padding,
              left: Math.max(padding, Math.min(
                rect.left + rect.width / 2 - tooltipWidth / 2,
                window.innerWidth - tooltipWidth - padding
              )),
              arrowPosition: 'bottom'
            }
            break
          case 'left':
            position = {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              right: window.innerWidth - rect.left + padding,
              arrowPosition: 'right'
            }
            break
          case 'right':
            position = {
              top: rect.top + rect.height / 2 - tooltipHeight / 2,
              left: rect.right + padding,
              arrowPosition: 'left'
            }
            break
          case 'center':
            position = {
              top: window.innerHeight / 2 - tooltipHeight / 2,
              left: window.innerWidth / 2 - tooltipWidth / 2,
              arrowPosition: 'top'
            }
            break
        }
        
        setTooltipPosition(position)
      }
    }

    // Initial find
    findTarget()
    
    // Re-find on resize/scroll
    window.addEventListener('resize', findTarget)
    window.addEventListener('scroll', findTarget, true)
    
    return () => {
      window.removeEventListener('resize', findTarget)
      window.removeEventListener('scroll', findTarget, true)
    }
  }, [isActive, step, currentStep])

  // Keyboard navigation
  useEffect(() => {
    if (!isActive) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDismiss()
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isActive, currentStep, steps.length])

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      handleComplete()
    }
  }, [currentStep, steps.length])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleDismiss = useCallback(() => {
    setIsActive(false)
    markOnboardingComplete(section)
    onComplete?.()
  }, [section, onComplete])

  const handleComplete = useCallback(() => {
    setIsActive(false)
    markOnboardingComplete(section)
    onComplete?.()
  }, [section, onComplete])

  if (!isActive || !step || !targetRect || !tooltipPosition) return null

  return (
    <AnimatePresence>
      {isActive && (
        <>
          {/* Subtle backdrop - just a light overlay, no harsh spotlight */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
            onClick={handleDismiss}
          />

          {/* Minimal tooltip - no zoom, effortless feel */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed z-[9999] w-72"
            style={{
              top: tooltipPosition.top,
              bottom: tooltipPosition.bottom,
              left: tooltipPosition.left,
              right: tooltipPosition.right,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Arrow */}
            <div
              className={`absolute w-2.5 h-2.5 bg-white rotate-45 shadow-sm ${
                tooltipPosition.arrowPosition === 'top' ? '-top-1 left-1/2 -translate-x-1/2' :
                tooltipPosition.arrowPosition === 'bottom' ? '-bottom-1 left-1/2 -translate-x-1/2' :
                tooltipPosition.arrowPosition === 'left' ? '-left-1 top-1/2 -translate-y-1/2' :
                '-right-1 top-1/2 -translate-y-1/2'
              }`}
            />
            
            {/* Content - clean, minimal card */}
            <div className="bg-white rounded-xl shadow-lg border border-stone-200/60 overflow-hidden">
              {/* Header - simple, no flashy icon */}
              <div className="px-4 pt-4 pb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-stone-900 text-sm">{step.title}</h3>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {currentStep + 1} of {steps.length}
                  </p>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 rounded-full hover:bg-stone-100 transition-colors text-stone-400 hover:text-stone-600 -mr-1 -mt-1"
                  aria-label="Close"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Body */}
              <div className="px-4 pb-3">
                <p className="text-sm text-stone-500 leading-relaxed">
                  {step.description}
                </p>
              </div>

              {/* Footer - minimal */}
              <div className="px-4 pb-4 flex items-center justify-between">
                {/* Progress dots */}
                <div className="flex items-center gap-1">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 rounded-full transition-all ${
                        idx === currentStep 
                          ? 'bg-stone-900 w-3' 
                          : 'bg-stone-200 w-1'
                      }`}
                    />
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-1.5">
                  {currentStep > 0 && (
                    <button
                      onClick={handlePrev}
                      className="p-1.5 rounded-full hover:bg-stone-100 transition-colors text-stone-400"
                      aria-label="Previous"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-full hover:bg-stone-800 transition-colors"
                  >
                    {currentStep === steps.length - 1 ? 'Done' : 'Next'}
                    {currentStep < steps.length - 1 && <ChevronRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Skip hint - very subtle */}
              <div className="px-4 pb-3 pt-0 border-t border-stone-100">
                <p className="text-[9px] text-stone-400 text-center pt-2">
                  <kbd className="px-1 py-0.5 bg-stone-50 rounded text-stone-400 font-mono text-[8px]">ESC</kbd> to skip
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
