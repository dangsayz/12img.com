'use client'

import { useState, useTransition, useMemo, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  FileText,
  Send,
  RefreshCw,
  Trash2,
  Copy,
  Edit3,
  Eye,
  Check,
  X,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  CheckCircle2,
  Archive,
  MousePointer2,
  Lightbulb,
  Mail,
  Pencil,
  RotateCcw,
  Save,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type ContractWithDetails,
  type ClauseSnapshot,
  CONTRACT_STATUS_CONFIG,
  CLAUSE_CATEGORY_LABELS,
} from '@/lib/contracts/types'
import { ContractQuickEdit } from './ContractQuickEdit'
import {
  updateContract,
  deleteContract,
  sendContractToClient,
  resendContract,
  duplicateContract,
  archiveContract,
  cancelContract,
  sendContractCopy,
} from '@/server/actions/contract.actions'

interface ContractEditorProps {
  contract: ContractWithDetails
  clientName: string
  clientId: string
}

// Hints for first-time users
const HINTS = [
  {
    icon: Edit3,
    title: 'Edit Your Contract',
    description: 'Click "Edit" to customize clauses and terms before sending.',
  },
  {
    icon: Eye,
    title: 'Preview Mode',
    description: 'Toggle between Preview and Clauses view to see how clients will see it.',
  },
  {
    icon: Send,
    title: 'Send to Client',
    description: 'When ready, click "Send to Client" to email them a secure signing link.',
  },
  {
    icon: CheckCircle2,
    title: 'Track Progress',
    description: 'See when your client views and signs the contract in the timeline.',
  },
]

export function ContractEditor({ contract, clientName, clientId }: ContractEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [portalUrl, setPortalUrl] = useState<string | null>(null)
  const [showHints, setShowHints] = useState(false)
  const [expirationDays, setExpirationDays] = useState(30)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showCopySentModal, setShowCopySentModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  
  // Check if this is the first time viewing contracts
  useEffect(() => {
    const hasSeenHints = localStorage.getItem('contract-editor-hints-seen')
    if (!hasSeenHints && contract.status === 'draft') {
      setShowHints(true)
    }
  }, [contract.status])
  
  // Handle Escape key to close modals
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showCopySentModal) setShowCopySentModal(false)
        if (showDeleteConfirm) setShowDeleteConfirm(false)
        if (showSendConfirm) setShowSendConfirm(false)
        if (showCancelModal) setShowCancelModal(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showCopySentModal, showDeleteConfirm, showSendConfirm, showCancelModal])
  
  const dismissHints = () => {
    localStorage.setItem('contract-editor-hints-seen', 'true')
    setShowHints(false)
  }
  
  // Contract status flags
  const isDraft = contract.status === 'draft'
  const isSent = contract.status === 'sent' || contract.status === 'viewed'
  const isSigned = contract.status === 'signed'
  const isArchived = contract.status === 'archived'
  
  // Editable clauses state
  const [editableClauses, setEditableClauses] = useState<ClauseSnapshot[]>(
    contract.clausesSnapshot || []
  )
  const [expandedClauses, setExpandedClauses] = useState<Set<string>>(new Set())
  
  // Inline editing state
  const [editingClauseId, setEditingClauseId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Track if clauses have been modified from original
  const originalClauses = useRef(contract.clausesSnapshot || [])
  
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && editingClauseId) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight + 4}px`
      textareaRef.current.focus()
    }
  }, [editingContent, editingClauseId])
  
  // Check for unsaved changes
  useEffect(() => {
    const hasChanges = JSON.stringify(editableClauses) !== JSON.stringify(originalClauses.current)
    setHasUnsavedChanges(hasChanges)
  }, [editableClauses])
  
  // Start inline editing a clause
  const startInlineEdit = useCallback((clause: ClauseSnapshot) => {
    if (!isDraft) return
    setEditingClauseId(clause.id)
    setEditingContent(clause.content)
  }, [isDraft])
  
  // Save inline edit
  const saveInlineEdit = useCallback(() => {
    if (!editingClauseId) return
    
    setEditableClauses(prev =>
      prev.map(c => (c.id === editingClauseId ? { ...c, content: editingContent } : c))
    )
    setEditingClauseId(null)
    setEditingContent('')
  }, [editingClauseId, editingContent])
  
  // Cancel inline edit
  const cancelInlineEdit = useCallback(() => {
    setEditingClauseId(null)
    setEditingContent('')
  }, [])
  
  // Handle keyboard shortcuts for inline editing
  const handleInlineKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      cancelInlineEdit()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      saveInlineEdit()
    }
  }, [cancelInlineEdit, saveInlineEdit])

  // Group clauses by category
  const clausesByCategory = useMemo(() => {
    const grouped: Record<string, ClauseSnapshot[]> = {}
    editableClauses.forEach(clause => {
      if (!grouped[clause.category]) {
        grouped[clause.category] = []
      }
      grouped[clause.category].push(clause)
    })
    return grouped
  }, [editableClauses])

  const toggleClauseExpand = (clauseId: string) => {
    setExpandedClauses(prev => {
      const next = new Set(prev)
      if (next.has(clauseId)) {
        next.delete(clauseId)
      } else {
        next.add(clauseId)
      }
      return next
    })
  }

  const updateClauseContent = (clauseId: string, newContent: string) => {
    setEditableClauses(prev =>
      prev.map(c => (c.id === clauseId ? { ...c, content: newContent } : c))
    )
  }

  const handleSaveChanges = () => {
    setError(null)
    setSuccess(null)
    
    startTransition(async () => {
      const result = await updateContract({
        contractId: contract.id,
        clausesSnapshot: editableClauses,
      })

      if (!result.success) {
        setError(result.error?.message || 'Failed to save changes')
        return
      }

      setSuccess('Contract saved successfully')
      originalClauses.current = editableClauses // Update original to match saved
      router.refresh()
    })
  }

  const handleSendContract = () => {
    setError(null)
    setSuccess(null)
    setShowSendConfirm(false)
    
    startTransition(async () => {
      const result = await sendContractToClient(contract.id, expirationDays)

      if (!result.success) {
        setError(result.error?.message || 'Failed to send contract')
        return
      }

      setPortalUrl(result.data?.portalUrl || null)
      setSuccess('Contract sent successfully!')
      router.refresh()
    })
  }

  const handleResendContract = () => {
    setError(null)
    setSuccess(null)
    
    startTransition(async () => {
      const result = await resendContract(contract.id)

      if (!result.success) {
        setError(result.error?.message || 'Failed to resend contract')
        return
      }

      setPortalUrl(result.data?.portalUrl || null)
      setSuccess('Contract resent successfully!')
      router.refresh()
    })
  }

  const handleDuplicate = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await duplicateContract(contract.id)

      if (!result.success) {
        setError(result.error?.message || 'Failed to duplicate contract')
        return
      }

      // Navigate to the new contract
      router.push(`/dashboard/contracts/${result.data?.id}`)
    })
  }

  const handleDelete = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await deleteContract(contract.id)

      if (!result.success) {
        setError(result.error?.message || 'Failed to delete contract')
        setShowDeleteConfirm(false)
        return
      }

      // Navigate back to client page
      router.push(`/dashboard/clients/${clientId}`)
    })
  }

  const handleCancel = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await cancelContract(contract.id, cancelReason || undefined)

      if (!result.success) {
        setError(result.error?.message || 'Failed to cancel contract')
        setShowCancelModal(false)
        return
      }

      setSuccess('Contract cancelled. Both parties have been notified.')
      setShowCancelModal(false)
      setCancelReason('')
      // Redirect back to client page after brief delay
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`)
      }, 1500)
    })
  }

  const handleArchive = () => {
    setError(null)
    
    startTransition(async () => {
      const result = await archiveContract(contract.id)

      if (!result.success) {
        setError(result.error?.message || 'Failed to archive contract')
        return
      }

      setSuccess('Contract archived successfully')
      // Redirect back to client page after brief delay
      setTimeout(() => {
        router.push(`/dashboard/clients/${clientId}`)
      }, 1500)
    })
  }

  const handleSendCopy = () => {
    setError(null)
    setSuccess(null)
    
    startTransition(async () => {
      const result = await sendContractCopy(contract.id)

      if (!result.success) {
        setError(result.error?.message || 'Failed to send contract copy')
        return
      }

      setShowCopySentModal(true)
    })
  }

  const handleCopyUrl = async () => {
    if (!portalUrl) return
    await navigator.clipboard.writeText(portalUrl)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  const statusConfig = CONTRACT_STATUS_CONFIG[contract.status]

  return (
    <div className="fixed inset-0 bg-stone-100 flex flex-col overflow-hidden">
      {/* First-Time Hints Overlay */}
      <AnimatePresence>
        {showHints && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={dismissHints}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ delay: 0.1 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-stone-900 to-stone-800 px-6 py-8 text-center">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <h2 className="text-xl font-semibold text-white mb-1">Welcome to Contract Editor</h2>
                  <p className="text-stone-300 text-sm">Here's how to get started</p>
                </div>
              </div>
              
              {/* Hints Grid */}
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {HINTS.map((hint, index) => {
                    const Icon = hint.icon
                    return (
                      <motion.div
                        key={hint.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        className="p-4 rounded-xl bg-stone-50 border border-stone-100"
                      >
                        <div className="w-10 h-10 rounded-lg bg-white border border-stone-200 flex items-center justify-center mb-3 shadow-sm">
                          <Icon className="w-5 h-5 text-stone-600" />
                        </div>
                        <h3 className="font-medium text-stone-900 text-sm mb-1">{hint.title}</h3>
                        <p className="text-xs text-stone-500 leading-relaxed">{hint.description}</p>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <p className="text-xs text-stone-400 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" />
                  You can always access help from the menu
                </p>
                <button
                  onClick={dismissHints}
                  className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Bar - Mobile Optimized */}
      <header className="flex-shrink-0 bg-white border-b border-stone-200">
        {/* Main Header Row */}
        <div className="px-4 py-3">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
            {/* Left: Back + Title */}
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href={`/dashboard/clients/${clientId}`}
                className="p-2 -ml-2 hover:bg-stone-100 rounded-lg transition-colors flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-stone-500" />
              </Link>
              
              <div className="min-w-0">
                <h1 className="text-base font-semibold text-stone-900 truncate">
                  Contract
                </h1>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${statusConfig.bgColor} ${statusConfig.color}`}
                  >
                    <FileText className="w-3 h-3" />
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Action Buttons - Hidden on mobile */}
            <div className="hidden sm:flex items-center gap-2">
              {isDraft && (
                <>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                  <button
                    onClick={() => setShowSendConfirm(true)}
                    disabled={isPending || hasUnsavedChanges}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                    title={hasUnsavedChanges ? 'Save changes first' : ''}
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send to Client
                  </button>
                </>
              )}
              {isSent && (
                <>
                  <button
                    onClick={() => setShowCancelModal(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={handleDuplicate}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleResendContract}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    Resend
                  </button>
                </>
              )}
              {isSigned && !isArchived && (
                <>
                  <button
                    onClick={handleDuplicate}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
                  >
                    <Copy className="w-4 h-4" />
                    Duplicate
                  </button>
                  <button
                    onClick={handleSendCopy}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50"
                  >
                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Send Copy
                  </button>
                  <button
                    onClick={handleArchive}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-stone-300 text-stone-700 rounded-lg hover:bg-stone-100 transition-colors text-sm"
                  >
                    <Archive className="w-4 h-4" />
                    Archive
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Action Bar - Sticky bottom on mobile */}
        <div className="sm:hidden border-t border-stone-100 px-4 py-3 bg-stone-50">
          <div className="flex items-center gap-2">
            {isDraft && (
              <>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowSendConfirm(true)}
                  disabled={isPending || hasUnsavedChanges}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  {hasUnsavedChanges ? 'Save First' : 'Send to Client'}
                </button>
              </>
            )}
            {isSent && (
              <>
                <button
                  onClick={() => setShowCancelModal(true)}
                  disabled={isPending}
                  className="p-2.5 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 border border-stone-200 rounded-xl hover:bg-white transition-colors text-sm font-medium"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
                <button
                  onClick={handleResendContract}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 text-white text-sm font-medium rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Resend
                </button>
              </>
            )}
            {isSigned && !isArchived && (
              <>
                <button
                  onClick={handleDuplicate}
                  disabled={isPending}
                  className="p-2.5 border border-stone-200 rounded-xl hover:bg-white transition-colors"
                >
                  <Copy className="w-5 h-5 text-stone-600" />
                </button>
                <button
                  onClick={handleSendCopy}
                  disabled={isPending}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Send Copy
                </button>
                <button
                  onClick={handleArchive}
                  disabled={isPending}
                  className="p-2.5 border border-stone-200 rounded-xl hover:bg-white transition-colors"
                >
                  <Archive className="w-5 h-5 text-stone-600" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Success/Error Messages - Fixed at top */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-shrink-0 mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Error</p>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        {success && portalUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSuccess(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Success Header */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 px-6 py-8 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
                >
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </motion.div>
                <h2 className="text-xl font-semibold text-white mb-1">Contract Sent!</h2>
                <p className="text-emerald-100 text-sm">Your client has been notified</p>
              </div>

              {/* Details */}
              <div className="px-6 py-5 space-y-4">
                {/* Sent To */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center shrink-0">
                    <Send className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Sent to</p>
                    <p className="font-medium text-stone-900 truncate">{clientName}</p>
                    <p className="text-sm text-stone-500 truncate">{contract.client?.email}</p>
                  </div>
                </div>

                {/* Expires */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Expires</p>
                    <p className="font-medium text-stone-900">
                      {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm text-stone-500">{expirationDays} days from now</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                    <Eye className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Status</p>
                    <p className="font-medium text-stone-900">Awaiting client view</p>
                    <p className="text-sm text-stone-500">You'll be notified when they open it</p>
                  </div>
                </div>

                {/* Portal Link */}
                <div className="pt-2">
                  <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Client Portal Link</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={portalUrl}
                      className="flex-1 min-w-0 px-3 py-2 text-sm text-stone-900 bg-stone-50 border border-stone-200 rounded-lg truncate"
                    />
                    <button
                      onClick={handleCopyUrl}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                        copiedUrl
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-stone-900 text-white hover:bg-stone-800'
                      }`}
                    >
                      {copiedUrl ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedUrl ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={() => setSuccess(null)}
                  className="w-full py-2.5 text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Simple success message (for non-send actions) */}
        {success && !portalUrl && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-shrink-0 mx-4 mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-emerald-900">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-600">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Contract Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <X className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-stone-900">Cancel Contract</h3>
                  <p className="text-sm text-stone-500">for {clientName}</p>
                </div>
              </div>
              
              <p className="text-stone-600 text-sm mb-4">
                This will cancel the contract and notify both you and the client via email.
              </p>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Reason for cancellation <span className="text-stone-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={cancelReason}
                  onChange={e => setCancelReason(e.target.value)}
                  placeholder="e.g., Client requested to reschedule, Date no longer available..."
                  className="w-full px-4 py-3 text-sm border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-300 resize-none"
                  rows={3}
                />
                <p className="text-xs text-stone-400 mt-2">
                  This reason will be shared with the client in the notification email.
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false)
                    setCancelReason('')
                  }}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Keep Contract
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  Cancel Contract
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-medium text-stone-900 mb-2">Delete Contract?</h3>
              <p className="text-stone-600 mb-6">
                This action cannot be undone. The contract will be permanently deleted.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Confirmation Modal with Expiration Selector */}
      <AnimatePresence>
        {showSendConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowSendConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                  <Send className="w-5 h-5 text-stone-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-stone-900">Send Contract</h3>
                  <p className="text-sm text-stone-500">to {clientName}</p>
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-stone-700 mb-2">
                  Contract expires in
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[1, 3, 7, 14, 30].map(days => (
                    <button
                      key={days}
                      onClick={() => setExpirationDays(days)}
                      className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                        expirationDays === days
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300 hover:bg-stone-50'
                      }`}
                    >
                      {days}d
                    </button>
                  ))}
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  Client will have until{' '}
                  <span className="font-medium text-stone-600">
                    {new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>{' '}
                  to sign
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowSendConfirm(false)}
                  className="px-4 py-2 text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendContract}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send Contract
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contract Copy Sent Success Modal */}
      <AnimatePresence>
        {showCopySentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowCopySentModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Elegant Header */}
              <div className="relative bg-stone-900 px-6 py-10 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 15 }}
                  className="relative w-14 h-14 bg-white rounded-full flex items-center justify-center mx-auto mb-5"
                >
                  <Check className="w-7 h-7 text-stone-900" />
                </motion.div>
                <h2 className="relative text-xl font-medium text-white mb-1 tracking-tight">Contract Copy Sent</h2>
                <p className="relative text-stone-400 text-sm">A copy has been delivered to your client</p>
              </div>

              {/* Details */}
              <div className="px-6 py-6 space-y-5">
                {/* Recipient */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Delivered to</p>
                    <p className="font-medium text-stone-900 truncate">{clientName}</p>
                    <p className="text-sm text-stone-500 truncate">{contract.client?.email}</p>
                  </div>
                </div>

                {/* Signed Date */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Originally Signed</p>
                    <p className="font-medium text-stone-900">
                      {contract.signedAt ? new Date(contract.signedAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      }) : 'Date unavailable'}
                    </p>
                  </div>
                </div>

                {/* What was sent */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 text-stone-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-stone-400 uppercase tracking-wider mb-0.5">Email Contains</p>
                    <p className="font-medium text-stone-900">Signed contract confirmation</p>
                    <p className="text-sm text-stone-500">With signature details for their records</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-between">
                <p className="text-xs text-stone-400">Press Esc to close</p>
                <button
                  onClick={() => setShowCopySentModal(false)}
                  className="px-6 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scrollable Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Contract Timeline */}
          <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm p-6 mb-6">
            <h2 className="text-sm font-semibold text-stone-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-stone-400" />
              Timeline
            </h2>
            <div className="flex items-center gap-6 text-sm flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-stone-500" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">Created</p>
                  <p className="font-medium text-stone-900">
                    {new Date(contract.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              {contract.sentAt && (
                <>
                  <div className="w-8 h-px bg-stone-200 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                      <Send className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">Sent</p>
                      <p className="font-medium text-stone-900">
                        {new Date(contract.sentAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {contract.viewedAt && (
                <>
                  <div className="w-8 h-px bg-stone-200 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                      <Eye className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">Viewed</p>
                      <p className="font-medium text-stone-900">
                        {new Date(contract.viewedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {contract.signedAt && (
                <>
                  <div className="w-8 h-px bg-stone-200 hidden sm:block" />
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xs text-stone-400 uppercase tracking-wider">Signed</p>
                      <p className="font-medium text-stone-900">
                        {new Date(contract.signedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                </>
              )}
              {contract.expiresAt && !isSigned && !isArchived && (() => {
                const isExpired = new Date(contract.expiresAt) < new Date()
                return (
                  <div className={`flex items-center gap-2 ml-auto px-3 py-1.5 rounded-lg ${
                    isExpired ? 'bg-red-50' : 'bg-amber-50'
                  }`}>
                    <Clock className={`w-4 h-4 ${isExpired ? 'text-red-600' : 'text-amber-600'}`} />
                    <span className={`text-sm font-medium ${
                      isExpired ? 'text-red-700' : 'text-amber-700'
                    }`}>
                      {isExpired ? 'Expired' : 'Expires'}{' '}
                      {new Date(contract.expiresAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Signature Info (if signed) */}
          {contract.signature && (
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl border border-emerald-200/60 shadow-sm p-6 mb-6">
              <h2 className="text-sm font-semibold text-emerald-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Signature
              </h2>
              <div className="flex flex-col sm:flex-row items-start gap-6">
                <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Signed by</p>
                    <p className="font-medium text-emerald-900">{contract.signature?.signerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium text-emerald-900">{contract.signature?.signerEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">Date</p>
                    <p className="font-medium text-emerald-900">
                      {contract.signature?.signedAt && new Date(contract.signature.signedAt).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600 uppercase tracking-wider mb-1">IP Address</p>
                    <p className="font-medium text-emerald-900">{contract.signature?.signerIp || 'N/A'}</p>
                  </div>
                </div>
                {contract.signature?.signatureData && (
                  <div className="w-full sm:w-56 h-28 bg-white rounded-xl border border-emerald-200 p-3 shadow-sm">
                    <img
                      src={contract.signature.signatureData}
                      alt="Signature"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* View Toggle */}
          <div className="flex items-center gap-1 mb-4 p-1 bg-stone-200/50 rounded-xl w-fit">
            <button
              onClick={() => setShowPreview(true)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                showPreview 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Eye className="w-4 h-4 inline mr-1.5" />
              Preview
            </button>
            <button
              onClick={() => setShowPreview(false)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                !showPreview 
                  ? 'bg-white text-stone-900 shadow-sm' 
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-1.5" />
              Clauses
              <span className="ml-1.5 px-1.5 py-0.5 bg-stone-200 rounded text-xs">
                {editableClauses.length}
              </span>
            </button>
          </div>

          {/* Quick Edit Section - Event Details & Investment (only show when NOT in preview) */}
          {isDraft && contract.client && !showPreview && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-stone-400" />
                  Quick Edit
                </h2>
                <span className="text-xs text-stone-400">Click any field to edit</span>
              </div>
              <ContractQuickEdit
                client={contract.client}
                contractId={contract.id}
                disabled={!isDraft}
              />
            </div>
          )}

          {/* Contract Content - Inline Editing */}
          {showPreview ? (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
              <div
                className="p-8 sm:p-10 prose prose-stone max-w-none"
                dangerouslySetInnerHTML={{ __html: contract.renderedHtml || '' }}
              />
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
              {/* Floating Save Bar - Shows when there are unsaved changes */}
              <AnimatePresence>
                {hasUnsavedChanges && isDraft && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="sticky top-0 z-20 bg-stone-900 text-white px-4 py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium">Unsaved changes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditableClauses(originalClauses.current)
                          setEditingClauseId(null)
                        }}
                        className="px-3 py-1.5 text-sm text-stone-300 hover:text-white transition-colors"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        disabled={isPending}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-stone-900 text-sm font-medium rounded-lg hover:bg-stone-100 transition-colors disabled:opacity-50"
                      >
                        {isPending ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        Save All
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Hint Banner for Draft Mode */}
              {isDraft && !editingClauseId && !hasUnsavedChanges && (
                <div className="px-5 py-3 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-stone-400" />
                  <span className="text-sm text-stone-500">
                    Click any clause below to edit it directly
                  </span>
                </div>
              )}
              
              <div className="divide-y divide-stone-100">
                {Object.entries(clausesByCategory).map(([category, clauses]) => (
                  <div key={category} className="p-5">
                    <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                      {CLAUSE_CATEGORY_LABELS[category as keyof typeof CLAUSE_CATEGORY_LABELS] || category}
                    </h3>
                    <div className="space-y-4">
                      {clauses.map(clause => {
                        const isEditingThis = editingClauseId === clause.id
                        
                        return (
                          <div
                            key={clause.id}
                            className={`
                              relative rounded-xl transition-all duration-200
                              ${isEditingThis 
                                ? 'ring-2 ring-stone-900 bg-white shadow-lg' 
                                : isDraft 
                                  ? 'hover:bg-stone-50 cursor-pointer group border border-transparent hover:border-stone-200' 
                                  : 'border border-stone-100'
                              }
                            `}
                          >
                            {/* Clause Header */}
                            <div 
                              className={`
                                flex items-center justify-between p-4 
                                ${!isEditingThis && isDraft ? 'cursor-pointer' : ''}
                              `}
                              onClick={() => !isEditingThis && isDraft && startInlineEdit(clause)}
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-medium text-stone-900">{clause.title}</span>
                                {!isEditingThis && isDraft && (
                                  <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-stone-400 flex items-center gap-1">
                                    <Pencil className="w-3 h-3" />
                                    click to edit
                                  </span>
                                )}
                              </div>
                              {isEditingThis && (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      cancelInlineEdit()
                                    }}
                                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                                    title="Cancel (Esc)"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      saveInlineEdit()
                                    }}
                                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors"
                                    title="Save (⌘+Enter)"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Done
                                  </button>
                                </div>
                              )}
                            </div>
                            
                            {/* Clause Content */}
                            <div className="px-4 pb-4">
                              <AnimatePresence mode="wait">
                                {isEditingThis ? (
                                  <motion.div
                                    key="editing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                  >
                                    <textarea
                                      ref={textareaRef}
                                      value={editingContent}
                                      onChange={(e) => setEditingContent(e.target.value)}
                                      onKeyDown={handleInlineKeyDown}
                                      className="w-full min-h-[120px] p-4 text-sm text-stone-700 leading-relaxed border border-stone-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent bg-stone-50"
                                      placeholder="Enter clause content..."
                                    />
                                    <div className="flex items-center justify-between mt-2 text-[10px] text-stone-400">
                                      <span>⌘+Enter to save • Esc to cancel</span>
                                      <span>{editingContent.length} characters</span>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <motion.div
                                    key="viewing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    onClick={() => isDraft && startInlineEdit(clause)}
                                    className={isDraft ? 'cursor-pointer' : ''}
                                  >
                                    <div
                                      className="text-sm text-stone-600 prose prose-sm max-w-none leading-relaxed"
                                      dangerouslySetInnerHTML={{ __html: clause.content }}
                                    />
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
