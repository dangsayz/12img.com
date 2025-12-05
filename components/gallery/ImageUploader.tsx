'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, X, CheckCircle, AlertCircle } from 'lucide-react'
import { generateSignedUploadUrls, confirmUploads } from '@/server/actions/upload.actions'
import { Button } from '@/components/ui/button'
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE } from '@/lib/utils/constants'

interface UploadItem {
  localId: string
  file: File
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  progress: number
  error?: string
}

interface ImageUploaderProps {
  galleryId: string
}

export function ImageUploader({ galleryId }: ImageUploaderProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState<UploadItem[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type as typeof ALLOWED_MIME_TYPES[number])) {
      return `Invalid file type: ${file.type}`
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 25MB)`
    }
    return null
  }

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return

    const newUploads: UploadItem[] = []
    Array.from(files).forEach((file, i) => {
      const error = validateFile(file)
      newUploads.push({
        localId: `upload-${Date.now()}-${i}`,
        file,
        status: error ? 'error' : 'pending',
        progress: 0,
        error: error || undefined,
      })
    })

    setUploads((prev) => [...prev, ...newUploads])
  }, [])

  const uploadFile = async (
    file: File,
    signedUrl: string,
    onProgress: (percent: number) => void
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`Upload failed: ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error')))
      xhr.open('PUT', signedUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })
  }

  const handleUpload = async () => {
    const pendingUploads = uploads.filter((u) => u.status === 'pending')
    if (pendingUploads.length === 0) return

    setIsUploading(true)

    try {
      // Get signed URLs
      const urlResponses = await generateSignedUploadUrls({
        galleryId,
        files: pendingUploads.map((u) => ({
          localId: u.localId,
          mimeType: u.file.type,
          fileSize: u.file.size,
          originalFilename: u.file.name,
        })),
      })

      // Upload files (3 at a time)
      const uploadPromises: Promise<{
        localId: string
        storagePath: string
        token: string
        success: boolean
      }>[] = []

      for (const urlInfo of urlResponses) {
        const upload = pendingUploads.find((u) => u.localId === urlInfo.localId)
        if (!upload) continue

        setUploads((prev) =>
          prev.map((u) =>
            u.localId === urlInfo.localId ? { ...u, status: 'uploading' } : u
          )
        )

        const promise = uploadFile(upload.file, urlInfo.signedUrl, (progress) => {
          setUploads((prev) =>
            prev.map((u) =>
              u.localId === urlInfo.localId ? { ...u, progress } : u
            )
          )
        })
          .then(() => {
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === urlInfo.localId
                  ? { ...u, status: 'uploaded', progress: 100 }
                  : u
              )
            )
            return { ...urlInfo, success: true }
          })
          .catch((err) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.localId === urlInfo.localId
                  ? { ...u, status: 'error', error: err.message }
                  : u
              )
            )
            return { ...urlInfo, success: false }
          })

        uploadPromises.push(promise)
      }

      const results = await Promise.all(uploadPromises)
      const successful = results.filter((r) => r.success)

      // Confirm uploads
      if (successful.length > 0) {
        await confirmUploads({
          galleryId,
          uploads: successful.map((r) => {
            const upload = pendingUploads.find((u) => u.localId === r.localId)!
            return {
              storagePath: r.storagePath,
              token: r.token,
              originalFilename: upload.file.name,
              fileSize: upload.file.size,
              mimeType: upload.file.type,
            }
          }),
        })

        router.refresh()
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setIsUploading(false)
    }
  }

  const removeUpload = (localId: string) => {
    setUploads((prev) => prev.filter((u) => u.localId !== localId))
  }

  const clearCompleted = () => {
    setUploads((prev) => prev.filter((u) => u.status !== 'uploaded'))
  }

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <div
        className="group relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-indigo-500 hover:bg-indigo-50/30 transition-all duration-300 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50/30')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/30')
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50/30')
          handleFileSelect(e.dataTransfer.files)
        }}
      >
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-50/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
            <Upload className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Upload Images</h3>
          <p className="text-gray-500 mt-1 mb-2">
            Drag & drop or click to browse
          </p>
          <p className="text-xs text-gray-400 uppercase tracking-wide">
            JPEG, PNG, WebP • Max 25MB
          </p>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              {uploads.length} {uploads.length === 1 ? 'file' : 'files'} selected
            </span>
            <div className="flex gap-2">
              {uploads.some((u) => u.status === 'uploaded') && (
                <Button variant="ghost" size="sm" onClick={clearCompleted} className="text-xs h-8">
                  Clear Completed
                </Button>
              )}
            </div>
          </div>
          
          <div className="max-h-[300px] overflow-y-auto p-2 space-y-1">
            {uploads.map((upload) => (
              <div
                key={upload.localId}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
              >
                <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {upload.status === 'uploaded' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : upload.status === 'error' ? (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  ) : (
                    <div className="text-xs font-medium text-gray-500">IMG</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-700 truncate max-w-[200px]">
                      {upload.file.name}
                    </p>
                    <span className="text-xs text-gray-400 tabular-nums">
                      {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                    </span>
                  </div>
                  
                  {upload.status === 'uploading' ? (
                    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${upload.progress}%` }}
                      />
                    </div>
                  ) : upload.status === 'error' ? (
                    <p className="text-xs text-red-500 truncate">{upload.error}</p>
                  ) : upload.status === 'uploaded' ? (
                    <p className="text-xs text-green-600">Complete</p>
                  ) : (
                    <p className="text-xs text-gray-400">Ready to upload</p>
                  )}
                </div>

                {(upload.status === 'pending' || upload.status === 'error') && (
                  <button
                    onClick={() => removeUpload(upload.localId)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50/30">
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploads.filter((u) => u.status === 'pending').length === 0}
              className="w-full rounded-xl shadow-indigo-500/20 shadow-lg"
            >
              {isUploading ? 'Uploading...' : 'Start Upload'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
