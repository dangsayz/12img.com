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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && !isUploading && onClose()}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900">Add Images</h2>
              <button
                onClick={onClose}
                disabled={isUploading}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-xl transition-all ${
                  isDragging
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50/50'
                }`}
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
                
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                    <Upload className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag images here to upload
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    or browse files
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    JPEG, PNG, WEBP • MAX 25MB
                  </p>
                </div>
              </div>

              {/* Upload Progress */}
              {uploads.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                  {uploads.map((upload) => (
                    <div
                      key={upload.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-gray-50"
                    >
                      <img
                        src={upload.preview}
                        alt=""
                        className="w-10 h-10 rounded object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{upload.file.name}</p>
                        <div className="h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              upload.status === 'completed'
                                ? 'bg-emerald-500'
                                : upload.status === 'error'
                                ? 'bg-red-500'
                                : 'bg-indigo-500'
                            }`}
                            style={{ width: `${upload.progress}%` }}
                          />
                        </div>
                      </div>
                      {upload.status === 'completed' && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {uploads.length > 0
                    ? `${completedCount} of ${uploads.length} uploaded`
                    : 'No files selected'}
                </span>
                {allComplete ? (
                  <Button
                    onClick={onClose}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    Done
                  </Button>
                ) : isUploading ? (
                  <span className="text-sm text-gray-600 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    Uploading...
                  </span>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
