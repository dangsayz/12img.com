'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Max width class, e.g. 'max-w-lg', 'max-w-xl', 'max-w-2xl' */
  maxWidth?: string
  /** Show close button in header */
  showCloseButton?: boolean
  /** Title for the modal header */
  title?: string
  /** Subtitle for the modal header */
  subtitle?: string
  /** Custom header content (overrides title/subtitle) */
  header?: ReactNode
  /** Footer content */
  footer?: ReactNode
}

/**
 * Reusable modal component with proper centering that:
 * - Always stays centered in viewport
 * - Never gets cut off
 * - Works on mobile (full width with padding)
 * - Has scrollable content area
 * - Respects safe areas on mobile
 */
export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  showCloseButton = true,
  title,
  subtitle,
  header,
  footer,
}: ModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal Container - Flexbox centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`w-full ${maxWidth} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] pointer-events-auto`}
            >
              {/* Header */}
              {(header || title) && (
                <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 shrink-0">
                  {header || (
                    <div>
                      {title && (
                        <h2 className="text-lg font-semibold text-stone-900">
                          {title}
                        </h2>
                      )}
                      {subtitle && (
                        <p className="text-sm text-stone-500 mt-0.5">{subtitle}</p>
                      )}
                    </div>
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {children}
              </div>

              {/* Footer */}
              {footer && (
                <div className="shrink-0 border-t border-stone-100">
                  {footer}
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

/**
 * Modal content wrapper with standard padding
 */
export function ModalContent({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>
}

/**
 * Modal footer wrapper with standard styling
 */
export function ModalFooter({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`px-6 py-4 bg-stone-50 flex items-center justify-end gap-3 ${className}`}>
      {children}
    </div>
  )
}
