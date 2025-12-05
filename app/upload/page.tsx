'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'
import { createGallery } from '@/server/actions/gallery.actions'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS } from '@/lib/utils/constants'
import { Header } from '@/components/layout/Header'
import { DropOverlay } from '@/components/upload/DropOverlay'
import { FileItemState } from '@/components/upload/FileItem'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isUploadingRef = useRef(false)

  // Auto-focus title on mount
  useEffect(() => {
    titleInputRef.current?.focus()
  }, [])

  // Auto-upload when files are added
  useEffect(() => {
    const pendingCount = uploads.filter(u => u.status === 'pending').length
    if (pendingCount > 0 && !isUploadingRef.current && galleryTitle.trim()) {
      processQueue()
    }
  }, [uploads, galleryTitle])

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

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) return `Invalid file type`
    if (file.size > MAX_FILE_SIZE) return `File too large`
    return null
  }

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const newUploads: FileItemState[] = []
    Array.from(fileList).forEach((file) => {
      const error = validateFile(file)
      newUploads.push({
        id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: URL.createObjectURL(file),
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      })
    })

    setUploads((prev) => [...prev, ...newUploads])
    
    if (!galleryTitle.trim() && newUploads.length > 0) {
      const today = new Date()
      setGalleryTitle(`Gallery ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
    }
  }, [galleryTitle])

  const processQueue = async () => {
    if (isUploadingRef.current) return
    if (!galleryTitle.trim()) {
      setError('Enter a title first')
      return
    }
    
    isUploadingRef.current = true
    setIsUploading(true)
    setError(null)

    let pendingItems: FileItemState[] = []
    setUploads(prev => {
      pendingItems = prev.filter(u => u.status === 'pending')
      return prev
    })
    
    await new Promise(r => setTimeout(r, 50))
    
    if (pendingItems.length === 0) {
      isUploadingRef.current = false
      setIsUploading(false)
      return
    }

    try {
      const formData = new FormData()
      formData.set('title', galleryTitle.trim())
      formData.set('downloadEnabled', 'true')
      
      const galleryResult = await createGallery(formData)
      
      if (galleryResult.error || !galleryResult.galleryId) {
        setError(galleryResult.error || 'Failed to create gallery')
        isUploadingRef.current = false
        setIsUploading(false)
        return
      }

      const galleryId = galleryResult.galleryId

      const urlResponses = await generateSignedUploadUrls({
        galleryId,
        files: pendingItems.map(u => ({
          localId: u.id,
          mimeType: u.file.type,
          fileSize: u.file.size,
          originalFilename: u.file.name
        }))
      })

      setUploads(prev => prev.map(u => {
        const hasUrl = urlResponses.find(r => r.localId === u.id)
        return hasUrl ? { ...u, status: 'uploading' } : u
      }))

      const tasks = urlResponses.map(urlInfo => async () => {
        const item = pendingItems.find(u => u.id === urlInfo.localId)
        if (!item) return { ...urlInfo, success: false }

        return new Promise<{ localId: string; storagePath: string; token: string; success: boolean }>((resolve) => {
          const xhr = new XMLHttpRequest()
          
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setUploads(prev => prev.map(u => 
                u.id === urlInfo.localId ? { ...u, progress: (e.loaded / e.total) * 100 } : u
              ))
            }
          })

          xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploads(prev => prev.map(u => 
                u.id === urlInfo.localId ? { ...u, status: 'completed', progress: 100 } : u
              ))
              resolve({ ...urlInfo, success: true })
            } else {
              setUploads(prev => prev.map(u => 
                u.id === urlInfo.localId ? { ...u, status: 'error', error: `HTTP ${xhr.status}` } : u
              ))
              resolve({ ...urlInfo, success: false })
            }
          })

          xhr.addEventListener('error', () => {
            setUploads(prev => prev.map(u => 
              u.id === urlInfo.localId ? { ...u, status: 'error', error: 'Network Error' } : u
            ))
            resolve({ ...urlInfo, success: false })
          })

          xhr.open('PUT', urlInfo.signedUrl)
          xhr.setRequestHeader('Content-Type', item.file.type)
          xhr.send(item.file)
        })
      })

      const results: any[] = []
      const executing: Promise<any>[] = []

      for (const task of tasks) {
        const p = task().then(res => {
          executing.splice(executing.indexOf(p), 1)
          return res
        })
        results.push(p)
        executing.push(p)

        if (executing.length >= MAX_CONCURRENT_UPLOADS) {
          await Promise.race(executing)
        }
      }

      const allResults = await Promise.all(results)
      const successful = allResults.filter(r => r.success)

      if (successful.length > 0) {
        await confirmUploads({
          galleryId,
          uploads: successful.map(r => {
            const upload = pendingItems.find(u => u.id === r.localId)!
            return {
              storagePath: r.storagePath,
              token: r.token,
              originalFilename: upload.file.name,
              fileSize: upload.file.size,
              mimeType: upload.file.type
            }
          })
        })

        router.push(`/gallery/${galleryId}`)
      }

    } catch (err) {
      console.error('Upload error:', err)
      setError('An error occurred during upload')
    } finally {
      isUploadingRef.current = false
      setIsUploading(false)
    }
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  const hasFiles = uploads.length > 0
  const completedCount = uploads.filter(u => u.status === 'completed').length
  const totalProgress = hasFiles 
    ? uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length 
    : 0

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <DropOverlay isVisible={isDragging} />
      
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-xl">
          {/* Title Input - The Hero */}
          <input
            ref={titleInputRef}
            type="text"
            value={galleryTitle}
            onChange={(e) => setGalleryTitle(e.target.value)}
            placeholder="Untitled"
            className="w-full text-4xl md:text-5xl font-semibold tracking-tight text-center bg-transparent border-none outline-none placeholder:text-gray-200 text-gray-900 mb-12"
          />

          {/* Drop Zone - Minimal */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative cursor-pointer transition-all duration-300 ${
              isDragging ? 'scale-[1.02]' : ''
            }`}
          >
            {!hasFiles ? (
              <div className="border border-gray-200 rounded-xl p-16 text-center hover:border-gray-300 hover:bg-gray-50/50 transition-all">
                <p className="text-gray-400 text-sm">
                  Drop images or <span className="text-gray-600 underline underline-offset-4 decoration-gray-300">browse</span>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Progress Bar */}
                {isUploading && (
                  <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-gray-900"
                      initial={{ width: 0 }}
                      animate={{ width: `${totalProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                )}
                
                {/* Thumbnails Grid */}
                <div className="grid grid-cols-6 md:grid-cols-8 gap-1">
                  {uploads.map((upload) => (
                    <div 
                      key={upload.id}
                      className="relative aspect-square rounded overflow-hidden bg-gray-100"
                    >
                      <img 
                        src={upload.previewUrl} 
                        alt="" 
                        className={`w-full h-full object-cover transition-opacity ${
                          upload.status === 'completed' ? 'opacity-100' : 'opacity-60'
                        }`}
                      />
                      {upload.status === 'uploading' && (
                        <div className="absolute inset-0 bg-white/50" />
                      )}
                      {upload.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20" />
                      )}
                    </div>
                  ))}
                  
                  {/* Add More Button */}
                  <div className="aspect-square rounded border border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:text-gray-400 hover:border-gray-300 transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center justify-between text-xs text-gray-400 pt-2">
                  <span>{uploads.length} images</span>
                  {isUploading && <span>Uploading...</span>}
                  {!isUploading && completedCount === uploads.length && completedCount > 0 && (
                    <span className="text-gray-600">Done</span>
                  )}
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ALLOWED_MIME_TYPES.join(',')}
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center text-red-500 text-sm mt-4"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          {/* Hint */}
          <p className="text-center text-gray-300 text-xs mt-8">
            JPEG, PNG, WEBP • 25MB max
          </p>
        </div>
      </main>
    </div>
  )
}
