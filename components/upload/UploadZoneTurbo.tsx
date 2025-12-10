'use client'

/**
 * TURBO UPLOAD ZONE - State-of-the-Art Upload Experience
 * 
 * This is the most advanced upload UI combining:
 * 1. Web Worker parallel compression (4-8 images at once)
 * 2. Pipeline parallelism (compress while uploading)
 * 3. Aggressive URL preflight (200+ URLs at once)
 * 4. Adaptive concurrency (6-24 concurrent uploads)
 * 5. Real-time stats with accurate ETAs
 * 
 * Target: 600 images in under 5 minutes
 */

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Zap, ZapOff, Pause, Play, RotateCcw } from 'lucide-react'
import { TurboUploadEngine, TurboFile, TurboUploadStats } from '@/lib/upload/turbo-upload-engine'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, LARGE_UPLOAD_THRESHOLD } from '@/lib/utils/constants'
import { DropOverlay } from './DropOverlay'
import { LargeUploadOverlay } from './LargeUploadOverlay'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, X, Cpu, Upload, CheckCircle2 } from 'lucide-react'

interface UploadZoneTurboProps {
  galleryId: string
  onUploadComplete: () => void
}

interface RejectedFile {
  name: string
  reason: string
}

export function UploadZoneTurbo({ galleryId, onUploadComplete }: UploadZoneTurboProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const engineRef = useRef<TurboUploadEngine | null>(null)
  
  // File state
  const [files, setFiles] = useState<TurboFile[]>([])
  const [stats, setStats] = useState<TurboUploadStats | null>(null)
  
  // UI state
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [compressionEnabled, setCompressionEnabled] = useState(true)
  const [overlayMinimized, setOverlayMinimized] = useState(false)
  
  // Rejected files
  const [rejectedFiles, setRejectedFiles] = useState<RejectedFile[]>([])
  const [showRejectedBanner, setShowRejectedBanner] = useState(false)
  
  // Initialize engine
  useEffect(() => {
    engineRef.current = new TurboUploadEngine({
      galleryId,
      enableCompression: compressionEnabled,
      onFileUpdate: (file) => {
        setFiles(prev => {
          const idx = prev.findIndex(f => f.id === file.id)
          if (idx >= 0) {
            const updated = [...prev]
            updated[idx] = file
            return updated
          }
          return [...prev, file]
        })
      },
      onStatsUpdate: setStats,
      onComplete: (successful, failed) => {
        setIsUploading(false)
        if (successful > 0) {
          router.refresh()
          onUploadComplete()
        }
      }
    })
    
    return () => {
      engineRef.current?.destroy()
    }
  }, [galleryId, compressionEnabled])
  
  // Computed values
  const totalFiles = files.length
  const completedFiles = files.filter(f => f.status === 'completed').length
  const compressingFiles = files.filter(f => f.status === 'compressing').length
  const uploadingFiles = files.filter(f => f.status === 'uploading').length
  const failedFiles = files.filter(f => f.status === 'error').length
  const totalProgress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
  const showLargeUploadOverlay = isUploading && totalFiles >= LARGE_UPLOAD_THRESHOLD && !overlayMinimized
  
  // Bandwidth savings
  const bandwidthSaved = stats?.bandwidthSaved || 0
  const bandwidthSavedMB = (bandwidthSaved / (1024 * 1024)).toFixed(1)
  const compressionRatioAvg = stats && stats.totalCompressedBytes > 0 
    ? (stats.totalOriginalBytes / stats.totalCompressedBytes).toFixed(1) 
    : '1.0'
  
  // Global drag listeners
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault()
      if (e.relatedTarget === null) {
        setIsDragging(false)
      }
    }

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files)
      }
    }

    window.addEventListener('dragenter', handleWindowDragEnter)
    window.addEventListener('dragleave', handleWindowDragLeave)
    window.addEventListener('drop', handleWindowDrop)
    window.addEventListener('dragover', (e) => e.preventDefault())

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter)
      window.removeEventListener('dragleave', handleWindowDragLeave)
      window.removeEventListener('drop', handleWindowDrop)
      window.removeEventListener('dragover', (e) => e.preventDefault())
    }
  }, [])

  const validateFile = (file: File): { valid: boolean; reason?: string } => {
    if (file.type.startsWith('video/')) {
      return { valid: false, reason: 'Video files not supported' }
    }
    if (!file.type.startsWith('image/')) {
      return { valid: false, reason: `"${file.type || 'Unknown'}" not supported` }
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return { valid: false, reason: `${file.type.replace('image/', '').toUpperCase()} not supported` }
    }
    if (file.size > MAX_FILE_SIZE) {
      return { valid: false, reason: `Too large (${(file.size / 1024 / 1024).toFixed(1)}MB)` }
    }
    return { valid: true }
  }

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList || !engineRef.current) return

    const allFiles = Array.from(fileList)
    const validFiles: File[] = []
    const newRejected: RejectedFile[] = []
    
    for (const file of allFiles) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        newRejected.push({ name: file.name, reason: validation.reason! })
      }
    }
    
    if (newRejected.length > 0) {
      setRejectedFiles(prev => [...prev, ...newRejected])
      setShowRejectedBanner(true)
    }
    
    if (validFiles.length > 0) {
      setIsUploading(true)
      setOverlayMinimized(false)
      engineRef.current.addFiles(validFiles)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])
  
  const togglePause = () => {
    if (!engineRef.current) return
    if (isPaused) {
      engineRef.current.resume()
    } else {
      engineRef.current.pause()
    }
    setIsPaused(!isPaused)
  }
  
  const retryFailed = () => {
    engineRef.current?.retryFailed()
    setIsUploading(true)
  }

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${Math.ceil(seconds)}s`
    if (seconds < 3600) return `${Math.ceil(seconds / 60)}m`
    return `${Math.floor(seconds / 3600)}h ${Math.ceil((seconds % 3600) / 60)}m`
  }

  return (
    <div className="h-full flex flex-col">
      <DropOverlay isVisible={isDragging} />
      
      <LargeUploadOverlay
        isVisible={showLargeUploadOverlay}
        totalFiles={totalFiles}
        completedFiles={completedFiles}
        totalProgress={totalProgress}
        estimatedMinutes={Math.ceil((stats?.estimatedSecondsRemaining || 0) / 60)}
        onMinimize={() => setOverlayMinimized(true)}
      />
      
      {/* Rejected Files Banner */}
      <AnimatePresence>
        {showRejectedBanner && rejectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-4 p-4 bg-stone-100 border border-stone-200 rounded-xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-stone-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-stone-700">
                    {rejectedFiles.length} file{rejectedFiles.length > 1 ? 's' : ''} skipped
                  </p>
                  <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                    {rejectedFiles.slice(0, 5).map((file, i) => (
                      <p key={i} className="text-xs text-stone-500">
                        <span className="font-medium">{file.name}</span>
                        <span className="text-stone-400"> — {file.reason}</span>
                      </p>
                    ))}
                    {rejectedFiles.length > 5 && (
                      <p className="text-xs text-stone-400 italic">
                        +{rejectedFiles.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowRejectedBanner(false)
                  setRejectedFiles([])
                }}
                className="p-1 hover:bg-stone-200 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-stone-400" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Turbo Mode Toggle & Stats */}
      <div className="flex items-center justify-between mb-4 px-1">
        <button
          onClick={() => setCompressionEnabled(!compressionEnabled)}
          disabled={isUploading}
          className={`flex items-center gap-2 text-xs font-medium transition-colors ${
            compressionEnabled 
              ? 'text-stone-700 hover:text-stone-900' 
              : 'text-stone-400 hover:text-stone-600'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {compressionEnabled ? (
            <Zap className="w-3.5 h-3.5" />
          ) : (
            <ZapOff className="w-3.5 h-3.5" />
          )}
          {compressionEnabled ? 'Turbo Mode ON' : 'Turbo Mode OFF'}
        </button>
        
        {/* Live stats */}
        <AnimatePresence>
          {stats && bandwidthSaved > 1024 * 1024 && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs text-stone-500 font-medium"
            >
              {bandwidthSavedMB}MB saved ({compressionRatioAvg}x faster)
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      
      {/* Pipeline Status */}
      {isUploading && stats && (
        <div className="mb-4 p-3 bg-stone-50 rounded-xl border border-stone-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4 text-xs">
              {compressingFiles > 0 && (
                <span className="flex items-center gap-1.5 text-stone-600">
                  <Cpu className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-400 animate-pulse" />
                  Compressing {compressingFiles}
                </span>
              )}
              {uploadingFiles > 0 && (
                <span className="flex items-center gap-1.5 text-stone-600">
                  <Upload className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-stone-500 animate-pulse" />
                  Uploading {uploadingFiles}
                </span>
              )}
              {completedFiles > 0 && (
                <span className="flex items-center gap-1.5 text-stone-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {completedFiles} done
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Speed indicator */}
              <span className="text-[10px] text-stone-400 font-mono">
                {stats.avgSpeedMBps.toFixed(1)} MB/s
              </span>
              
              {/* Concurrency indicator */}
              <span className="text-[10px] text-stone-400 font-mono">
                ×{stats.currentConcurrency}
              </span>
              
              {/* Pause/Resume */}
              <button
                onClick={togglePause}
                className="p-1 hover:bg-stone-200 rounded transition-colors"
              >
                {isPaused ? (
                  <Play className="w-3.5 h-3.5 text-stone-500" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-stone-500" />
                )}
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-stone-900"
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          
          {/* ETA */}
          {stats.estimatedSecondsRemaining > 0 && (
            <p className="text-[10px] text-stone-400 mt-1.5 text-right">
              ~{formatTimeRemaining(stats.estimatedSecondsRemaining)} remaining
            </p>
          )}
        </div>
      )}
      
      {/* Drop Target */}
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`flex-none mb-6 transition-all duration-300 ${files.length === 0 ? 'flex-1 flex flex-col' : ''}`}
      >
        <motion.div
          whileHover={{ borderColor: 'rgba(15,23,42,0.35)', backgroundColor: '#FAFAF9' }}
          whileTap={{ scale: 0.995 }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl border border-dashed border-stone-200 bg-white text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center ${files.length === 0 ? 'flex-1 min-h-[320px]' : 'p-10 min-h-[180px]'}`}
        >
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Plus className="w-6 h-6 text-stone-400 group-hover:text-stone-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-serif text-stone-900">
                {files.length > 0 ? 'Add more images' : 'Drag images here to upload'}
              </h3>
              <p className="text-sm text-stone-500">
                or <span className="underline decoration-stone-300 hover:text-stone-800 decoration-1 underline-offset-2 transition-colors">browse files</span>
              </p>
            </div>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.15em] mt-2">
              JPEG, PNG, WEBP • Turbo compression enabled
            </p>
          </div>
        </motion.div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Compact File List (only show first 10 + count) */}
      {files.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="text-xs text-stone-400 mb-2">
            {files.length} files • {completedFiles} uploaded
            {failedFiles > 0 && <span className="text-red-500"> • {failedFiles} failed</span>}
          </div>
          
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {files.slice(0, 10).map(file => (
              <div 
                key={file.id}
                className="flex items-center gap-2 text-xs py-1"
              >
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  file.status === 'completed' ? 'bg-stone-400' :
                  file.status === 'error' ? 'bg-red-400' :
                  file.status === 'uploading' ? 'bg-stone-500 animate-pulse' :
                  file.status === 'compressing' ? 'bg-stone-400 animate-pulse' :
                  'bg-stone-200'
                }`} />
                <span className="truncate text-stone-600 flex-1">{file.file.name}</span>
                {file.status === 'uploading' && (
                  <span className="text-stone-400 font-mono">{Math.round(file.progress)}%</span>
                )}
                {file.compressionRatio && file.compressionRatio > 1.1 && (
                  <span className="text-stone-400 font-mono">{file.compressionRatio.toFixed(1)}×</span>
                )}
              </div>
            ))}
            {files.length > 10 && (
              <p className="text-xs text-stone-400 py-1">
                +{files.length - 10} more files...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      {files.length > 0 && (
        <div className="flex-none pt-4 mt-2 border-t border-stone-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500 font-medium">
              {completedFiles} of {files.length} uploaded
            </span>
            
            {isUploading ? (
              <span className="text-sm text-stone-600 font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-stone-500 animate-pulse" />
                {isPaused ? 'Paused' : compressingFiles > 0 ? 'Optimizing...' : 'Uploading...'}
              </span>
            ) : failedFiles > 0 ? (
              <button
                onClick={retryFailed}
                className="text-sm text-stone-600 hover:text-stone-900 flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Retry {failedFiles} failed
              </button>
            ) : completedFiles === files.length && files.length > 0 ? (
              <span className="text-sm text-stone-500 font-medium">
                ✓ Complete
              </span>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
