'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  FileText,
  Check,
  ChevronDown,
  ChevronUp,
  PenTool,
} from 'lucide-react'

// Sample contract HTML
const DEMO_CONTRACT_HTML = `
<h2>Photography Services Agreement</h2>

<p>This Photography Services Agreement ("Agreement") is entered into between <strong>Alexandra Chen Photography</strong> ("Photographer") and <strong>Sarah Mitchell & James Mitchell</strong> ("Client").</p>

<h3>1. Event Details</h3>
<ul>
  <li><strong>Event Type:</strong> Wedding</li>
  <li><strong>Event Date:</strong> [Event Date]</li>
  <li><strong>Location:</strong> The Grand Estate, Napa Valley</li>
  <li><strong>Coverage Hours:</strong> 8 hours</li>
</ul>

<h3>2. Services Provided</h3>
<p>The Photographer agrees to provide professional photography services for the Event, including:</p>
<ul>
  <li>Pre-event consultation and planning</li>
  <li>Full day coverage (8 hours)</li>
  <li>Professional editing and color correction</li>
  <li>Online gallery for viewing and downloading</li>
  <li>Minimum of 400 edited images</li>
</ul>

<h3>3. Investment & Payment</h3>
<table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
  <tr style="border-bottom: 1px solid #e5e5e5;">
    <td style="padding: 0.5rem 0;">Wedding Photography Package</td>
    <td style="padding: 0.5rem 0; text-align: right;"><strong>$4,500.00</strong></td>
  </tr>
  <tr style="border-bottom: 1px solid #e5e5e5;">
    <td style="padding: 0.5rem 0;">Second Photographer</td>
    <td style="padding: 0.5rem 0; text-align: right;">$800.00</td>
  </tr>
  <tr style="border-bottom: 2px solid #1c1917;">
    <td style="padding: 0.5rem 0;"><strong>Total</strong></td>
    <td style="padding: 0.5rem 0; text-align: right;"><strong>$5,300.00</strong></td>
  </tr>
</table>

<p><strong>Payment Schedule:</strong></p>
<ul>
  <li>50% retainer due upon signing: $2,650.00</li>
  <li>Remaining 50% due 14 days before event: $2,650.00</li>
</ul>

<h3>4. Cancellation Policy</h3>
<p>In the event of cancellation by the Client:</p>
<ul>
  <li>More than 90 days before event: Full refund minus $500 administrative fee</li>
  <li>60-90 days before event: 50% refund</li>
  <li>Less than 60 days before event: No refund</li>
</ul>

<h3>5. Image Rights & Usage</h3>
<p>The Photographer retains copyright of all images. Client receives a personal use license for all delivered images. Photographer may use images for portfolio, marketing, and promotional purposes unless otherwise agreed in writing.</p>

<h3>6. Delivery Timeline</h3>
<p>Edited images will be delivered within 6-8 weeks of the event date via a private online gallery. Client will have access to download high-resolution images for a period of 12 months.</p>
`

export default function PortalDemoContractPage() {
  const [showSignature, setShowSignature] = useState(false)
  const [signatureData, setSignatureData] = useState<string | null>(null)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [isExpanded, setIsExpanded] = useState(true)
  const [isSigned, setIsSigned] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)

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
    setIsSigned(true)
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Demo Banner */}
      <div className="bg-stone-900 text-white py-2 px-4 text-center text-sm">
        <span className="opacity-75">This is a demo contract. Try signing it!</span>
        <Link href="/" className="ml-2 underline hover:no-underline">
          Return to 12img →
        </Link>
      </div>

      {/* Header */}
      <header className="bg-white border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/portal/demo"
            className="inline-flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                isSigned 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isSigned ? <Check className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
              {isSigned ? 'Signed' : 'Pending Signature'}
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
              Contract with Alexandra Chen Photography
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
                    dangerouslySetInnerHTML={{ __html: DEMO_CONTRACT_HTML }}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Signature Section */}
        {!isSigned && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-stone-200 p-6"
          >
            <h2 className="text-lg font-medium text-stone-900 mb-4">Sign Contract</h2>

            {!showSignature ? (
              <button
                onClick={() => setShowSignature(true)}
                className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed border-stone-300 rounded-xl hover:border-stone-400 hover:bg-stone-50 transition-colors"
              >
                <PenTool className="w-5 h-5 text-stone-400" />
                <span className="text-stone-600">Click to add your signature</span>
              </button>
            ) : (
              <div className="space-y-4">
                {/* Signature Canvas */}
                <div className="relative">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-[200px] border-2 border-stone-200 rounded-xl bg-white cursor-crosshair touch-none"
                  />
                  <button
                    onClick={clearSignature}
                    className="absolute top-2 right-2 px-3 py-1 text-xs text-stone-500 hover:text-stone-700 bg-white border border-stone-200 rounded-lg"
                  >
                    Clear
                  </button>
                  <p className="absolute bottom-2 left-2 text-xs text-stone-400">
                    Sign above
                  </p>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900"
                  />
                  <span className="text-sm text-stone-600">
                    I have read and agree to the terms and conditions outlined in this contract.
                    I understand this is a legally binding agreement.
                  </span>
                </label>

                {/* Sign Button */}
                <button
                  onClick={handleSign}
                  disabled={!signatureData || !agreedToTerms}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="w-5 h-5" />
                  Sign Contract
                </button>
              </div>
            )}
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
            <h2 className="text-lg font-medium text-emerald-900 mb-2">Contract Signed!</h2>
            <p className="text-sm text-emerald-700 mb-4">
              This is a demo. In a real scenario, the contract would be saved and the photographer notified.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Get Started with 12img
            </Link>
          </motion.div>
        )}
      </main>
    </div>
  )
}
