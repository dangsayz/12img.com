'use client'

import { useState, useTransition } from 'react'
import { 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Download, 
  Settings,
  ExternalLink,
  Calendar,
  Image as ImageIcon,
  Share2,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateGallery, deleteGallery } from '@/server/actions/gallery.actions'
import { useRouter } from 'next/navigation'

interface Gallery {
  id: string
  title: string
  slug: string
  password_hash: string | null
  download_enabled: boolean
  created_at: string
  imageCount: number
}

interface GalleryControlPanelProps {
  gallery: Gallery
}

export function GalleryControlPanel({ gallery }: GalleryControlPanelProps) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [isPasswordEnabled, setIsPasswordEnabled] = useState(!!gallery.password_hash)
  const [isDownloadEnabled, setIsDownloadEnabled] = useState(gallery.download_enabled)
  const [password, setPassword] = useState('')
  const [showPasswordInput, setShowPasswordInput] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${gallery.slug}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePasswordToggle = (enabled: boolean) => {
    setIsPasswordEnabled(enabled)
    if (enabled) {
      setShowPasswordInput(true)
    } else {
      // Remove password
      setShowPasswordInput(false)
      setPassword('')
      startTransition(async () => {
        const formData = new FormData()
        formData.set('password', '')
        await updateGallery(gallery.id, formData)
        router.refresh()
      })
    }
  }

  const handleSetPassword = () => {
    if (!password.trim() || password.length < 4) return
    
    startTransition(async () => {
      const formData = new FormData()
      formData.set('password', password)
      await updateGallery(gallery.id, formData)
      setShowPasswordInput(false)
      setPassword('')
      router.refresh()
    })
  }

  const handleDownloadToggle = (enabled: boolean) => {
    setIsDownloadEnabled(enabled)
    startTransition(async () => {
      const formData = new FormData()
      formData.set('downloadEnabled', String(enabled))
      await updateGallery(gallery.id, formData)
      router.refresh()
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteGallery(gallery.id)
    if (result.error) {
      console.error('Delete error:', result.error)
      setIsDeleting(false)
      return
    }
    router.push('/')
  }

  const formattedDate = new Date(gallery.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Share URL Section */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <Share2 className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Share Link</h3>
        </div>
        
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              readOnly
              value={shareUrl}
              className="h-11 pr-20 font-mono text-sm bg-gray-50 border-gray-200 text-gray-600 rounded-xl"
            />
          </div>
          <Button
            onClick={copyToClipboard}
            variant="outline"
            className={`h-11 px-4 rounded-xl transition-all duration-200 ${
              copied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'hover:bg-gray-50'
            }`}
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        <a
          href={shareUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Preview gallery</span>
        </a>
      </div>

      {/* Settings Section */}
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="w-4 h-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">Settings</h3>
        </div>

        {/* Password Protection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
                isPasswordEnabled ? 'bg-amber-50' : 'bg-gray-50'
              }`}>
                {isPasswordEnabled ? (
                  <Lock className="w-4 h-4 text-amber-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-900">Password Protection</Label>
                <p className="text-xs text-gray-500">Require password to view</p>
              </div>
            </div>
            <Switch
              checked={isPasswordEnabled}
              onCheckedChange={handlePasswordToggle}
              disabled={isPending}
            />
          </div>

          <AnimatePresence>
            {showPasswordInput && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 pl-12">
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password (min 4 chars)"
                    className="h-10 rounded-lg text-sm"
                    minLength={4}
                  />
                  <Button
                    onClick={handleSetPassword}
                    disabled={isPending || password.length < 4}
                    size="sm"
                    className="h-10 px-4 rounded-lg"
                  >
                    {isPending ? 'Saving...' : 'Set'}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Download Permission */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center transition-colors ${
              isDownloadEnabled ? 'bg-blue-50' : 'bg-gray-50'
            }`}>
              <Download className={`w-4 h-4 ${isDownloadEnabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-900">Allow Downloads</Label>
              <p className="text-xs text-gray-500">Visitors can download images</p>
            </div>
          </div>
          <Switch
            checked={isDownloadEnabled}
            onCheckedChange={handleDownloadToggle}
            disabled={isPending}
          />
        </div>
      </div>

      {/* Gallery Info */}
      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5" />
              {gallery.imageCount} images
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {formattedDate}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDeleteDialog(true)}
          className="text-red-500 hover:text-red-600 hover:bg-red-50 gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Gallery
        </Button>

          {/* Delete Confirmation Modal */}
          <AnimatePresence>
            {showDeleteDialog && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
                onClick={() => setShowDeleteDialog(false)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Delete Gallery</h3>
                  </div>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "{gallery.title}"? This action cannot be undone and all images will be permanently removed.
                  </p>
                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteDialog(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>
    </div>
  )
}
