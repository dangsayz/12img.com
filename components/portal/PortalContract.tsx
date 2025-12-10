'use client'

import { useState, useRef, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Check,
  Loader2,
  Download,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react'
import { type PortalData } from '@/server/actions/portal.actions'
import { signContract } from '@/server/actions/contract.actions'
import { type Tables } from '@/types/database'
import { CONTRACT_STATUS_CONFIG } from '@/lib/contracts/types'

interface PortalContractProps {
  data: PortalData
  contract: Tables<'contracts'>
  token: string
  canSign: boolean
  clientIp?: string
  clientUserAgent?: string
}

export function PortalContract({
  data,
  contract,
  token,
  canSign,
  clientIp,
  clientUserAgent,
}: PortalContractProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showSignature, setShowSignature] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

  const { client, photographerName } = data
  const isSigned = contract.status === 'signed'
  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status as keyof typeof CONTRACT_STATUS_CONFIG]

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    isDrawingRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawingRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.strokeStyle = '#1c1917'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()
  }

  const stopDrawing = () => {
    isDrawingRef.current = false
    const canvas = canvasRef.current
    if (canvas) {
      setSignatureData(canvas.toDataURL('image/png'))
    }
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setSignatureData(null)
  }

  const handleSign = () => {
    if (!signatureData || !agreedToTerms) return

    setError(null)
    startTransition(async () => {
      const result = await signContract(
        {
          contractId: contract.id,
          signerName: `${client.firstName} ${client.lastName}`,
          signerEmail: client.email,
          signatureData,
          agreedToTerms,
        },
        {
          clientId: client.id,
          ip: clientIp,
          userAgent: clientUserAgent,
        }
      )

      if (!result.success) {
        setError(result.error?.message || 'Failed to sign contract')
        return
      }

      router.refresh()
    })
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href={`/portal/${token}`}
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
            >
              {isSigned ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {statusConfig.label}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Contract Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-6"
        >
          <div className="p-6 border-b border-stone-100">
            <h1 className="text-xl font-medium text-stone-900">Photography Services Agreement</h1>
            <p className="text-sm text-stone-500 mt-1">
              Contract with {photographerName}
            </p>
          </div>

          {/* Contract Content */}
          <div className="relative">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full flex items-center justify-between p-4 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <span className="text-sm font-medium text-stone-700">
                {isExpanded ? 'Collapse Contract' : 'Expand Contract'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-stone-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-stone-400" />
              )}
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="p-6 prose prose-stone prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: contract.rendered_html || '' }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Signature Section - Ultra Minimalist */}
        {!isSigned && canSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-stone-200 overflow-hidden"
          >
            {/* Minimal Header */}
            <div className="px-8 py-6 border-b border-stone-100">
              <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-2">
                Complete Agreement
              </p>
              <h2 className="text-xl font-light text-stone-900" style={{ fontFamily: 'Georgia, serif' }}>
                Sign Your Contract
              </h2>
            </div>

            <div className="p-8 space-y-8">
              {!showSignature ? (
                /* Initial State - Click to Sign */
                <button
                  onClick={() => setShowSignature(true)}
                  className="w-full group"
                >
                  <div className="border border-stone-200 hover:border-stone-900 transition-colors p-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-px h-8 bg-stone-200" />
                      <p className="text-sm tracking-wide text-stone-400 group-hover:text-stone-900 transition-colors">
                        TAP TO SIGN
                      </p>
                      <div className="w-px h-8 bg-stone-200" />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="space-y-8">
                  {/* Signature Canvas - Clean */}
                  <div className="relative">
                    <canvas
                      ref={canvasRef}
                      width={600}
                      height={160}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-[160px] cursor-crosshair touch-none bg-white border border-stone-200"
                    />
                    {/* Signature line */}
                    <div className="absolute bottom-10 left-8 right-8 h-px bg-stone-900" />
                    <p className="absolute bottom-3 left-8 text-[10px] tracking-[0.15em] uppercase text-stone-400">
                      Your Signature
                    </p>
                    <button
                      onClick={clearSignature}
                      className="absolute top-3 right-3 text-[10px] tracking-wider uppercase text-stone-400 hover:text-stone-900 transition-colors"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Agreement - Minimal */}
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={e => setAgreedToTerms(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border border-stone-300 peer-checked:border-stone-900 peer-checked:bg-stone-900 transition-colors flex items-center justify-center">
                        {agreedToTerms && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    <span className="text-sm text-stone-500 leading-relaxed group-hover:text-stone-700 transition-colors">
                      I agree to the terms and conditions of this Photography Services Agreement.
                    </span>
                  </label>

                  {error && (
                    <p className="text-sm text-red-600 text-center">{error}</p>
                  )}

                  {/* Sign Button - Elegant */}
                  <button
                    onClick={handleSign}
                    disabled={!signatureData || !agreedToTerms || isPending}
                    className="w-full py-4 bg-stone-900 text-white text-sm tracking-[0.1em] uppercase font-medium hover:bg-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {isPending ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Signing...
                      </span>
                    ) : (
                      'Complete & Sign'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Signed Confirmation - Minimal */}
        {isSigned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white border border-stone-200 p-12 text-center"
          >
            <div className="w-12 h-12 border border-stone-900 flex items-center justify-center mx-auto mb-6">
              <Check className="w-5 h-5 text-stone-900" />
            </div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-stone-400 mb-2">
              Agreement Complete
            </p>
            <h2 className="text-xl font-light text-stone-900 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              Contract Signed
            </h2>
            <p className="text-sm text-stone-500">
              {contract.signed_at
                ? new Date(contract.signed_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : ''}
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
