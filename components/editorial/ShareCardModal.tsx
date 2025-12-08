'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Share2, Loader2, Check } from 'lucide-react'
import Image from 'next/image'

interface ShareCardModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  imageCount: number
  previewImages: { url: string; id: string }[] // First 4-6 images for the collage
  galleryUrl: string
}

export function ShareCardModal({
  isOpen,
  onClose,
  title,
  imageCount,
  previewImages,
  galleryUrl,
}: ShareCardModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Generate the share card when modal opens
  useEffect(() => {
    if (isOpen && previewImages.length > 0 && !generatedImage) {
      generateShareCard()
    }
  }, [isOpen, previewImages])

  const generateShareCard = async () => {
    setIsGenerating(true)
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Canvas size - Instagram square
    const width = 1080
    const height = 1080
    canvas.width = width
    canvas.height = height

    // Rich moody background - dark chocolate brown like BRIMCD
    ctx.fillStyle = '#1C1917'
    ctx.fillRect(0, 0, width, height)
    
    // Add subtle texture/grain effect
    ctx.fillStyle = 'rgba(255,255,255,0.02)'
    for (let i = 0; i < 5000; i++) {
      const x = Math.random() * width
      const y = Math.random() * height
      ctx.fillRect(x, y, 1, 1)
    }

    // Load images
    try {
      const loadedImages = await Promise.all(
        previewImages.slice(0, 4).map(img => loadImage(img.url))
      )

      // Helper to draw image with white card border (like print photos)
      const drawPrintCard = (img: HTMLImageElement, x: number, y: number, w: number, h: number, rotation: number = 0) => {
        const border = 12 // White border thickness
        
        ctx.save()
        
        // Apply rotation if needed
        if (rotation !== 0) {
          ctx.translate(x + w/2, y + h/2)
          ctx.rotate(rotation * Math.PI / 180)
          ctx.translate(-(x + w/2), -(y + h/2))
        }
        
        // Shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.35)'
        ctx.shadowBlur = 25
        ctx.shadowOffsetX = 4
        ctx.shadowOffsetY = 8
        
        // White card background - SHARP edges
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(x, y, w + border * 2, h + border * 2)
        
        // Reset shadow before drawing image
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 0
        
        // Draw image inside the white border - SHARP edges (no roundRect)
        drawImageCover(ctx, img, x + border, y + border, w, h)
        
        ctx.restore()
      }

      if (loadedImages.length >= 3) {
        // Scattered print cards layout
        // Main large card - left, slight rotation
        drawPrintCard(loadedImages[0], 60, 260, 360, 480, -2)
        
        // Second card - top right, opposite rotation
        drawPrintCard(loadedImages[1], 480, 280, 220, 290, 3)
        
        // Third card - bottom right, overlapping
        drawPrintCard(loadedImages[2], 560, 520, 260, 340, -1)
        
      } else if (loadedImages.length >= 1) {
        // Single hero print card - centered
        drawPrintCard(loadedImages[0], 240, 280, 600, 480, 0)
      }
    } catch (error) {
      console.error('Failed to load images:', error)
    }

    // Title - elegant serif at top, warm gold/cream color
    ctx.fillStyle = '#E8DDD4' // Warm cream
    ctx.font = 'italic 300 52px Georgia, "Times New Roman", serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const titleLines = wrapText(ctx, title, width - 160)
    titleLines.forEach((line, i) => {
      ctx.fillText(line, width / 2, 120 + i * 60)
    })

    // Subtle decorative line
    ctx.strokeStyle = 'rgba(232, 221, 212, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(width / 2 - 40, 180 + titleLines.length * 30)
    ctx.lineTo(width / 2 + 40, 180 + titleLines.length * 30)
    ctx.stroke()

    // Image count - subtle
    ctx.fillStyle = 'rgba(232, 221, 212, 0.5)'
    ctx.font = '300 18px system-ui, -apple-system, sans-serif'
    ctx.fillText(`${imageCount} images`, width / 2, 210 + titleLines.length * 30)

    // Bottom branding - elegant and subtle
    ctx.fillStyle = 'rgba(232, 221, 212, 0.4)'
    ctx.font = '400 14px system-ui, -apple-system, sans-serif'
    ctx.letterSpacing = '0.2em'
    ctx.fillText('View gallery at', width / 2, height - 70)
    
    // 12img.com - slightly more prominent
    ctx.fillStyle = '#E8DDD4'
    ctx.font = '500 22px system-ui, -apple-system, sans-serif'
    ctx.fillText('12img.com', width / 2, height - 40)

    // Convert to image
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setGeneratedImage(dataUrl)
    setIsGenerating(false)
  }

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img')
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    width: number,
    height: number
  ) => {
    const imgRatio = img.width / img.height
    const targetRatio = width / height

    let sx = 0, sy = 0, sw = img.width, sh = img.height

    if (imgRatio > targetRatio) {
      // Image is wider - crop sides
      sw = img.height * targetRatio
      sx = (img.width - sw) / 2
    } else {
      // Image is taller - crop top/bottom
      sh = img.width / targetRatio
      sy = (img.height - sh) / 2
    }

    // Round corners with clip
    ctx.save()
    roundRect(ctx, x, y, width, height, 8)
    ctx.clip()
    ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height)
    ctx.restore()
  }

  const roundRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    ctx.lineTo(x + radius, y + height)
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    ctx.lineTo(x, y + radius)
    ctx.quadraticCurveTo(x, y, x + radius, y)
    ctx.closePath()
  }

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine) {
      lines.push(currentLine)
    }

    return lines.slice(0, 2) // Max 2 lines
  }

  const handleDownload = () => {
    if (!generatedImage) return

    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-12img.jpg`
    link.href = generatedImage
    link.click()
  }

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(galleryUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleNativeShare = async () => {
    if (!generatedImage) return

    try {
      // Convert data URL to blob
      const response = await fetch(generatedImage)
      const blob = await response.blob()
      const file = new File([blob], `${title}-12img.jpg`, { type: 'image/jpeg' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: title,
          text: `Check out "${title}" - ${imageCount} beautiful images\n\nView at: ${galleryUrl}`,
          files: [file],
        })
      } else {
        // Fallback - just share the link
        await navigator.share({
          title: title,
          text: `Check out "${title}" on 12img.com`,
          url: galleryUrl,
        })
      }
    } catch (error) {
      console.error('Share failed:', error)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-stone-900">Share to Social</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-stone-400" />
            </button>
          </div>

          {/* Compact Preview */}
          <div className="p-4">
            <div className="relative aspect-square bg-stone-100 rounded-lg overflow-hidden mb-3 shadow-inner">
              {isGenerating ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                </div>
              ) : generatedImage ? (
                <Image
                  src={generatedImage}
                  alt="Share card preview"
                  fill
                  className="object-cover"
                />
              ) : null}
            </div>

            {/* Hidden canvas for generation */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Actions */}
            <div className="space-y-2">
              {/* Primary action - Download */}
              <button
                onClick={handleDownload}
                disabled={!generatedImage}
                className="w-full h-10 bg-stone-900 text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Save Image
              </button>

              {/* Secondary actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleNativeShare}
                  disabled={!generatedImage}
                  className="flex-1 h-9 bg-stone-100 text-stone-700 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-stone-200 transition-colors disabled:opacity-50"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share
                </button>
                <button
                  onClick={handleCopyLink}
                  className={`flex-1 h-9 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
                    copied 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : null}
                  {copied ? 'Copied!' : 'Copy Link'}
                </button>
              </div>
            </div>

            {/* Tip */}
            <p className="text-center text-[11px] text-stone-400 mt-3">
              Perfect for Instagram, Twitter & more
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
