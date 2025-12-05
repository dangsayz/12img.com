'use client'

import { useState, useCallback, useRef, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'
import { createGallery } from '@/server/actions/gallery.actions'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS } from '@/lib/utils/constants'
import { Header } from '@/components/layout/Header'
import { DropOverlay } from '@/components/upload/DropOverlay'
import { FileStagingList } from '@/components/upload/FileStagingList'
import { FileItemState } from '@/components/upload/FileItem'
import { Input } from '@/components/ui/input'

export default function UploadPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [galleryTitle, setGalleryTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const isUploadingRef = useRef(false)
  const [isPending, startTransition] = useTransition()

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
    if (!ALLOWED_MIME_TYPES.includes(file.type as any)) {
      return `Invalid file type`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large`
    }
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
    
    // Auto-generate title if empty
    if (!galleryTitle.trim() && newUploads.length > 0) {
      const today = new Date()
      const defaultTitle = `Gallery ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
      setGalleryTitle(defaultTitle)
    }
  }, [galleryTitle])

  const processQueue = async () => {
    if (isUploadingRef.current) return
    if (!galleryTitle.trim()) {
      setError('Please enter a gallery title')
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
      // 1. Create gallery first
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

      // 2. Get signed URLs
      const urlResponses = await generateSignedUploadUrls({
        galleryId,
        files: pendingItems.map(u => ({
          localId: u.id,
          mimeType: u.file.type,
          fileSize: u.file.size,
          originalFilename: u.file.name
        }))
      })

      // 3. Mark as uploading
      setUploads(prev => prev.map(u => {
        const hasUrl = urlResponses.find(r => r.localId === u.id)
        return hasUrl ? { ...u, status: 'uploading' } : u
      }))

      // 4. Upload files with XHR for progress tracking
      const tasks = urlResponses.map(urlInfo => async () => {
        const item = pendingItems.find(u => u.id === urlInfo.localId)
        if (!item) return { ...urlInfo, success: false }

        return new Promise<{
          localId: string
          storagePath: string
          token: string
          success: boolean
        }>((resolve) => {
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

      // 5. Execute with concurrency limit
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

      // 6. Confirm uploads
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

        // 7. Redirect to the new gallery
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
  const allComplete = hasFiles && completedCount === uploads.length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header />
      <DropOverlay isVisible={isDragging} />
      
      <main className="container mx-auto px-4 pt-28 pb-20 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-700 shadow-lg mb-6">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mb-3">
            Create Your Gallery
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Drop your images below and we'll create a beautiful, shareable gallery for you.
          </p>
        </motion.div>

        {/* Title Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Input
            value={galleryTitle}
            onChange={(e) => setGalleryTitle(e.target.value)}
            placeholder="Gallery title (e.g., Summer Wedding 2024)"
            className="h-14 px-6 text-lg font-medium rounded-2xl border-gray-200 bg-white focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 text-center"
          />
        </motion.div>

        {/* Upload Zone */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden"
        >
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`relative p-12 transition-all duration-300 cursor-pointer group ${
              hasFiles ? 'pb-6' : ''
            }`}
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 transition-all duration-200 group-hover:border-gray-300 group-hover:bg-gray-50 ${
                hasFiles ? 'p-8' : 'p-16'
              }`}
            >
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-14 w-14 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
                  <Plus className="w-7 h-7 text-gray-400 group-hover:text-gray-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {hasFiles ? 'Add more images' : 'Drop images here'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    or <span className="text-gray-700 underline underline-offset-2">browse files</span>
                  </p>
                </div>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  JPEG, PNG, WEBP • MAX 25MB
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

          {/* File Staging List */}
          <AnimatePresence>
            {hasFiles && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-8 pb-8"
              >
                <div className="border-t border-gray-100 pt-6">
                  <FileStagingList 
                    files={uploads} 
                    onRemove={removeUpload} 
                  />
                </div>

                {/* Status / Action Bar */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                  <span className="text-sm text-gray-500 font-medium">
                    {completedCount} of {uploads.length} uploaded
                  </span>
                  
                  {isUploading ? (
                    <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                      Uploading...
                    </span>
                  ) : allComplete ? (
                    <span className="text-sm text-emerald-600 font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Redirecting...
                    </span>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Error Message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm font-medium text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
