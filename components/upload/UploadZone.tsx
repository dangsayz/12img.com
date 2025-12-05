'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus } from 'lucide-react'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'
import { Button } from '@/components/ui/button'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS } from '@/lib/utils/constants'
import { DropOverlay } from './DropOverlay'
import { FileStagingList } from './FileStagingList'
import { FileItemState } from './FileItem'
import { motion } from 'framer-motion'

interface UploadZoneProps {
  galleryId: string
  onUploadComplete: () => void
}

export function UploadZone({ galleryId, onUploadComplete }: UploadZoneProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isUploadingRef = useRef(false)

  // Auto-upload: Start uploading when new pending files are added
  useEffect(() => {
    const pendingCount = uploads.filter(u => u.status === 'pending').length
    if (pendingCount > 0 && !isUploadingRef.current) {
      processQueue()
    }
  }, [uploads])

  // Global drag event listeners for "Predictive Drop Zone Expansion"
  useEffect(() => {
    const handleWindowDragEnter = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true)
      }
    }

    const handleWindowDragLeave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.relatedTarget === null) {
        setIsDragging(false)
      }
    }

    const handleWindowDrop = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
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
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Upload Logic with Concurrency Control
  const processQueue = async () => {
    if (isUploadingRef.current) return
    
    isUploadingRef.current = true
    setIsUploading(true)

    // Get current pending items from state
    let pendingItems: FileItemState[] = []
    setUploads(prev => {
      pendingItems = prev.filter(u => u.status === 'pending')
      return prev
    })
    
    // Small delay to ensure state is captured
    await new Promise(r => setTimeout(r, 50))
    
    if (pendingItems.length === 0) {
      isUploadingRef.current = false
      setIsUploading(false)
      return
    }

    try {
      // 1. Get Signed URLs for ALL pending items
      const urlResponses = await generateSignedUploadUrls({
        galleryId,
        files: pendingItems.map(u => ({
          localId: u.id,
          mimeType: u.file.type,
          fileSize: u.file.size,
          originalFilename: u.file.name
        }))
      })

      // 2. Mark as uploading
      setUploads(prev => prev.map(u => {
        const hasUrl = urlResponses.find(r => r.localId === u.id)
        return hasUrl ? { ...u, status: 'uploading' } : u
      }))

      // 3. Create upload tasks
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

      // 4. Execute with concurrency limit
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

      // 5. Confirm uploads
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
        router.refresh()
        onUploadComplete()
      }

    } catch (err) {
      console.error('Batch upload error:', err)
    } finally {
      isUploadingRef.current = false
      setIsUploading(false)
    }
  }

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="h-full flex flex-col">
      <DropOverlay isVisible={isDragging} />
      
      {/* Drop Target */}
      <div 
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className={`flex-none mb-6 transition-all duration-300 ${uploads.length === 0 ? 'flex-1 flex flex-col' : ''}`}
      >
        <motion.div
          whileHover={{ borderColor: 'rgba(15,23,42,0.35)', backgroundColor: '#F8FAFC' }}
          whileTap={{ scale: 0.995 }}
          onClick={() => fileInputRef.current?.click()}
          className={`relative overflow-hidden rounded-2xl border border-dashed border-gray-200 bg-white text-center cursor-pointer transition-all duration-200 group flex flex-col items-center justify-center ${uploads.length === 0 ? 'flex-1 min-h-[320px]' : 'p-10 min-h-[220px]'}`}
        >
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Plus className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-gray-900">
                Drag images here to upload
              </h3>
              <p className="text-sm text-gray-500">
                or <span className="underline decoration-gray-300 hover:text-gray-800 decoration-1 underline-offset-2 transition-colors">browse files</span>
              </p>
            </div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-2">
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

      {/* Staging List */}
      <div className="flex-1 min-h-0">
        <FileStagingList 
          files={uploads} 
          onRemove={removeUpload} 
        />
      </div>

      {/* Status Bar */}
      {uploads.length > 0 && (
        <div className="flex-none pt-4 mt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 font-medium">
              {uploads.filter(u => u.status === 'completed').length} of {uploads.length} uploaded
            </span>
            {isUploading ? (
              <span className="text-sm text-gray-600 font-medium flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                Uploading...
              </span>
            ) : uploads.filter(u => u.status === 'pending').length > 0 ? (
              <Button
                size="sm"
                variant="ghost"
                className="text-sm text-gray-600 hover:text-gray-900"
                onClick={processQueue}
              >
                Retry
              </Button>
            ) : (
              <span className="text-sm text-emerald-600 font-medium">
                ✓ Complete
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
