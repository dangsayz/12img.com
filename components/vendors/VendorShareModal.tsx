'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, Copy, Check, Link2, Users, ExternalLink, Send } from 'lucide-react'
import {
  Vendor,
  GalleryVendorShareWithDetails,
  CreateGalleryVendorShareInput,
  VENDOR_CATEGORIES,
  getVendorInitials,
  getVendorPortalUrl,
} from '@/lib/vendors/types'
import {
  getVendors,
  getGalleryVendorShares,
  shareGalleryWithVendor,
  revokeGalleryVendorShare,
  resendVendorShareEmail,
} from '@/server/actions/vendor.actions'

interface VendorShareModalProps {
  isOpen: boolean
  onClose: () => void
  galleryId: string
  galleryTitle: string
}

export function VendorShareModal({ isOpen, onClose, galleryId, galleryTitle }: VendorShareModalProps) {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [shares, setShares] = useState<GalleryVendorShareWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [selectedVendorId, setSelectedVendorId] = useState<string>('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, galleryId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [vendorsData, sharesData] = await Promise.all([
        getVendors(),
        getGalleryVendorShares(galleryId),
      ])
      setVendors(vendorsData)
      setShares(sharesData)
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (!selectedVendorId) return
    setError(null)
    setSharing(true)

    try {
      const input: CreateGalleryVendorShareInput = {
        gallery_id: galleryId,
        vendor_id: selectedVendorId,
        share_type: 'entire',
      }
      await shareGalleryWithVendor(input)
      await loadData()
      setSelectedVendorId('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to share')
    } finally {
      setSharing(false)
    }
  }

  const handleRevoke = async (shareId: string) => {
    if (!confirm('Revoke this share? The vendor will no longer have access.')) return
    try {
      await revokeGalleryVendorShare(shareId)
      setShares(shares.filter(s => s.id !== shareId))
    } catch (err) {
      console.error('Failed to revoke:', err)
    }
  }

  const copyLink = async (token: string, shareId: string) => {
    const url = getVendorPortalUrl(token)
    await navigator.clipboard.writeText(url)
    setCopiedId(shareId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const [resendingId, setResendingId] = useState<string | null>(null)
  const [resendSuccess, setResendSuccess] = useState<string | null>(null)

  const handleResend = async (shareId: string) => {
    setResendingId(shareId)
    try {
      const result = await resendVendorShareEmail(shareId)
      if (result.success) {
        setResendSuccess(shareId)
        setTimeout(() => setResendSuccess(null), 3000)
      } else {
        setError(result.error || 'Failed to send email')
      }
    } catch (err) {
      setError('Failed to send email')
    } finally {
      setResendingId(null)
    }
  }

  // Filter out already shared vendors
  const availableVendors = vendors.filter(
    v => !shares.some(s => s.vendor_id === v.id)
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal Container - Flexbox centering */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] pointer-events-auto"
            >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">
                  Share with Vendors
                </h2>
                <p className="text-sm text-stone-500 mt-0.5">{galleryTitle}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
                </div>
              ) : (
                <>
                  {/* Share with new vendor */}
                  {availableVendors.length > 0 && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-stone-700 mb-2">
                        Share with a vendor
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={selectedVendorId}
                          onChange={(e) => setSelectedVendorId(e.target.value)}
                          className="flex-1 px-4 py-2.5 border border-stone-200 rounded-lg text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent bg-white"
                        >
                          <option value="">Select a vendor...</option>
                          {availableVendors.map((vendor) => {
                            const cat = VENDOR_CATEGORIES[vendor.category]
                            return (
                              <option key={vendor.id} value={vendor.id}>
                                {vendor.business_name} ({cat.label})
                              </option>
                            )
                          })}
                        </select>
                        <button
                          onClick={handleShare}
                          disabled={!selectedVendorId || sharing}
                          className="px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                          {sharing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Link2 className="w-4 h-4" />
                          )}
                          Share
                        </button>
                      </div>
                      {error && (
                        <p className="text-sm text-red-600 mt-2">{error}</p>
                      )}
                    </div>
                  )}

                  {/* No vendors */}
                  {vendors.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-stone-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Users className="w-6 h-6 text-stone-400" />
                      </div>
                      <p className="text-sm text-stone-600 mb-3">
                        No vendors in your network yet
                      </p>
                      <a
                        href="/settings"
                        className="text-sm text-stone-900 font-medium hover:underline"
                      >
                        Add vendors in Settings →
                      </a>
                    </div>
                  )}

                  {/* Current shares */}
                  {shares.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-stone-700 mb-3">
                        Shared with ({shares.length})
                      </h3>
                      <div className="space-y-3">
                        {shares.map((share) => {
                          const cat = VENDOR_CATEGORIES[share.vendor.category]
                          const initials = getVendorInitials(share.vendor.business_name)
                          const isCopied = copiedId === share.id

                          return (
                            <div
                              key={share.id}
                              className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl"
                            >
                              {/* Avatar */}
                              <div
                                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${cat.bgColor} ${cat.color}`}
                              >
                                {initials}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-stone-900 truncate">
                                  {share.vendor.business_name}
                                </p>
                                {share.vendor.email && (
                                  <p className="text-xs text-stone-400 truncate">
                                    {share.vendor.email}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 text-xs text-stone-500 mt-0.5">
                                  <span>{share.image_count} photos</span>
                                  {share.viewed_at && (
                                    <>
                                      <span>•</span>
                                      <span>Viewed {share.view_count}x</span>
                                    </>
                                  )}
                                  {share.downloaded_at && (
                                    <>
                                      <span>•</span>
                                      <span>Downloaded</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => handleResend(share.id)}
                                  disabled={resendingId === share.id}
                                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors disabled:opacity-50"
                                  title="Resend email"
                                >
                                  {resendingId === share.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : resendSuccess === share.id ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Send className="w-4 h-4" />
                                  )}
                                </button>
                                <button
                                  onClick={() => copyLink(share.access_token, share.id)}
                                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                                  title="Copy link"
                                >
                                  {isCopied ? (
                                    <Check className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                                <a
                                  href={getVendorPortalUrl(share.access_token)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                                  title="Open portal"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                                <button
                                  onClick={() => handleRevoke(share.id)}
                                  className="p-2 rounded-lg text-stone-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  title="Revoke access"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* All vendors shared */}
                  {vendors.length > 0 && availableVendors.length === 0 && shares.length > 0 && (
                    <p className="text-sm text-stone-500 text-center py-4 border-t border-stone-100 mt-4">
                      All vendors in your network have access to this gallery
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 bg-stone-50">
              <p className="text-xs text-stone-400 text-center">
                Vendors will receive a unique link to view and download photos
              </p>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
