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
    setIsUploading(true)
    
    // Clone queue to avoid closure staleness, but we use functional state updates
    // We need to process chunks of MAX_CONCURRENT_UPLOADS
    
    // Helper to upload a single file
    const uploadSingle = async (item: FileItemState) => {
      try {
        // 1. Get signed URL (we should batch this really, but for simplicity in concurrency loop doing one by one or we can batch first)
        // Actually, let's batch-get URLs for all pending first as existing logic does
        
        // Wait, to properly implement throttling, we should queue the actual XHRs.
        // Reusing logic from ImageUploader but adapting for queue.
        
        // Since existing ImageUploader does batch signed URL fetching, let's stick to that for efficiency,
        // then limit concurrent XHRs.
        return; // This is just a placeholder declaration
      } catch (e) {
        console.error(e)
      }
    }

    // Current pending items
    const pendingItems = uploads.filter(u => u.status === 'pending')
    if (pendingItems.length === 0) {
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
        className="flex-none mb-6"
      >
        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => fileInputRef.current?.click()}
          className="relative overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-8 text-center cursor-pointer transition-colors hover:border-indigo-400 hover:bg-indigo-50 group"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Plus className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Drop images or browse
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                JPEG, PNG, WEBP • MAX 25MB
              </p>
            </div>
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

      {/* Action Bar */}
      <div className="flex-none pt-4 mt-4 border-t border-gray-100">
        <Button
          size="lg"
          className="w-full rounded-xl h-12 text-base font-medium shadow-lg shadow-indigo-500/20 bg-gray-900 hover:bg-gray-800 text-white transition-all"
          onClick={processQueue}
          disabled={isUploading || uploads.filter(u => u.status === 'pending').length === 0}
        >
          {isUploading ? 'Uploading...' : 'Start Upload'}
        </Button>
      </div>
    </div>
  )
}
