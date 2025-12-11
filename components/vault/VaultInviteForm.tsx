'use client'

import { useState } from 'react'
import { Send, Loader2, Check, Copy, Mail, Shield } from 'lucide-react'
import { createVaultInvitation } from '@/server/actions/vault.actions'

interface VaultInviteFormProps {
  galleryId: string
  galleryTitle: string
  clientEmail?: string
  clientName?: string
  onSuccess?: (purchaseUrl: string) => void
}

/**
 * Form for photographers to invite clients to purchase vault storage.
 */
export function VaultInviteForm({
  galleryId,
  galleryTitle,
  clientEmail: initialEmail = '',
  clientName: initialName = '',
  onSuccess,
}: VaultInviteFormProps) {
  const [email, setEmail] = useState(initialEmail)
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [purchaseUrl, setPurchaseUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setLoading(true)
    setError(null)

    const result = await createVaultInvitation(galleryId, email.trim(), name.trim() || undefined)

    if (result.error) {
      setError(result.error)
    } else if (result.purchaseUrl) {
      setPurchaseUrl(result.purchaseUrl)
      onSuccess?.(result.purchaseUrl)
    }

    setLoading(false)
  }

  const handleCopy = async () => {
    if (!purchaseUrl) return
    await navigator.clipboard.writeText(purchaseUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (purchaseUrl) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-emerald-900">Invitation Created!</h3>
            <p className="text-sm text-emerald-700 mt-1">
              Share this link with {name || email} to let them purchase vault storage.
            </p>

            <div className="mt-4 flex items-center gap-2">
              <input
                type="text"
                value={purchaseUrl}
                readOnly
                className="flex-1 px-3 py-2 bg-white border border-emerald-200 rounded-lg text-sm text-stone-900 truncate"
              />
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-emerald-600 mt-3">
              Link expires in 30 days. You can resend the invitation from the gallery settings.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Shield className="w-6 h-6 text-stone-600" />
        </div>
        <div>
          <h3 className="font-semibold text-stone-900">Offer Photo Vault Storage</h3>
          <p className="text-sm text-stone-600 mt-1">
            Let your client keep their photos from &quot;{galleryTitle}&quot; stored safely.
            You&apos;ll earn a referral when they subscribe.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="vault-email" className="block text-sm font-medium text-stone-700 mb-1">
            Client Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              id="vault-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="client@email.com"
              required
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label htmlFor="vault-name" className="block text-sm font-medium text-stone-700 mb-1">
            Client Name <span className="text-stone-400">(optional)</span>
          </label>
          <input
            id="vault-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sarah & John"
            className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Create Invitation
              </>
            )}
          </button>
        </div>
      </form>

      <div className="mt-4 pt-4 border-t border-stone-100">
        <p className="text-xs text-stone-500">
          <strong>How it works:</strong> You&apos;ll get a link to share with your client.
          When they purchase, their photos are automatically moved to their personal vault.
        </p>
      </div>
    </div>
  )
}
