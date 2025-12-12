'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, CheckCircle2, ToggleLeft, ToggleRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { generateSignedUploadUrls, confirmUploads, getExistingFilenames } from '@/server/actions/upload.actions'
import { LargeUploadOverlay } from '@/components/upload/LargeUploadOverlay'
import { LARGE_UPLOAD_THRESHOLD } from '@/lib/utils/constants'

interface FileItemState {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'completed' | 'error' | 'duplicate'
  progress: number
  error?: string
  storagePath?: string
  token?: string
  isDuplicate?: boolean
  duplicateAction?: 'overwrite' | 'copy' | 'skip'
}

interface DuplicateFile {
  id: string
  file: File
  preview: string
}

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_CONCURRENT_UPLOADS = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  galleryId: string
  onUploaded?: (imageIds: string[]) => void | Promise<void>
}

export function UploadModal({ isOpen, onClose, galleryId, onUploaded }: UploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isUploadingRef = useRef(false)
  const [existingFilenames, setExistingFilenames] = useState<string[]>([])
  const [duplicates, setDuplicates] = useState<DuplicateFile[]>([])
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false)
  const [autoRedirect, setAutoRedirect] = useState(true)
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null)

  // Auto-upload when files are added
  useEffect(() => {
    const pendingCount = uploads.filter(u => u.status === 'pending').length
    if (pendingCount > 0 && !isUploadingRef.current) {
      processQueue()
    }
  }, [uploads])

  // Fetch existing filenames when modal opens
  useEffect(() => {
    if (isOpen) {
      getExistingFilenames(galleryId)
        .then(setExistingFilenames)
        .catch(console.error)
    }
  }, [isOpen, galleryId])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploads([])
      setIsDragging(false)
      setDuplicates([])
      setShowDuplicateDialog(false)
    }
  }, [isOpen])

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const newUploads: FileItemState[] = []
    const newDuplicates: DuplicateFile[] = []

    // Sort files naturally (so img-2 comes before img-10)
    const sortedFiles = Array.from(fileList).sort((a, b) => 
      a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
    )

    for (const file of sortedFiles) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > MAX_FILE_SIZE) continue

      const id = `${file.name}-${Date.now()}-${Math.random()}`
      const preview = URL.createObjectURL(file)
      
      // Check if this file already exists in the gallery
      if (existingFilenames.includes(file.name)) {
        newDuplicates.push({ id, file, preview })
      } else {
        newUploads.push({
          id,
          file,
          preview,
          status: 'pending',
          progress: 0,
        })
      }
    }

    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads])
    }
    
    if (newDuplicates.length > 0) {
      setDuplicates(newDuplicates)
      setShowDuplicateDialog(true)
    }
  }, [existingFilenames])

  const processQueue = async () => {
    if (isUploadingRef.current) return
    
    isUploadingRef.current = true
    setIsUploading(true)
    setUploadStartTime(Date.now())

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
      const urlResponses = await generateSignedUploadUrls({
        galleryId,
        files: pendingItems.map(u => ({
          localId: u.id,
          originalFilename: u.file.name,
          mimeType: u.file.type,
          fileSize: u.file.size,
        })),
      })

      const urlMap = new Map(urlResponses.map(u => [u.localId, u]))

      setUploads(prev =>
        prev.map(u => {
          const urlInfo = urlMap.get(u.id)
          return urlInfo 
            ? { ...u, status: 'uploading' as const, storagePath: urlInfo.storagePath, token: urlInfo.token } 
            : u
        })
      )

      const uploadFile = async (item: FileItemState): Promise<void> => {
        const urlInfo = urlMap.get(item.id)
        if (!urlInfo) return

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhr.open('PUT', urlInfo.signedUrl, true)
          xhr.setRequestHeader('Content-Type', item.file.type)

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100)
              setUploads(prev =>
                prev.map(u => (u.id === item.id ? { ...u, progress: percent } : u))
              )
            }
          }

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setUploads(prev =>
                prev.map(u =>
                  u.id === item.id ? { ...u, status: 'completed', progress: 100 } : u
                )
              )
              resolve()
            } else {
              setUploads(prev =>
                prev.map(u =>
                  u.id === item.id ? { ...u, status: 'error', error: 'Upload failed' } : u
                )
              )
              reject(new Error('Upload failed'))
            }
          }

          xhr.onerror = () => {
            setUploads(prev =>
              prev.map(u =>
                u.id === item.id ? { ...u, status: 'error', error: 'Network error' } : u
              )
            )
            reject(new Error('Network error'))
          }

          xhr.send(item.file)
        })
      }

      // Process with concurrency limit
      const queue = [...pendingItems]
      const executing: Promise<void>[] = []

      while (queue.length > 0 || executing.length > 0) {
        while (executing.length < MAX_CONCURRENT_UPLOADS && queue.length > 0) {
          const item = queue.shift()!
          const promise = uploadFile(item).finally(() => {
            executing.splice(executing.indexOf(promise), 1)
          })
          executing.push(promise)
        }
        if (executing.length > 0) {
          await Promise.race(executing)
        }
      }

      // Confirm uploads in database - sort by original order to preserve upload sequence
      let completedUploads: FileItemState[] = []
      setUploads(prev => {
        completedUploads = prev.filter(u => u.status === 'completed' && u.storagePath && u.token)
        return prev
      })
      await new Promise(r => setTimeout(r, 50))

      if (completedUploads.length > 0) {
        // Create a map of id -> original index from pendingItems for sorting
        const orderMap = new Map(pendingItems.map((item, idx) => [item.id, idx]))
        
        // Sort completed uploads back to original order
        const sortedCompleted = [...completedUploads].sort((a, b) => {
          const orderA = orderMap.get(a.id) ?? 0
          const orderB = orderMap.get(b.id) ?? 0
          return orderA - orderB
        })
        
        const { imageIds } = await confirmUploads({
          galleryId,
          uploads: sortedCompleted.map(u => ({
            storagePath: u.storagePath!,
            token: u.token!,
            originalFilename: u.file.name,
            fileSize: u.file.size,
            mimeType: u.file.type,
          })),
        })

        if (imageIds.length > 0) {
          await onUploaded?.(imageIds)
        }
      }

      router.refresh()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      isUploadingRef.current = false
      setIsUploading(false)
    }
  }

  // Handle duplicate file actions
  const handleDuplicateAction = useCallback((action: 'overwrite' | 'copy' | 'skip') => {
    if (action === 'skip') {
      // Just dismiss - don't upload duplicates
      duplicates.forEach(d => URL.revokeObjectURL(d.preview))
      setDuplicates([])
      setShowDuplicateDialog(false)
      return
    }

    // Add duplicates to upload queue with appropriate handling
    const newUploads: FileItemState[] = duplicates.map(d => {
      let fileName = d.file.name
      
      if (action === 'copy') {
        // Add (copy) suffix before extension
        const lastDot = fileName.lastIndexOf('.')
        if (lastDot > 0) {
          const name = fileName.substring(0, lastDot)
          const ext = fileName.substring(lastDot)
          fileName = `${name} (copy)${ext}`
        } else {
          fileName = `${fileName} (copy)`
        }
        
        // Create new file with modified name
        const newFile = new File([d.file], fileName, { type: d.file.type })
        return {
          id: d.id,
          file: newFile,
          preview: d.preview,
          status: 'pending' as const,
          progress: 0,
          isDuplicate: true,
          duplicateAction: action,
        }
      }
      
      // Overwrite - use same filename, existing will be replaced
      return {
        id: d.id,
        file: d.file,
        preview: d.preview,
        status: 'pending' as const,
        progress: 0,
        isDuplicate: true,
        duplicateAction: action,
      }
    })

    setUploads(prev => [...prev, ...newUploads])
    setDuplicates([])
    setShowDuplicateDialog(false)
  }, [duplicates])

  const completedCount = uploads.filter(u => u.status === 'completed').length
  const allComplete = uploads.length > 0 && completedCount === uploads.length
  const showLargeUploadOverlay = uploads.length >= LARGE_UPLOAD_THRESHOLD && isUploading
  
  // Calculate estimated time remaining
  const estimatedMinutes = (() => {
    if (!uploadStartTime || completedCount === 0) return 0
    const elapsed = (Date.now() - uploadStartTime) / 1000 / 60 // minutes
    const rate = completedCount / elapsed // files per minute
    const remaining = uploads.length - completedCount
    return Math.ceil(remaining / rate)
  })()
  
  // Auto-redirect when complete
  useEffect(() => {
    if (allComplete && autoRedirect) {
      const timer = setTimeout(() => {
        onClose()
      }, 1000) // Brief delay to show completion
      return () => clearTimeout(timer)
    }
  }, [allComplete, autoRedirect, onClose])

  const totalProgress = uploads.length > 0 
    ? uploads.reduce((acc, u) => acc + u.progress, 0) / uploads.length 
    : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
          onClick={(e) => e.target === e.currentTarget && !isUploading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="relative bg-white rounded-2xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)' }}
          >
            {/* Header - Minimal */}
            <div className="flex items-center justify-between px-5 py-4">
              <h2 className="text-base font-medium text-gray-900">Add Images</h2>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="p-1.5 -mr-1.5 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 pb-5">
              {/* Drop Zone - Clean */}
              <div
                className={`relative border rounded-xl transition-all cursor-pointer ${
                  isDragging
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragging(false)
                  handleFiles(e.dataTransfer.files)
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(',')}
                  multiple
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <p className="text-sm text-gray-500">
                    Drop images or <span className="text-gray-900 underline underline-offset-4 decoration-gray-300">browse</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-2">
                    JPEG, PNG, WEBP
                  </p>
                </div>
              </div>

              {/* Upload List - Minimal */}
              {uploads.length > 0 && (
                <div className="mt-4 space-y-1">
                  {/* Global Progress Bar */}
                  {isUploading && (
                    <div className="h-0.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <motion.div 
                        className="h-full bg-gray-900"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalProgress}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  )}
                  
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {uploads.map((upload) => (
                      <div
                        key={upload.id}
                        className="flex items-center gap-3 py-2"
                      >
                        <img
                          src={upload.preview}
                          alt=""
                          className={`w-9 h-9 rounded-lg object-cover transition-opacity ${
                            upload.status === 'completed' ? 'opacity-100' : 'opacity-60'
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700 truncate">{upload.file.name}</p>
                          <p className="text-xs text-gray-400">
                            {upload.status === 'completed' 
                              ? 'Done' 
                              : upload.status === 'error' 
                              ? 'Failed' 
                              : `${Math.round(upload.progress)}%`
                            }
                          </p>
                        </div>
                        {upload.status === 'completed' && (
                          <div className="w-5 h-5 rounded-full bg-gray-900 flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer - Clean */}
            {uploads.length > 0 && (
              <div className="px-5 py-4 border-t border-gray-100 space-y-3">
                {/* Auto-redirect toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Auto-close when done</span>
                  <button
                    onClick={() => setAutoRedirect(!autoRedirect)}
                    className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    {autoRedirect ? (
                      <ToggleRight className="w-6 h-6 text-gray-900" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-gray-400" />
                    )}
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {completedCount} of {uploads.length} uploaded
                  </span>
                  {allComplete ? (
                    autoRedirect ? (
                      <span className="text-xs text-green-600 font-medium">Redirecting...</span>
                    ) : (
                      <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                      >
                        Done
                      </button>
                    )
                  ) : isUploading ? (
                    <span className="text-xs text-gray-500">
                      Uploading...
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </motion.div>

          {/* Duplicate Files Dialog */}
          <AnimatePresence>
            {showDuplicateDialog && duplicates.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  className="bg-white rounded-xl p-5 mx-4 max-w-sm w-full shadow-2xl"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {duplicates.length === 1 ? 'Duplicate file found' : `${duplicates.length} duplicate files found`}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        {duplicates.length === 1 
                          ? `"${duplicates[0].file.name}" already exists in this gallery.`
                          : 'These files already exist in this gallery.'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Preview duplicates */}
                  {duplicates.length <= 3 && (
                    <div className="flex gap-2 mb-4">
                      {duplicates.map(d => (
                        <div key={d.id} className="relative">
                          <img 
                            src={d.preview} 
                            alt={d.file.name}
                            className="w-14 h-14 rounded-lg object-cover border border-gray-200"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-2">
                    <button
                      onClick={() => handleDuplicateAction('overwrite')}
                      className="w-full px-4 py-2.5 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Overwrite existing
                    </button>
                    <button
                      onClick={() => handleDuplicateAction('copy')}
                      className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      Keep both (add copy)
                    </button>
                    <button
                      onClick={() => handleDuplicateAction('skip')}
                      className="w-full px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
      
      {/* Large Upload Overlay */}
      <LargeUploadOverlay
        isVisible={showLargeUploadOverlay}
        totalFiles={uploads.length}
        completedFiles={completedCount}
        totalProgress={totalProgress}
        estimatedMinutes={estimatedMinutes}
      />
    </AnimatePresence>
  )
}
