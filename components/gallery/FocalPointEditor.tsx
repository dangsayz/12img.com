'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Check, RotateCcw, Move, Crosshair } from 'lucide-react'
import { updateImageFocalPoint } from '@/server/actions/gallery.actions'

interface FocalPointEditorProps {
  isOpen: boolean
  onClose: () => void
  image: {
    id: string
    url: string
    focalX?: number | null
    focalY?: number | null
  }
  onSave?: (focalX: number, focalY: number) => void
}

export function FocalPointEditor({
  isOpen,
  onClose,
  image,
  onSave,
}: FocalPointEditorProps) {
  // Initialize with existing focal point or center (50, 50)
  const [focalX, setFocalX] = useState(image.focalX ?? 50)
  const [focalY, setFocalY] = useState(image.focalY ?? 50)
  const [isSaving, setIsSaving] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [showGuides, setShowGuides] = useState(true)
  
  const imageRef = useRef<HTMLDivElement>(null)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null)

  // Reset when image changes
  useEffect(() => {
    setFocalX(image.focalX ?? 50)
    setFocalY(image.focalY ?? 50)
  }, [image.id, image.focalX, image.focalY])

  // Calculate position from event (works for both mouse and touch)
  const calculatePosition = useCallback((clientX: number, clientY: number) => {
    if (!imageRef.current) return null
    
    const rect = imageRef.current.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 100
    const y = ((clientY - rect.top) / rect.height) * 100
    
    // Clamp to 0-100
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    }
  }, [])

  // Handle click/tap to set focal point
  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const pos = calculatePosition(clientX, clientY)
    if (pos) {
      setFocalX(Math.round(pos.x * 10) / 10)
      setFocalY(Math.round(pos.y * 10) / 10)
    }
  }, [calculatePosition])

  // Handle drag start
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDragging(true)
    
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    touchStartRef.current = { x: clientX, y: clientY }
  }, [])

  // Handle drag move
  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return
    e.preventDefault()
    
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const pos = calculatePosition(clientX, clientY)
    if (pos) {
      setFocalX(Math.round(pos.x * 10) / 10)
      setFocalY(Math.round(pos.y * 10) / 10)
    }
  }, [isDragging, calculatePosition])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false)
    touchStartRef.current = null
  }, [])

  // Reset to center
  const handleReset = useCallback(() => {
    setFocalX(50)
    setFocalY(50)
  }, [])

  // Save focal point
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    
    try {
      const result = await updateImageFocalPoint(image.id, focalX, focalY)
      
      if (result.success) {
        onSave?.(focalX, focalY)
        onClose()
      } else {
        console.error('Failed to save focal point:', result.error)
        alert(result.error || 'Failed to save')
      }
    } catch (error) {
      console.error('Error saving focal point:', error)
      alert('Failed to save focal point')
    } finally {
      setIsSaving(false)
    }
  }, [image.id, focalX, focalY, onSave, onClose])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return
      
      const step = e.shiftKey ? 10 : 1
      
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case 'Enter':
          handleSave()
          break
        case 'ArrowLeft':
          e.preventDefault()
          setFocalX(prev => Math.max(0, prev - step))
          break
        case 'ArrowRight':
          e.preventDefault()
          setFocalX(prev => Math.min(100, prev + step))
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocalY(prev => Math.max(0, prev - step))
          break
        case 'ArrowDown':
          e.preventDefault()
          setFocalY(prev => Math.min(100, prev + step))
          break
        case 'r':
        case 'R':
          handleReset()
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, handleSave, handleReset])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/95 flex flex-col"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          {/* Header - Mobile optimized with large touch targets */}
          <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="p-3 -m-2 rounded-full hover:bg-white/10 transition-colors touch-manipulation"
                aria-label="Close"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </button>
              <div>
                <h2 className="text-white font-medium text-sm sm:text-base">Set Focal Point</h2>
                <p className="text-white/50 text-xs sm:text-sm hidden sm:block">
                  Tap where you want the image centered when cropped
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2.5 sm:px-4 sm:py-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors touch-manipulation"
                aria-label="Reset to center"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Reset</span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2.5 sm:px-5 sm:py-2 bg-white text-black font-medium rounded-lg hover:bg-white/90 disabled:opacity-50 transition-colors touch-manipulation"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span className="text-sm">Save</span>
              </button>
            </div>
          </header>

          {/* Main content area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Image container with focal point overlay */}
            <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
              <div
                ref={imageRef}
                className="relative max-w-full max-h-full cursor-crosshair select-none touch-none"
                onClick={handleClick}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
              >
                {/* The image */}
                <img
                  src={image.url}
                  alt=""
                  className="max-w-full max-h-[60vh] sm:max-h-[70vh] object-contain rounded-lg"
                  draggable={false}
                />
                
                {/* Guide lines (rule of thirds) */}
                {showGuides && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Vertical lines */}
                    <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/20" />
                    <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/20" />
                    {/* Horizontal lines */}
                    <div className="absolute top-1/3 left-0 right-0 h-px bg-white/20" />
                    <div className="absolute top-2/3 left-0 right-0 h-px bg-white/20" />
                  </div>
                )}
                
                {/* Focal point marker */}
                <motion.div
                  className="absolute pointer-events-none"
                  style={{
                    left: `${focalX}%`,
                    top: `${focalY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  animate={{
                    scale: isDragging ? 1.2 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Outer ring */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
                    {/* Inner crosshair */}
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8">
                      <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white -translate-x-1/2" />
                      <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white -translate-y-1/2" />
                      <div className="absolute left-1/2 top-1/2 w-2 h-2 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                  
                  {/* Pulse effect when dragging */}
                  {isDragging && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-white/50"
                      initial={{ scale: 1, opacity: 1 }}
                      animate={{ scale: 1.5, opacity: 0 }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    />
                  )}
                </motion.div>
                
                {/* Touch hint for mobile */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 sm:hidden">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-sm rounded-full">
                    <Move className="w-3.5 h-3.5 text-white/70" />
                    <span className="text-white/70 text-xs">Tap or drag to set point</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom controls - Large touch targets for mobile */}
            <div className="flex-shrink-0 border-t border-white/10 bg-black/50 backdrop-blur-sm">
              <div className="px-4 py-4 sm:px-6 sm:py-5">
                {/* Coordinates display */}
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center">
                    <span className="text-white/50 text-xs uppercase tracking-wider">X</span>
                    <p className="text-white font-mono text-lg">{focalX.toFixed(1)}%</p>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <span className="text-white/50 text-xs uppercase tracking-wider">Y</span>
                    <p className="text-white font-mono text-lg">{focalY.toFixed(1)}%</p>
                  </div>
                </div>
                
                {/* Quick position buttons - Large for thumb reach */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  {[
                    { x: 0, y: 0, label: '↖' },
                    { x: 50, y: 0, label: '↑' },
                    { x: 100, y: 0, label: '↗' },
                    { x: 0, y: 50, label: '←' },
                    { x: 50, y: 50, label: '●' },
                    { x: 100, y: 50, label: '→' },
                    { x: 0, y: 100, label: '↙' },
                    { x: 50, y: 100, label: '↓' },
                    { x: 100, y: 100, label: '↘' },
                  ].map((pos) => (
                    <button
                      key={`${pos.x}-${pos.y}`}
                      onClick={() => {
                        setFocalX(pos.x)
                        setFocalY(pos.y)
                      }}
                      className={`
                        h-11 rounded-lg font-medium text-lg transition-colors touch-manipulation
                        ${focalX === pos.x && focalY === pos.y
                          ? 'bg-white text-black'
                          : 'bg-white/10 text-white hover:bg-white/20'
                        }
                      `}
                    >
                      {pos.label}
                    </button>
                  ))}
                </div>
                
                {/* Keyboard hints - Desktop only */}
                <p className="hidden sm:block text-center text-white/40 text-xs mt-4">
                  Arrow keys to nudge • Shift+Arrow for larger steps • R to reset • Enter to save
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
