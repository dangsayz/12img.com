'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { 
  Copy, 
  Check, 
  Lock, 
  Unlock, 
  Download, 
  Settings,
  Calendar,
  Image as ImageIcon,
  Share2,
  Trash2,
  AlertTriangle,
  Send,
  Mail,
  Loader2,
  CheckCircle2,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { updateGallery, deleteGallery, sendGalleryToClient } from '@/server/actions/gallery.actions'
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
  const [showPassword, setShowPassword] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const confirmationPhrase = 'delete permanently'
  
  // Send to client state
  const [showSendModal, setShowSendModal] = useState(false)
  const [clientEmail, setClientEmail] = useState('')
  const [personalMessage, setPersonalMessage] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [sendPassword, setSendPassword] = useState('')
  const [includePassword, setIncludePassword] = useState(false)

  // Build share URL on client only to avoid hydration mismatch
  const shareRelativePath = `/view-grid/${gallery.id}`
  const [shareUrl, setShareUrl] = useState(shareRelativePath)
  
  useEffect(() => {
    setShareUrl(`${window.location.origin}${shareRelativePath}`)
  }, [shareRelativePath])

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
        formData.set('removePassword', 'true')
        const result = await updateGallery(gallery.id, formData)
        if (!result.error) {
          router.refresh()
        }
      })
    }
  }

  const handleSetPassword = () => {
    if (!password.trim() || password.length !== 4) return
    
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
    if (deleteConfirmation !== confirmationPhrase) return
    
    setIsDeleting(true)
    const result = await deleteGallery(gallery.id)
    if (result.error) {
      console.error('Delete error:', result.error)
      setIsDeleting(false)
      setDeleteConfirmation('')
      return
    }
    // Clean redirect - component will unmount
    router.push('/')
  }

  const formattedDate = new Date(gallery.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })

  const handleSendToClient = async () => {
    if (!clientEmail.trim()) return
    
    setIsSending(true)
    setSendError(null)
    
    try {
      // Don't pass baseUrl from client - let server use production URL from env
      const result = await sendGalleryToClient(
        gallery.id, 
        clientEmail, 
        personalMessage,
        includePassword && sendPassword.length === 4 ? sendPassword : undefined
      )
      
      if (result.error) {
        setSendError(result.error)
      } else {
        setSendSuccess(true)
        // Reset after showing success
        setTimeout(() => {
          setShowSendModal(false)
          setClientEmail('')
          setPersonalMessage('')
          setSendSuccess(false)
        }, 2000)
      }
    } catch (e: any) {
      // Handle various error types including server action failures
      const errorMessage = e?.message || String(e)
      if (errorMessage.includes('Request Entity') || errorMessage.includes('not valid JSON')) {
        setSendError('Request failed. Please try again in a moment.')
      } else {
        setSendError('Something went wrong. Please try again.')
      }
      console.error('[Send to Client Error]', e)
    } finally {
      setIsSending(false)
    }
  }

  const openSendModal = () => {
    setSendError(null)
    setSendSuccess(false)
    setSendPassword('')
    setIncludePassword(false)
    // Pre-fill with professional default message
    if (!personalMessage) {
      setPersonalMessage(`Hi there,\n\nYour photos from "${gallery.title}" are ready to view! I've put together a beautiful gallery for you to browse, download, and share with family and friends.\n\nTake your time looking through them — I hope they bring back wonderful memories.`)
    }
    setShowSendModal(true)
  }

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
            className={`h-11 px-4 rounded-xl ${
              copied 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                : 'hover:bg-gray-50'
            }`}
          >
            {copied ? (
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Copy className="w-4 h-4" />
                <span>Copy</span>
              </div>
            )}
          </Button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={openSendModal}
            className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg shadow-sm"
          >
            <Send className="w-4 h-4" />
            Send to Client
          </button>
        </div>
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
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                isPasswordEnabled 
                  ? 'bg-slate-900' 
                  : 'bg-slate-100'
              }`}>
                {isPasswordEnabled ? (
                  <Lock className="w-4 h-4 text-white" />
                ) : (
                  <Unlock className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-900">PIN Protection</Label>
                <p className="text-xs text-slate-500">4-digit PIN required to view</p>
              </div>
            </div>
            <Switch
              checked={isPasswordEnabled}
              onCheckedChange={handlePasswordToggle}
              disabled={isPending}
              className="data-[state=checked]:bg-slate-900"
            />
          </div>

          {showPasswordInput && (
            <div className="flex gap-2 pl-12">
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                    setPassword(val)
                  }}
                  placeholder="0000"
                  className="h-10 rounded-lg text-sm pr-10 font-mono tracking-widest text-center"
                  maxLength={4}
                  inputMode="numeric"
                  pattern="[0-9]*"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <Button
                onClick={handleSetPassword}
                disabled={isPending || password.length !== 4}
                size="sm"
                className="h-10 px-4 rounded-lg"
              >
                {isPending ? 'Saving...' : 'Set'}
              </Button>
            </div>
          )}
        </div>

        {/* Download Permission */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${
              isDownloadEnabled 
                ? 'bg-slate-900' 
                : 'bg-slate-100'
            }`}>
              <Download className={`w-4 h-4 ${
                isDownloadEnabled ? 'text-white' : 'text-slate-400'
              }`} />
            </div>
            <div>
              <Label className="text-sm font-medium text-slate-900">Allow Downloads</Label>
              <p className="text-xs text-slate-500">Visitors can download images</p>
            </div>
          </div>
          <Switch
            checked={isDownloadEnabled}
            onCheckedChange={handleDownloadToggle}
            disabled={isPending}
            className="data-[state=checked]:bg-slate-900"
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
        <button
          onClick={() => setShowDeleteDialog(true)}
          className="text-xs text-gray-400 hover:text-slate-900"
        >
          Delete gallery
        </button>

          {/* Delete Confirmation Modal */}
          {showDeleteDialog && createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
              onClick={() => {
                if (!isDeleting) {
                  setShowDeleteDialog(false)
                  setDeleteConfirmation('')
                }
              }}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto"
              >
                {/* Header */}
                <div className="bg-slate-900 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">Delete Gallery</h3>
                      <p className="text-slate-400 text-xs">This action is irreversible</p>
                    </div>
                  </div>
                </div>

                <div className="p-5">
                  {/* Warning content */}
                  <div className="space-y-4 mb-5">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">You are about to permanently delete:</p>
                      <p className="text-slate-900 font-medium text-sm">"{gallery.title}"</p>
                    </div>
                    
                    <div className="text-xs text-slate-600 space-y-1.5">
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        All {gallery.imageCount} images will be permanently erased
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        Share links will stop working immediately
                      </p>
                      <p className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        <strong className="text-slate-900">This cannot be undone</strong>
                      </p>
                    </div>
                  </div>

                  {/* Confirmation input */}
                  <div className="mb-5">
                    <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      Type{' '}
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(confirmationPhrase)
                          setDeleteConfirmation(confirmationPhrase)
                        }}
                        className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-900 hover:bg-slate-200 cursor-pointer"
                        title="Click to copy"
                      >
                        {confirmationPhrase}
                      </button>{' '}
                      to confirm
                    </Label>
                    <Input
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={confirmationPhrase}
                      className="h-10 font-mono text-sm border-slate-200 focus:border-slate-400 focus:ring-slate-400"
                      disabled={isDeleting}
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowDeleteDialog(false)
                        setDeleteConfirmation('')
                      }}
                      disabled={isDeleting}
                      className="flex-1 h-10 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting || deleteConfirmation !== confirmationPhrase}
                      className="flex-1 h-10 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Forever'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Send to Client Modal */}
          {showSendModal && createPortal(
            <div
              className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto"
              onClick={() => !isSending && setShowSendModal(false)}
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto"
              >
                {sendSuccess ? (
                  <div className="p-8 text-center">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-1">Gallery Sent!</h3>
                    <p className="text-slate-500 text-sm">
                      Email delivered to {clientEmail}
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Header */}
                    <div className="bg-slate-900 px-5 py-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                            <Send className="w-4 h-4 text-white" />
                          </div>
                          <h3 className="text-sm font-semibold text-white">Send to Client</h3>
                        </div>
                        <button
                          onClick={() => setShowSendModal(false)}
                          className="text-slate-400 hover:text-white p-1"
                          disabled={isSending}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                      {/* Email */}
                      <div>
                        <Label className="text-xs font-medium text-slate-600 mb-2 block">
                          Client's Email
                        </Label>
                        <input
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="client@example.com"
                          disabled={isSending}
                          autoComplete="email"
                          className="
                            w-full h-12 rounded-xl border border-slate-200
                            px-4
                            text-base
                            placeholder:text-slate-400
                            focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300
                            disabled:opacity-50 disabled:bg-slate-50
                            touch-manipulation
                          "
                          style={{
                            fontSize: '16px', // Prevents iOS zoom
                          }}
                        />
                      </div>

                      {/* Password Section */}
                      <div className="p-3 bg-slate-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Lock className="w-4 h-4 text-slate-500" />
                            <span className="text-sm font-medium text-slate-700">PIN Protection</span>
                          </div>
                          <Switch
                            checked={isPasswordEnabled}
                            onCheckedChange={(checked) => {
                              setIsPasswordEnabled(checked)
                              if (!checked) {
                                setSendPassword('')
                                setIncludePassword(false)
                                // Remove password from gallery
                                startTransition(async () => {
                                  const formData = new FormData()
                                  formData.set('removePassword', 'true')
                                  await updateGallery(gallery.id, formData)
                                  router.refresh()
                                })
                              }
                            }}
                            disabled={isSending}
                            className="data-[state=checked]:bg-slate-900 scale-90"
                          />
                        </div>
                        
                        {isPasswordEnabled && (
                          <>
                            <div>
                              <input
                                type="text"
                                value={sendPassword}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 4)
                                  setSendPassword(val)
                                }}
                                placeholder="• • • •"
                                maxLength={4}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                disabled={isSending}
                                className="
                                  w-full h-12 rounded-xl border border-slate-200
                                  text-center font-mono text-xl tracking-[0.5em]
                                  placeholder:text-slate-300 placeholder:tracking-[0.3em]
                                  focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300
                                  disabled:opacity-50 disabled:bg-slate-50
                                  touch-manipulation
                                "
                                style={{
                                  fontSize: '20px', // Prevents iOS zoom + larger for PIN
                                }}
                              />
                              {sendPassword.length === 4 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    startTransition(async () => {
                                      const formData = new FormData()
                                      formData.set('password', sendPassword)
                                      await updateGallery(gallery.id, formData)
                                      router.refresh()
                                    })
                                  }}
                                  disabled={isPending}
                                  className="mt-2 text-xs text-slate-600 hover:text-slate-900 underline"
                                >
                                  {isPending ? 'Saving...' : 'Save PIN'}
                                </button>
                              )}
                            </div>
                            
                            {(gallery.password_hash || sendPassword.length === 4) && (
                              <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={includePassword}
                                  onChange={(e) => setIncludePassword(e.target.checked)}
                                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                                  disabled={isSending}
                                />
                                <span className="text-xs text-slate-600">
                                  Include PIN in email
                                </span>
                              </label>
                            )}
                          </>
                        )}
                      </div>
                      
                      {/* Message */}
                      <div>
                        <Label className="text-xs font-medium text-slate-600 mb-2 block">
                          Message
                        </Label>
                        <textarea
                          value={personalMessage}
                          onChange={(e) => setPersonalMessage(e.target.value)}
                          placeholder="Write a personal message..."
                          disabled={isSending}
                          rows={5}
                          className="
                            w-full rounded-xl border border-slate-200 
                            px-4 py-3.5
                            text-base leading-relaxed
                            placeholder:text-slate-400
                            focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300
                            disabled:opacity-50 disabled:bg-slate-50
                            resize-none
                            touch-manipulation
                          "
                          style={{
                            fontSize: '16px', // Prevents iOS zoom
                            WebkitTextSizeAdjust: '100%',
                          }}
                        />
                      </div>

                      {sendError && (
                        <div className="p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                          {sendError}
                        </div>
                      )}

                      {/* Preview what client gets */}
                      {includePassword && sendPassword.length === 4 && (
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-xs">
                          <p className="text-emerald-800 font-medium mb-1">PIN will be included in email:</p>
                          <code className="text-emerald-700 bg-emerald-100 px-2 py-1 rounded font-mono tracking-widest">{sendPassword}</code>
                        </div>
                      )}
                    </div>

                    {/* Actions - Fixed at bottom */}
                    <div className="flex gap-2 p-4 border-t border-slate-100 bg-white">
                      <button
                        onClick={() => setShowSendModal(false)}
                        disabled={isSending}
                        className="flex-1 h-10 px-4 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendToClient}
                        disabled={isSending || !clientEmail.trim()}
                        className="flex-1 h-10 px-4 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>,
            document.body
          )}
      </div>
    </div>
  )
}
