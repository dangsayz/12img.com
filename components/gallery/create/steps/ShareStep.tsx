'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Copy, 
  Check, 
  ExternalLink, 
  Mail, 
  Smartphone,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'
import { ShareModal } from '@/components/gallery/ShareModal'

interface ShareStepProps {
  galleryId: string
  galleryName: string
}

export function ShareStep({ galleryId, galleryName }: ShareStepProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)

  useEffect(() => {
    setShareUrl(`${window.location.origin}/view-reel/${galleryId}`)
  }, [galleryId])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareOptions = [
    {
      id: 'email',
      label: 'Email',
      icon: Mail,
      action: () => setShowShareModal(true),
    },
    {
      id: 'sms',
      label: 'Send to Mobile',
      icon: Smartphone,
      action: () => setShowShareModal(true),
    },
  ]

  return (
    <div className="text-center">
      <div className="max-w-lg mx-auto">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 bg-emerald-500 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-serif text-[#141414] mb-2">
            Your Gallery is Ready!
          </h1>
          <p className="text-[#525252]">
            Share it with your clients using the link below
          </p>
        </motion.div>

        {/* Share Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E5E5E5] p-6 mb-6"
        >
          <label className="block text-xs font-medium text-[#525252] uppercase tracking-wider mb-3">
            Gallery Link
          </label>
          <div className="flex gap-3">
            <div className="flex-1 h-12 px-4 bg-[#F5F5F7] border border-[#E5E5E5] flex items-center">
              <span className="text-[#525252] truncate font-mono text-sm">
                {shareUrl}
              </span>
            </div>
            <button
              onClick={handleCopy}
              className={`
                h-12 px-5 rounded-[2px] font-medium flex items-center gap-2 transition-all
                ${copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-[#141414] hover:bg-black text-white'
                }
              `}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* Quick Share Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-4 mb-8"
        >
          {shareOptions.map((option) => {
            const Icon = option.icon
            return (
              <button
                key={option.id}
                onClick={option.action}
                className="flex items-center gap-3 p-4 bg-white border border-[#E5E5E5] hover:border-[#141414] transition-all"
              >
                <div className="w-10 h-10 bg-[#F5F5F7] flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#525252]" />
                </div>
                <span className="font-medium text-[#141414]">{option.label}</span>
              </button>
            )
          })}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <a
            href={shareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-12 bg-white border border-[#E5E5E5] hover:border-[#141414] text-[#141414] rounded-[2px] font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Preview Gallery
          </a>
          <Link
            href="/"
            className="flex-1 h-12 bg-[#141414] hover:bg-black text-white rounded-[2px] font-medium flex items-center justify-center transition-colors"
          >
            Go to Dashboard
          </Link>
        </motion.div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        galleryId={galleryId}
        galleryTitle={galleryName}
        shareUrl={shareUrl}
      />
    </div>
  )
}
