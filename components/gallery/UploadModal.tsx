'use client'

import { useCallback, useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, Upload, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'

interface FileItemState {
  id: string
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
  storagePath?: string
  token?: string
}

const MAX_FILE_SIZE = 25 * 1024 * 1024
const MAX_CONCURRENT_UPLOADS = 3
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

interface UploadModalProps {
  isOpen: boolean
  onClose: () => void
  galleryId: string
}

export function UploadModal({ isOpen, onClose, galleryId }: UploadModalProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<FileItemState[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const isUploadingRef = useRef(false)

  // Auto-upload when files are added
  useEffect(() => {
    const pendingCount = uploads.filter(u => u.status === 'pending').length
    if (pendingCount > 0 && !isUploadingRef.current) {
      processQueue()
    }
  }, [uploads])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setUploads([])
      setIsDragging(false)
    }
  }, [isOpen])

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const newUploads: FileItemState[] = []

    for (const file of Array.from(fileList)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue
      if (file.size > MAX_FILE_SIZE) continue

      const id = `${file.name}-${Date.now()}-${Math.random()}`
      newUploads.push({
        id,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
        progress: 0,
      })
    }

    if (newUploads.length > 0) {
      setUploads(prev => [...prev, ...newUploads])
    }
  }, [])

  const processQueue = async () => {
    if (isUploadingRef.current) return
    
    isUploadingRef.current = true
    setIsUploading(true)

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

      // Confirm uploads in database
      let completedUploads: FileItemState[] = []
      setUploads(prev => {
        completedUploads = prev.filter(u => u.status === 'completed' && u.storagePath && u.token)
        return prev
      })
      await new Promise(r => setTimeout(r, 50))

      if (completedUploads.length > 0) {
        await confirmUploads({
          galleryId,
          uploads: completedUploads.map(u => ({
            storagePath: u.storagePath!,
            token: u.token!,
            originalFilename: u.file.name,
            fileSize: u.file.size,
            mimeType: u.file.type,
          })),
        })
      }

      router.refresh()
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      isUploadingRef.current = false
      setIsUploading(false)
    }
  }

  const completedCount = uploads.filter(u => u.status === 'completed').length
  const allComplete = uploads.length > 0 && completedCount === uploads.length

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
            className="bg-white rounded-2xl w-full max-w-md overflow-hidden"
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
                  <p className="text-xs text-gray-300 mt-2">
                    JPEG, PNG, WEBP • 25MB max
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
              <div className="px-5 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {completedCount} of {uploads.length} uploaded
                  </span>
                  {allComplete ? (
                    <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      Done
                    </button>
                  ) : isUploading ? (
                    <span className="text-xs text-gray-500">
                      Uploading...
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
