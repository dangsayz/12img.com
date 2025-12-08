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

        {/* Signature Section */}
        {!isSigned && canSign && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-stone-200 overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-stone-50 to-white border-b border-stone-100">
              <h2 className="text-lg font-semibold text-stone-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-stone-400" />
                Sign Contract
              </h2>
              <p className="text-sm text-stone-500 mt-1">
                Draw your signature below to complete the agreement
              </p>
            </div>

            <div className="p-6 space-y-5">
              {!showSignature ? (
                <button
                  onClick={() => setShowSignature(true)}
                  className="w-full flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-stone-300 rounded-2xl hover:border-stone-400 hover:bg-stone-50 transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                    <PenTool className="w-6 h-6 text-stone-500" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-stone-900">Click to add your signature</p>
                    <p className="text-sm text-stone-500 mt-1">Draw your signature using your mouse or finger</p>
                  </div>
                </button>
              ) : (
                <div className="space-y-5">
                  {/* Signature Canvas */}
                  <div className="relative">
                    <div className="absolute -inset-px bg-gradient-to-br from-stone-200 to-stone-300 rounded-2xl" />
                    <div className="relative bg-white rounded-2xl overflow-hidden">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={180}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-[180px] cursor-crosshair touch-none"
                        style={{ background: 'linear-gradient(to bottom, #fafaf9 0%, white 100%)' }}
                      />
                      {/* Signature line */}
                      <div className="absolute bottom-8 left-6 right-6 h-0.5 bg-stone-300" />
                      <p className="absolute bottom-2 left-6 text-xs text-stone-400 font-medium">
                        Sign above the line
                      </p>
                    </div>
                    <button
                      onClick={clearSignature}
                      className="absolute top-3 right-3 px-3 py-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-white/90 backdrop-blur border border-stone-200 rounded-lg shadow-sm hover:shadow transition-all"
                    >
                      Clear
                    </button>
                  </div>

                  {/* Agreement Checkbox */}
                  <label className="flex items-start gap-3 cursor-pointer p-4 bg-stone-50 rounded-xl border border-stone-200 hover:bg-stone-100 transition-colors">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={e => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 w-5 h-5 rounded border-stone-300 text-stone-900 focus:ring-stone-900 focus:ring-offset-0"
                    />
                    <span className="text-sm text-stone-700 leading-relaxed">
                      I have read and agree to all terms and conditions outlined in this Photography Services Agreement. 
                      I understand this is a <strong>legally binding contract</strong>.
                    </span>
                  </label>

                  {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-red-600 text-xs font-bold">!</span>
                      </div>
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}

                  {/* Sign Button */}
                  <button
                    onClick={handleSign}
                    disabled={!signatureData || !agreedToTerms || isPending}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-4 bg-stone-900 text-white text-base font-medium rounded-xl hover:bg-stone-800 transition-all hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing contract...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Sign & Complete Contract
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Signed Confirmation */}
        {isSigned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center"
          >
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-lg font-medium text-emerald-900 mb-2">Contract Signed</h2>
            <p className="text-sm text-emerald-700">
              This contract was signed on{' '}
              {contract.signed_at
                ? new Date(contract.signed_at).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : 'an earlier date'}
              .
            </p>
          </motion.div>
        )}
      </main>
    </div>
  )
}
