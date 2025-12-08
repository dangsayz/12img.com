'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface AuthLayoutProps {
  children: React.ReactNode
  mode: 'sign-in' | 'sign-up'
}

export function AuthLayout({ children, mode }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F5F5F7] flex items-center justify-center p-3 sm:p-4">
      {/* Custom CSS overrides for Clerk */}
      <style jsx global>{`
        /* Remove card backgrounds and shadows */
        .cl-card,
        .cl-cardBox {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        
        /* Input fields - underline only */
        .cl-formFieldInput {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #d6d3d1 !important;
          border-radius: 0 !important;
          padding-left: 0 !important;
          padding-right: 0 !important;
          box-shadow: none !important;
          font-size: 14px !important;
        }
        
        .cl-formFieldInput:focus {
          border-bottom-color: #1c1917 !important;
          box-shadow: none !important;
          outline: none !important;
        }
        
        /* Labels */
        .cl-formFieldLabel {
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2em !important;
          color: #a8a29e !important;
          font-weight: 500 !important;
        }
        
        /* Social buttons */
        .cl-socialButtonsBlockButton {
          background: transparent !important;
          border: none !important;
          border-bottom: 1px solid #e7e5e4 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }
        
        .cl-socialButtonsBlockButton:hover {
          background: rgba(245, 245, 247, 0.5) !important;
        }
        
        /* Primary button - full width, compact */
        .cl-formButtonPrimary {
          width: 100% !important;
          height: 44px !important;
          min-height: 44px !important;
          border-radius: 0 !important;
          background: #1c1917 !important;
          padding: 0 16px !important;
          font-size: 13px !important;
          font-weight: 500 !important;
          letter-spacing: 0.05em !important;
          text-transform: uppercase !important;
          color: white !important;
          transition: all 0.2s ease !important;
        }
        
        .cl-formButtonPrimary:hover {
          background: #292524 !important;
        }
        
        /* Divider */
        .cl-dividerLine {
          background: #e7e5e4 !important;
        }
        
        .cl-dividerText {
          font-size: 10px !important;
          text-transform: uppercase !important;
          letter-spacing: 0.2em !important;
          color: #d6d3d1 !important;
          background: white !important;
          padding: 0 16px !important;
        }
        
        /* Footer - hide */
        .cl-footer,
        .cl-footerAction {
          display: none !important;
        }
        
        /* Form spacing - condensed */
        .cl-formFieldRow {
          margin-bottom: 12px !important;
        }
        
        /* Reduce social button padding */
        .cl-socialButtonsBlockButton {
          padding: 8px 12px !important;
          font-size: 13px !important;
        }
        
        /* Compact divider */
        .cl-dividerRow {
          margin: 8px 0 !important;
        }
        
        /* Reduce main form padding */
        .cl-main {
          gap: 12px !important;
        }
        
        /* Password toggle */
        .cl-formFieldInputShowPasswordButton {
          color: #d6d3d1 !important;
        }
        
        .cl-formFieldInputShowPasswordButton:hover {
          color: #78716c !important;
        }
        
        /* Internal elements */
        .cl-internal-b3fm6y {
          display: none !important;
        }
        
        /* Mobile optimizations */
        @media (max-height: 600px) {
          .cl-formButtonPrimary {
            height: 40px !important;
            min-height: 40px !important;
          }
          .cl-formFieldRow {
            margin-bottom: 8px !important;
          }
          .cl-socialButtonsBlockButton {
            padding: 6px 10px !important;
          }
          .cl-dividerRow {
            margin: 6px 0 !important;
          }
        }
      `}</style>
      {/* Back to home */}
      <Link 
        href="/"
        className="fixed top-6 left-6 z-10 flex items-center gap-2 text-stone-400 hover:text-stone-600 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back</span>
      </Link>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 p-5 sm:p-6">
          {/* Logo + Title - Combined for compactness */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-stone-900 flex items-center justify-center">
                <span className="text-white font-bold text-xs tracking-tight">12</span>
              </div>
              <span className="text-[10px] tracking-[0.2em] uppercase text-stone-400 font-medium">
                {mode === 'sign-up' ? 'create account' : 'welcome back'}
              </span>
            </Link>
          </motion.div>

          {/* Auth Component */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {children}
          </motion.div>

          {/* Terms + Switch mode - Combined */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-4 pt-3 border-t border-stone-100 text-center space-y-1"
          >
            <p className="text-sm text-stone-400">
              {mode === 'sign-up' ? (
                <>
                  Already have an account?{' '}
                  <Link href="/sign-in" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{' '}
                  <Link href="/sign-up" className="text-stone-600 hover:text-stone-900 font-medium transition-colors">
                    Sign up
                  </Link>
                </>
              )}
            </p>
            <p className="text-[10px] text-stone-300 tracking-wide">
              By continuing you accept our{' '}
              <Link href="/terms" className="underline hover:text-stone-500 transition-colors">Terms</Link>
              {' '}&{' '}
              <Link href="/privacy" className="underline hover:text-stone-500 transition-colors">Privacy</Link>
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  )
}
