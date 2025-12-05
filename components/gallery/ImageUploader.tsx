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
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          e.currentTarget.classList.add('border-black')
        }}
        onDragLeave={(e) => {
          e.currentTarget.classList.remove('border-black')
        }}
        onDrop={(e) => {
          e.preventDefault()
          e.currentTarget.classList.remove('border-black')
          handleFileSelect(e.dataTransfer.files)
        }}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-gray-600">
          Drop images here or click to select
        </p>
        <p className="text-sm text-gray-400 mt-1">
          JPEG, PNG, WebP, GIF up to 25MB
        </p>
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
        <div className="space-y-2">
          {uploads.map((upload) => (
            <div
              key={upload.localId}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{upload.file.name}</p>
                <p className="text-xs text-gray-500">
                  {(upload.file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              {upload.status === 'uploading' && (
                <div className="w-20">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {upload.status === 'uploaded' && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}

              {upload.status === 'error' && (
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <span className="text-xs text-red-500">{upload.error}</span>
                </div>
              )}

              {(upload.status === 'pending' || upload.status === 'error') && (
                <button
                  onClick={() => removeUpload(upload.localId)}
                  className="p-1 hover:bg-gray-200 rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleUpload}
              disabled={isUploading || uploads.filter((u) => u.status === 'pending').length === 0}
            >
              {isUploading ? 'Uploading...' : 'Upload Images'}
            </Button>

            {uploads.some((u) => u.status === 'uploaded') && (
              <Button variant="outline" onClick={clearCompleted}>
                Clear Completed
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
