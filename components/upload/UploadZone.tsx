'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Plus } from 'lucide-react'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'
import { Button } from '@/components/ui/button'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE, MAX_CONCURRENT_UPLOADS, SIGNED_URL_BATCH_SIZE, LARGE_UPLOAD_THRESHOLD } from '@/lib/utils/constants'
import { DropOverlay } from './DropOverlay'
import { FileStagingList } from './FileStagingList'
import { FileItemState } from './FileItem'
import { LargeUploadOverlay } from './LargeUploadOverlay'
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
  const [overlayMinimized, setOverlayMinimized] = useState(false)
  const isUploadingRef = useRef(false)
  const uploadStartTime = useRef<number>(0)
  const uploadsRef = useRef<FileItemState[]>([])
  
  // Keep ref in sync with state for reliable access in async functions
  useEffect(() => {
    uploadsRef.current = uploads
  }, [uploads])

  // Calculate progress for large upload overlay
  const totalFiles = uploads.length
  const completedFiles = uploads.filter(u => u.status === 'completed').length
  const totalProgress = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
  const showLargeUploadOverlay = isUploading && totalFiles >= LARGE_UPLOAD_THRESHOLD && !overlayMinimized
  
  // Estimate remaining time based on upload speed
  const estimatedMinutes = (() => {
    if (!isUploading || completedFiles === 0) return 0
    const elapsed = (Date.now() - uploadStartTime.current) / 1000 / 60 // minutes
    const rate = completedFiles / elapsed // files per minute
    const remaining = totalFiles - completedFiles
    return Math.ceil(remaining / rate)
  })()

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

    // Sort files naturally (so img-2 comes before img-10) then process in chunks
    const files = Array.from(fileList).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )
    const CHUNK_SIZE = 100
    
    const processChunk = (startIndex: number) => {
      const chunk = files.slice(startIndex, startIndex + CHUNK_SIZE)
      const newUploads: FileItemState[] = chunk.map((file) => {
        const error = validateFile(file)
        return {
          id: `up-${Date.now()}-${Math.random().toString(36).slice(2)}-${startIndex}`,
          file,
          // Lazy preview - only create for first 20 files to save memory
          previewUrl: startIndex < 20 ? URL.createObjectURL(file) : undefined,
          status: error ? 'error' : 'pending' as const,
          progress: 0,
          error: error || undefined,
        }
      })

      setUploads((prev) => [...prev, ...newUploads])
      
      // Process next chunk after a small delay to keep UI responsive
      if (startIndex + CHUNK_SIZE < files.length) {
        setTimeout(() => processChunk(startIndex + CHUNK_SIZE), 10)
      }
    }
    
    processChunk(0)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  // Upload Logic with Concurrency Control and Batched Signed URLs
  const processQueue = async () => {
    if (isUploadingRef.current) return
    
    isUploadingRef.current = true
    setIsUploading(true)
    setOverlayMinimized(false) // Reset overlay when starting new upload
    uploadStartTime.current = Date.now() // Track start time for estimates

    // Wait a bit for chunked file additions to complete (for large drops)
    await new Promise(r => setTimeout(r, 100))
    
    // Get pending items directly from ref (reliable in async context)
    const pendingItems = uploadsRef.current.filter(u => u.status === 'pending')
    
    if (pendingItems.length === 0) {
      isUploadingRef.current = false
      setIsUploading(false)
      return
    }

    try {
      // Process in batches to avoid server timeout
      const allSuccessful: any[] = []
      
      for (let i = 0; i < pendingItems.length; i += SIGNED_URL_BATCH_SIZE) {
        const batch = pendingItems.slice(i, i + SIGNED_URL_BATCH_SIZE)
        
        // 1. Get Signed URLs for this batch
        const urlResponses = await generateSignedUploadUrls({
          galleryId,
          files: batch.map(u => ({
            localId: u.id,
            mimeType: u.file.type,
            fileSize: u.file.size,
            originalFilename: u.file.name
          }))
        })

        // 2. Mark batch as uploading
        setUploads(prev => prev.map(u => {
          const hasUrl = urlResponses.find(r => r.localId === u.id)
          return hasUrl ? { ...u, status: 'uploading' } : u
        }))

        // 3. Create upload tasks for this batch
        const tasks = urlResponses.map(urlInfo => async () => {
          const item = batch.find(u => u.id === urlInfo.localId)
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

        // 4. Execute batch with concurrency limit
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

        const batchResults = await Promise.all(results)
        const successful = batchResults.filter(r => r.success)
        
        // 5. Confirm this batch immediately - sort by original order to preserve upload sequence
        if (successful.length > 0) {
          // Create a map of localId -> batch index for sorting
          const batchOrderMap = new Map(batch.map((item, idx) => [item.id, idx]))
          
          // Sort successful uploads back to original batch order
          const sortedSuccessful = [...successful].sort((a, b) => {
            const orderA = batchOrderMap.get(a.localId) ?? 0
            const orderB = batchOrderMap.get(b.localId) ?? 0
            return orderA - orderB
          })
          
          await confirmUploads({
            galleryId,
            uploads: sortedSuccessful.map(r => {
               const upload = batch.find(u => u.id === r.localId)!
               return {
                 storagePath: r.storagePath,
                 token: r.token,
                 originalFilename: upload.file.name,
                 fileSize: upload.file.size,
                 mimeType: upload.file.type
               }
            })
          })
          allSuccessful.push(...successful)
        }
      }
      
      // Final refresh after all batches
      if (allSuccessful.length > 0) {
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
      
      {/* Large Upload Experience - Coffee Break Overlay */}
      <LargeUploadOverlay
        isVisible={showLargeUploadOverlay}
        totalFiles={totalFiles}
        completedFiles={completedFiles}
        totalProgress={totalProgress}
        estimatedMinutes={estimatedMinutes}
        onMinimize={() => setOverlayMinimized(true)}
      />
      
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
            <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Plus className="w-6 h-6 text-stone-400 group-hover:text-stone-600" />
            </div>
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-serif text-stone-900">
                Drag images here to upload
              </h3>
              <p className="text-sm text-stone-500">
                or <span className="underline decoration-stone-300 hover:text-stone-800 decoration-1 underline-offset-2 transition-colors">browse files</span>
              </p>
            </div>
            <p className="text-[10px] text-stone-400 uppercase tracking-[0.15em] mt-2">
              JPEG, PNG, WEBP
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
