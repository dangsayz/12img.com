'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { SignIn, SignUp } from '@clerk/nextjs'
import Link from 'next/link'

type AuthMode = 'sign-in' | 'sign-up'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: AuthMode
  redirectUrl?: string
}

// Clerk appearance config - clean, minimal style matching reference designs
const clerkAppearance = {
  elements: {
    // Root & Card
    rootBox: 'w-full',
    cardBox: 'shadow-none w-full',
    card: 'shadow-none p-0 w-full bg-transparent border-0',
    
    // Hide headers
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',
    header: 'hidden',
    
    // Social buttons - clean pill style
    socialButtonsBlockButton: 'bg-white border border-stone-200 rounded-full hover:bg-stone-50 transition-all duration-200 py-3 shadow-none',
    socialButtonsBlockButtonText: 'text-stone-700 text-sm font-medium',
    socialButtonsBlockButtonArrow: 'hidden',
    socialButtonsProviderIcon: 'w-5 h-5',
    
    // Divider - subtle
    dividerLine: 'bg-stone-100',
    dividerText: 'text-stone-300 text-xs bg-white px-3',
    dividerRow: 'my-5',
    
    // Form fields - soft background style
    formFieldLabel: 'text-xs font-medium text-stone-500 uppercase tracking-wide',
    formFieldLabelRow: 'mb-2',
    formFieldInput: 'w-full px-4 py-3 bg-stone-50 border-0 rounded-xl text-stone-900 placeholder:text-stone-400 transition-all duration-200 focus:bg-stone-100 focus:ring-0 focus:outline-none text-sm shadow-none',
    formFieldInputShowPasswordButton: 'text-stone-400 hover:text-stone-600 transition-colors',
    formFieldRow: 'mb-4',
    formFieldErrorText: 'text-red-500 text-xs mt-2',
    formFieldHintText: 'hidden',
    formFieldSuccessText: 'text-emerald-500 text-xs mt-2',
    
    // Primary button - rounded pill
    formButtonPrimary: 'w-full h-12 rounded-full bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium uppercase tracking-wide transition-all duration-200 border-0 mt-4',
    buttonArrowIcon: 'text-white w-4 h-4 ml-2',
    
    // Form container
    form: 'space-y-0',
    main: 'gap-0',
    
    // Footer & misc - hide
    footer: 'hidden',
    footerAction: 'hidden',
    footerActionLink: 'hidden',
    footerActionText: 'hidden',
    
    // Identity preview
    identityPreview: 'bg-stone-50 rounded-xl p-4',
    identityPreviewText: 'text-stone-600 text-sm',
    identityPreviewEditButton: 'text-stone-400 hover:text-stone-600 text-xs',
    identityPreviewEditButtonIcon: 'w-3 h-3',
    
    // OTP
    otpCodeFieldInput: 'w-12 h-14 text-center text-xl font-medium bg-stone-50 border-0 rounded-xl focus:bg-stone-100 focus:ring-0 shadow-none',
    otpCodeField: 'gap-3',
    
    // Links
    formResendCodeLink: 'text-stone-500 hover:text-stone-900 font-medium text-sm transition-colors',
    alternativeMethodsBlockButton: 'text-stone-400 hover:text-stone-600 text-xs transition-colors',
    backLink: 'text-stone-400 hover:text-stone-600 text-xs transition-colors',
    
    // Alert
    alert: 'bg-red-50 rounded-xl p-4 text-red-600 text-sm',
    alertText: 'text-red-600',
  },
  layout: {
    socialButtonsPlacement: 'top' as const,
    showOptionalFields: false,
  },
}

export function AuthModal({ isOpen, onClose, initialMode = 'sign-in', redirectUrl }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode)

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

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

  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'sign-in' ? 'sign-up' : 'sign-in')
  }, [])

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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
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
            <div 
              className="relative bg-white rounded-3xl shadow-xl shadow-stone-900/10 w-full max-w-[380px] max-h-[85vh] overflow-y-auto pointer-events-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Custom CSS overrides for Clerk - Clean minimal style */}
              <style jsx global>{`
                /* Remove card backgrounds and shadows */
                .cl-card,
                .cl-cardBox {
                  background: transparent !important;
                  box-shadow: none !important;
                  border: none !important;
                }
                
                /* Input fields - soft background, no borders */
                .cl-formFieldInput {
                  background: #fafaf9 !important;
                  border: none !important;
                  border-radius: 12px !important;
                  padding: 14px 16px !important;
                  box-shadow: none !important;
                  font-size: 14px !important;
                  color: #1c1917 !important;
                }
                
                .cl-formFieldInput::placeholder {
                  color: #a8a29e !important;
                }
                
                .cl-formFieldInput:focus {
                  background: #f5f5f4 !important;
                  box-shadow: none !important;
                  outline: none !important;
                }
                
                /* Labels - clean uppercase */
                .cl-formFieldLabel {
                  font-size: 11px !important;
                  text-transform: uppercase !important;
                  letter-spacing: 0.1em !important;
                  color: #78716c !important;
                  font-weight: 500 !important;
                }
                
                /* Social buttons - pill style with border */
                .cl-socialButtonsBlockButton {
                  background: white !important;
                  border: 1px solid #e7e5e4 !important;
                  border-radius: 9999px !important;
                  box-shadow: none !important;
                  padding: 12px 16px !important;
                }
                
                .cl-socialButtonsBlockButton:hover {
                  background: #fafaf9 !important;
                  border-color: #d6d3d1 !important;
                }
                
                /* Primary button - rounded pill */
                .cl-formButtonPrimary {
                  width: 100% !important;
                  height: 48px !important;
                  min-height: 48px !important;
                  border-radius: 9999px !important;
                  background: #1c1917 !important;
                  padding: 0 24px !important;
                  font-size: 13px !important;
                  font-weight: 500 !important;
                  letter-spacing: 0.05em !important;
                  text-transform: uppercase !important;
                  color: white !important;
                  transition: all 0.2s ease !important;
                  margin-top: 16px !important;
                }
                
                .cl-formButtonPrimary:hover {
                  background: #292524 !important;
                }
                
                /* Divider - very subtle */
                .cl-dividerLine {
                  background: #f5f5f4 !important;
                }
                
                .cl-dividerText {
                  font-size: 11px !important;
                  color: #d6d3d1 !important;
                  background: white !important;
                  padding: 0 12px !important;
                }
                
                .cl-dividerRow {
                  margin: 20px 0 !important;
                }
                
                /* Social button text */
                .cl-socialButtonsBlockButtonText {
                  color: #44403c !important;
                  font-weight: 500 !important;
                }
                
                /* Footer - hide */
                .cl-footer,
                .cl-footerAction {
                  display: none !important;
                }
                
                /* Form spacing */
                .cl-formFieldRow {
                  margin-bottom: 16px !important;
                }
                
                /* Password toggle */
                .cl-formFieldInputShowPasswordButton {
                  color: #a8a29e !important;
                }
                
                .cl-formFieldInputShowPasswordButton:hover {
                  color: #57534e !important;
                }
                
                /* OTP inputs */
                .cl-otpCodeFieldInput {
                  background: #fafaf9 !important;
                  border: none !important;
                  border-radius: 12px !important;
                }
                
                .cl-otpCodeFieldInput:focus {
                  background: #f5f5f4 !important;
                }
                
                /* Internal branding elements only */
                .cl-internal-b3fm6y,
                .cl-footerPages,
                .cl-footerPagesLink,
                .cl-badge,
                .cl-logoBox,
                .cl-logoImage,
                a[href*="clerk.com"] {
                  display: none !important;
                }
              `}</style>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-stone-300 hover:text-stone-500 hover:bg-stone-50 rounded-full transition-all z-10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 sm:p-8">
                {/* Logo + Title - Centered stack */}
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="flex flex-col items-center gap-3 mb-6"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-900 flex items-center justify-center">
                    <span className="text-white font-bold text-sm tracking-tight">12</span>
                  </div>
                  <span className="text-xs tracking-widest uppercase text-stone-400 font-medium">
                    {mode === 'sign-up' ? 'Create Account' : 'Welcome Back'}
                  </span>
                </motion.div>

                {/* Auth Component */}
                <motion.div
                  key={`auth-${mode}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {mode === 'sign-in' ? (
                    <SignIn 
                      appearance={clerkAppearance}
                      routing="hash"
                      afterSignInUrl={redirectUrl || '/dashboard'}
                    />
                  ) : (
                    <SignUp 
                      appearance={clerkAppearance}
                      routing="hash"
                      afterSignUpUrl={redirectUrl || '/dashboard'}
                    />
                  )}
                </motion.div>

                {/* Footer - Clean, no border */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="mt-6 text-center space-y-3"
                >
                  <p className="text-sm text-stone-500">
                    {mode === 'sign-up' ? (
                      <>
                        Already have an account?{' '}
                        <button 
                          onClick={toggleMode}
                          className="text-stone-900 font-semibold hover:underline transition-colors"
                        >
                          Sign in
                        </button>
                      </>
                    ) : (
                      <>
                        Don&apos;t have an account?{' '}
                        <button 
                          onClick={toggleMode}
                          className="text-stone-900 font-semibold hover:underline transition-colors"
                        >
                          Sign up
                        </button>
                      </>
                    )}
                  </p>
                  <p className="text-xs text-stone-400">
                    By continuing you accept our{' '}
                    <Link href="/terms" className="underline hover:text-stone-600 transition-colors">Terms</Link>
                    {' & '}
                    <Link href="/privacy" className="underline hover:text-stone-600 transition-colors">Privacy</Link>
                  </p>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Hook for easy usage
import { createContext, useContext, ReactNode } from 'react'

interface AuthModalContextType {
  openAuthModal: (mode?: AuthMode, redirectUrl?: string) => void
  closeAuthModal: () => void
  isOpen: boolean
}

const AuthModalContext = createContext<AuthModalContextType | null>(null)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error('useAuthModal must be used within an AuthModalProvider')
  }
  return context
}

interface AuthModalProviderProps {
  children: ReactNode
}

export function AuthModalProvider({ children }: AuthModalProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>('sign-in')
  const [redirectUrl, setRedirectUrl] = useState<string | undefined>()

  const openAuthModal = useCallback((newMode: AuthMode = 'sign-in', newRedirectUrl?: string) => {
    setMode(newMode)
    setRedirectUrl(newRedirectUrl)
    setIsOpen(true)
  }, [])

  const closeAuthModal = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal, isOpen }}>
      {children}
      <AuthModal 
        isOpen={isOpen} 
        onClose={closeAuthModal} 
        initialMode={mode}
        redirectUrl={redirectUrl}
      />
    </AuthModalContext.Provider>
  )
}
