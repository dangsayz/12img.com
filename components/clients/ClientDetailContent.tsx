'use client'

import { useState, useTransition, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building2,
  FileText,
  MessageSquare,
  Send,
  Link2,
  Copy,
  Check,
  Settings,
  Edit,
  Archive,
  ExternalLink,
  Plus,
  Trash2,
  X,
  Heart,
  Camera,
  Zap,
  Clock,
  CheckCircle2,
  AlertCircle,
  Pencil,
  Loader2,
  StickyNote,
} from 'lucide-react'
import { type ClientProfile, type ContractWithDetails, type Milestone, type DeliveryProgress, CONTRACT_STATUS_CONFIG, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
import { type Message } from '@/server/actions/message.actions'
import { generatePortalToken, type PortalToken } from '@/server/actions/portal.actions'
import { archiveClientProfile, updateClientProfile } from '@/server/actions/client.actions'
import { deleteContract } from '@/server/actions/contract.actions'
import { getClientWorkflows } from '@/server/actions/workflow.actions'
import { type ScheduledWorkflow } from '@/lib/workflows/types'
import { parseLocalDate } from '@/lib/contracts/merge-fields'
import { MessageModal } from '@/components/messages/MessageModal'
import { EditClientModal } from '@/components/clients/EditClientModal'
import { CreateContractModal } from '@/components/contracts/CreateContractModal'
import { EventCountdown } from '@/components/clients/EventCountdown'
import { MilestoneTimeline, MilestoneTimelineCompact } from '@/components/milestones'
import { DeliveryCountdown } from '@/components/milestones'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'
import { DownloadOverview } from '@/components/ui/DownloadOverview'
import { WorkflowList, WorkflowScheduler } from '@/components/workflows'

// Helper component to parse and display notes elegantly
function FormattedNotes({ notes }: { notes: string }) {
  // Parse the notes into structured sections
  const lines = notes.split('\n')
  
  // Extract structured data
  const clientData: { name?: string; email?: string; phone?: string } = {}
  const eventData: { type?: string; date?: string; venue?: string; location?: string; arrival?: string } = {}
  const packageData: { name?: string; hours?: string; investment?: string; deposit?: string } = {}
  const customNotes: string[] = []
  
  let currentSection = ''
  
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue
    
    // Detect section headers
    if (trimmed.startsWith('CLIENT:')) {
      currentSection = 'client'
      clientData.name = trimmed.replace('CLIENT:', '').trim()
    } else if (trimmed.startsWith('EVENT:')) {
      currentSection = 'event'
      eventData.type = trimmed.replace('EVENT:', '').trim()
    } else if (trimmed.startsWith('PACKAGE:')) {
      currentSection = 'package'
      packageData.name = trimmed.replace('PACKAGE:', '').trim()
    } else if (trimmed.startsWith('Email:')) {
      clientData.email = trimmed.replace('Email:', '').trim()
    } else if (trimmed.startsWith('Phone:')) {
      clientData.phone = trimmed.replace('Phone:', '').trim()
    } else if (trimmed.startsWith('Date:')) {
      eventData.date = trimmed.replace('Date:', '').trim()
    } else if (trimmed.startsWith('Venue:')) {
      eventData.venue = trimmed.replace('Venue:', '').trim()
    } else if (trimmed.startsWith('Location:')) {
      eventData.location = trimmed.replace('Location:', '').trim()
    } else if (trimmed.startsWith('Arrival:')) {
      eventData.arrival = trimmed.replace('Arrival:', '').trim()
    } else if (trimmed.startsWith('Coverage:')) {
      packageData.hours = trimmed.replace('Coverage:', '').trim()
    } else if (trimmed.startsWith('Investment:')) {
      packageData.investment = trimmed.replace('Investment:', '').trim()
    } else if (trimmed.startsWith('Deposit:')) {
      packageData.deposit = trimmed.replace('Deposit:', '').trim()
    } else if (!['CLIENT', 'EVENT', 'PACKAGE'].some(s => trimmed.startsWith(s))) {
      // Custom note that doesn't fit the structure
      customNotes.push(trimmed)
    }
  }
  
  const hasStructuredData = clientData.name || eventData.type || packageData.name
  
  // If no structured data, show as elegant plain text
  if (!hasStructuredData) {
    return (
      <div className="relative">
        <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-transparent rounded-full" />
        <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed pl-3">
          {notes}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Client Card */}
      {clientData.name && (
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-stone-900 to-stone-800 p-4 text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <Heart className="w-3 h-3 text-white/70" />
              </div>
              <span className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-medium">Client</span>
            </div>
            <p className="text-lg font-medium tracking-tight">{clientData.name}</p>
            {(clientData.email || clientData.phone) && (
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                {clientData.email && <span>{clientData.email}</span>}
                {clientData.phone && <span>{clientData.phone}</span>}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Event Card */}
      {eventData.type && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">Event</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-base font-semibold text-stone-900 mb-3">{eventData.type}</p>
            <div className="grid grid-cols-2 gap-3">
              {eventData.date && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-0.5">Date</p>
                  <p className="text-sm text-stone-700">{eventData.date}</p>
                </div>
              )}
              {eventData.arrival && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-0.5">Arrival</p>
                  <p className="text-sm text-stone-700">{eventData.arrival}</p>
                </div>
              )}
              {eventData.venue && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-0.5">Venue</p>
                  <p className="text-sm text-stone-700">{eventData.venue}</p>
                </div>
              )}
              {eventData.location && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-stone-400 mb-0.5">Location</p>
                  <p className="text-sm text-stone-700">{eventData.location}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Package Card */}
      {packageData.name && (
        <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 bg-stone-50 border-b border-stone-100">
            <div className="flex items-center gap-2">
              <Camera className="w-3.5 h-3.5 text-stone-400" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400 font-medium">Package</span>
            </div>
          </div>
          <div className="p-4">
            <p className="text-base font-semibold text-stone-900 mb-3">{packageData.name}</p>
            <div className="flex flex-wrap gap-3">
              {packageData.hours && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 rounded-lg">
                  <Clock className="w-3 h-3 text-stone-500" />
                  <span className="text-xs font-medium text-stone-600">{packageData.hours}</span>
                </div>
              )}
              {packageData.investment && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 rounded-lg">
                  <span className="text-xs font-semibold text-emerald-700">{packageData.investment}</span>
                </div>
              )}
              {packageData.deposit && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 rounded-lg">
                  <span className="text-xs font-medium text-amber-700">Deposit: {packageData.deposit}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Custom Notes */}
      {customNotes.length > 0 && (
        <div className="relative">
          <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 via-amber-300 to-transparent rounded-full" />
          <div className="pl-3 space-y-1">
            {customNotes.map((note, idx) => (
              <p key={idx} className="text-sm text-stone-600 leading-relaxed">
                {note}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// Contract row with delete functionality
function ContractRow({ 
  contract, 
  onDelete 
}: { 
  contract: ContractWithDetails
  onDelete: () => void 
}) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const canDelete = contract.status !== 'signed' && contract.status !== 'archived'

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteContract(contract.id)
    if (result.success) {
      onDelete()
    } else {
      alert(result.error?.message || 'Failed to delete contract')
    }
    setIsDeleting(false)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <div className="flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors group">
        <div className="flex items-center gap-4">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            contract.status === 'signed' 
              ? 'bg-emerald-50' 
              : contract.status === 'sent' 
                ? 'bg-blue-50' 
                : 'bg-stone-100'
          }`}>
            <FileText className={`w-5 h-5 ${
              contract.status === 'signed' 
                ? 'text-emerald-600' 
                : contract.status === 'sent' 
                  ? 'text-blue-600' 
                  : 'text-stone-500'
            }`} />
          </div>
          <div>
            <p className="font-medium text-stone-900">
              Contract #{contract.id.slice(0, 8).toUpperCase()}
            </p>
            <p className="text-sm text-stone-500 mt-0.5">
              Created{' '}
              {new Date(contract.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
              {contract.signedAt && (
                <span className="text-emerald-600 ml-2 font-medium">
                  • Signed {new Date(contract.signedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              CONTRACT_STATUS_CONFIG[contract.status].bgColor
            } ${CONTRACT_STATUS_CONFIG[contract.status].color}`}
          >
            {CONTRACT_STATUS_CONFIG[contract.status].label}
          </div>
          <Link
            href={`/dashboard/contracts/${contract.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-stone-600 hover:text-stone-900 bg-white border border-stone-200 hover:border-stone-300 rounded-xl transition-all shadow-sm opacity-0 group-hover:opacity-100"
          >
            {contract.status === 'draft' ? 'Edit' : 'View'}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Delete contract"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm p-6 shadow-2xl rounded-2xl"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
                Delete Contract?
              </h3>
              <p className="text-sm text-stone-500 text-center mb-6">
                Contract #{contract.id.slice(0, 8).toUpperCase()} will be permanently deleted. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

interface ClientDetailContentProps {
  client: ClientProfile
  contracts: ContractWithDetails[]
  messages: Message[]
  portalTokens: PortalToken[]
  milestones?: Milestone[]
  deliveryProgress?: DeliveryProgress | null
}

export function ClientDetailContent({
  client,
  contracts,
  messages,
  portalTokens,
  milestones = [],
  deliveryProgress,
}: ClientDetailContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts' | 'automations'>('overview')
  const [workflows, setWorkflows] = useState<ScheduledWorkflow[]>([])
  const [showWorkflowScheduler, setShowWorkflowScheduler] = useState(false)
  const [isLoadingWorkflows, setIsLoadingWorkflows] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showCreateContractModal, setShowCreateContractModal] = useState(false)
  const [showDeleteContractConfirm, setShowDeleteContractConfirm] = useState(false)
  const [isDeletingContract, setIsDeletingContract] = useState(false)
  const overviewRef = useRef<HTMLDivElement>(null)

  const activeToken = portalTokens.find(t => !t.isRevoked && new Date(t.expiresAt) > new Date())
  const latestContract = contracts[0]

  const handleCopyPortalLink = async () => {
    if (!activeToken) return
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
    const url = `${baseUrl}/portal/${activeToken.token}`
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleGeneratePortalLink = () => {
    startTransition(async () => {
      await generatePortalToken(client.id)
      router.refresh()
    })
  }

  const eventDate = parseLocalDate(client.eventDate)
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  // Load workflows when automations tab is selected
  const loadWorkflows = async () => {
    setIsLoadingWorkflows(true)
    try {
      const data = await getClientWorkflows(client.id)
      setWorkflows(data)
    } catch (e) {
      console.error('Failed to load workflows:', e)
    } finally {
      setIsLoadingWorkflows(false)
    }
  }

  // Handle deleting the latest contract
  const handleDeleteContract = async () => {
    if (!latestContract) return
    setIsDeletingContract(true)
    const result = await deleteContract(latestContract.id)
    if (result.success) {
      router.refresh()
    } else {
      alert(result.error?.message || 'Failed to delete contract')
    }
    setIsDeletingContract(false)
    setShowDeleteContractConfirm(false)
  }

  // Load workflows on tab switch
  const handleTabChange = (tab: 'overview' | 'contracts' | 'automations') => {
    setActiveTab(tab)
    if (tab === 'automations' && workflows.length === 0) {
      loadWorkflows()
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Link - excluded from capture */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6 group"
        data-html2canvas-ignore
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Clients
      </Link>

      {/* Capturable Overview Section */}
      <div ref={overviewRef} className="bg-white">
        {/* Hero Header */}
        <div className="mb-8">
          {/* Main Header Card */}
          <div className="relative bg-gradient-to-br from-stone-50 via-white to-stone-50 rounded-2xl border border-stone-200/60 shadow-sm">
          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="relative p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row lg:items-center gap-6">
              {/* Avatar Section */}
              <div className="flex items-center gap-5">
                <div className="relative">
                  {/* Outer ring with gradient */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-stone-300 via-stone-200 to-stone-400 rounded-full opacity-60" />
                  {/* Avatar */}
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 flex items-center justify-center shadow-lg">
                    <span className="text-2xl sm:text-3xl font-light text-white tracking-wide">
                      {client.firstName[0]}{client.lastName[0]}
                    </span>
                  </div>
                  {/* Status indicator */}
                  {latestContract?.status === 'signed' && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {!latestContract && (
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-amber-500 rounded-full flex items-center justify-center ring-4 ring-white shadow-sm">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                {/* Name & Contact */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-light text-stone-900 tracking-tight">
                      {client.partnerFirstName ? (
                        // Couples: First names only (e.g., "Angela & Christopher")
                        <>
                          {client.firstName}
                          <span className="text-stone-400 font-extralight"> & </span>
                          {client.partnerFirstName}
                        </>
                      ) : (
                        // Single client: Full name (e.g., "Angela Castillo")
                        <>{client.firstName} {client.lastName}</>
                      )}
                    </h1>
                    {client.eventType === 'wedding' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-full text-xs font-medium">
                        <Heart className="w-3 h-3" />
                        Wedding
                      </span>
                    )}
                    {client.eventType === 'portrait' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-medium">
                        <Camera className="w-3 h-3" />
                        Portrait
                      </span>
                    )}
                    {client.eventType === 'event' && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        <Calendar className="w-3 h-3" />
                        Event
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 mt-2 flex-wrap">
                    <a 
                      href={`mailto:${client.email}`}
                      className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      <span className="truncate max-w-[200px]">{client.email}</span>
                    </a>
                    {client.phone && (
                      <a 
                        href={`tel:${client.phone}`}
                        className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-stone-900 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                        {client.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Event Countdown - Desktop */}
              {eventDate && daysUntil !== null && daysUntil > 0 && (
                <div className="hidden lg:block ml-auto pl-6 border-l border-stone-200">
                  <EventCountdown 
                    eventDate={eventDate} 
                    eventType={client.eventType}
                    variant="compact"
                  />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 lg:ml-6" data-html2canvas-ignore>
                <DownloadOverview 
                  targetRef={overviewRef}
                  clientName={`${client.firstName} ${client.lastName}`}
                  variant="icon"
                />
                {activeToken ? (
                  <button
                    onClick={handleCopyPortalLink}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      copiedLink 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-sm'
                    }`}
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Link2 className="w-4 h-4" />
                        Copy Portal Link
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleGeneratePortalLink}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-sm font-medium text-stone-700 hover:bg-stone-50 hover:border-stone-300 shadow-sm transition-all disabled:opacity-50"
                  >
                    <Link2 className="w-4 h-4" />
                    Generate Portal Link
                  </button>
                )}
                <div className="relative">
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2.5 bg-white border border-stone-200 hover:bg-stone-50 hover:border-stone-300 rounded-xl transition-all shadow-sm"
                  >
                    <Settings className="w-5 h-5 text-stone-500" />
                  </button>
                  
                  {/* Dropdown Menu */}
                  {showDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setShowDropdown(false)} 
                      />
                      <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-stone-200/80 py-1.5 z-50">
                        <button
                          onClick={() => {
                            setShowDropdown(false)
                            setShowEditModal(true)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                        >
                          <Edit className="w-4 h-4 text-stone-400" />
                          Edit Client
                        </button>
                        {latestContract && latestContract.status !== 'signed' && (
                          <button
                            onClick={() => {
                              setShowDropdown(false)
                              setShowDeleteContractConfirm(true)
                            }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-stone-400" />
                            Remove Contract
                          </button>
                        )}
                        <div className="my-1 border-t border-stone-100" />
                        <button
                          onClick={() => {
                            setShowDropdown(false)
                            setShowArchiveConfirm(true)
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Archive className="w-4 h-4" />
                          Archive Client
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Event Countdown - Mobile */}
            {eventDate && daysUntil !== null && (
              <div className="lg:hidden mt-6 pt-5 border-t border-stone-200/60">
                <EventCountdown 
                  eventDate={eventDate} 
                  eventType={client.eventType}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex gap-1 p-1 bg-stone-100/80 rounded-xl flex-shrink-0">
          {(['overview', 'contracts', 'automations'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`relative px-3 sm:px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {tab === 'overview' && 'Overview'}
              {tab === 'contracts' && (
                <span className="flex items-center gap-1.5">
                  Contracts
                  {contracts.length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      activeTab === 'contracts' ? 'bg-stone-100' : 'bg-stone-200/60'
                    }`}>
                      {contracts.length}
                    </span>
                  )}
                </span>
              )}
              {tab === 'automations' && (
                <span className="flex items-center gap-1.5">
                  Automations
                  {workflows.filter(w => w.status === 'pending').length > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      activeTab === 'automations' ? 'bg-stone-100' : 'bg-stone-200/60'
                    }`}>
                      {workflows.filter(w => w.status === 'pending').length}
                    </span>
                  )}
                </span>
              )}
            </button>
          ))}
        </div>
        
        {/* Message Button - Opens Modal */}
        <button
          onClick={() => setIsMessageModalOpen(true)}
          className="ml-auto flex-shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Messages</span>
          {messages.length > 0 && (
            <span className="sm:ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            <button 
              onClick={() => setShowEditModal(true)}
              className="w-full text-left bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden hover:border-stone-300 hover:shadow-md transition-all group"
            >
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  Event Details
                </h2>
                <Pencil className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Date</p>
                    <p className="text-base font-medium text-stone-900">
                      {eventDate
                        ? eventDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : <span className="text-stone-400 italic">Not set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Event Type</p>
                    <p className="text-base font-medium text-stone-900">
                      {EVENT_TYPE_LABELS[client.eventType]}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Location</p>
                    <p className="text-base font-medium text-stone-900">
                      {client.eventLocation || <span className="text-stone-400 italic">Not set</span>}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Venue</p>
                    <p className="text-base font-medium text-stone-900">
                      {client.eventVenue || <span className="text-stone-400 italic">Not set</span>}
                    </p>
                  </div>
                </div>
              </div>
            </button>

            {/* Package */}
            <button 
              onClick={() => setShowEditModal(true)}
              className="w-full text-left bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden hover:border-stone-300 hover:shadow-md transition-all group"
            >
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-400" />
                  Package
                </h2>
                <Pencil className="w-4 h-4 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </div>
              <div className="p-6">
                {client.packageName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-medium text-stone-900">{client.packageName}</p>
                      {client.packageHours && (
                        <p className="text-sm text-stone-500 mt-0.5">{client.packageHours} hours coverage</p>
                      )}
                    </div>
                    <div className="text-right">
                      {client.packagePrice && (
                        <p className="text-3xl font-extralight text-stone-900 tabular-nums">
                          ${client.packagePrice.toLocaleString()}
                        </p>
                      )}
                      {client.retainerFee && (
                        <p className="text-xs text-stone-500 mt-1">
                          Retainer: <span className="font-medium text-stone-700">${client.retainerFee.toLocaleString()}</span>
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-stone-400 italic">No package set - click to add</p>
                )}
              </div>
            </button>

            {/* Milestone Timeline */}
            {milestones.length > 0 && (
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                  <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-stone-400" />
                    Project Timeline
                  </h2>
                </div>
                <div className="p-6">
                  <MilestoneTimeline 
                    milestones={milestones} 
                    variant="horizontal"
                    showDetails={true}
                  />
                </div>
              </div>
            )}

            {/* Notes */}
            {client.notes && (
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                  <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <StickyNote className="w-4 h-4 text-stone-400" />
                    Notes
                  </h2>
                </div>
                <div className="p-6">
                  <FormattedNotes notes={client.notes} />
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contract Status */}
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-stone-400" />
                  Contract
                </h2>
              </div>
              <div className="p-6">
                {latestContract ? (
                  <div>
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                        CONTRACT_STATUS_CONFIG[latestContract.status].bgColor
                      } ${CONTRACT_STATUS_CONFIG[latestContract.status].color}`}
                    >
                      <FileText className="w-3 h-3" />
                      {CONTRACT_STATUS_CONFIG[latestContract.status].label}
                    </div>
                    <p className="text-xs text-stone-500 mt-3">
                      Created{' '}
                      {new Date(latestContract.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <div className="flex flex-col gap-2 mt-4">
                      <Link
                        href={`/dashboard/contracts/${latestContract.id}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors justify-center shadow-sm"
                      >
                        {latestContract.status === 'draft' ? (
                          <>
                            <Edit className="w-4 h-4" />
                            Edit & Send
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4" />
                            View Contract
                          </>
                        )}
                      </Link>
                      {latestContract.status === 'draft' && (
                        <button
                          onClick={() => setShowCreateContractModal(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 border border-stone-200 text-stone-600 text-sm font-medium rounded-xl hover:bg-stone-50 hover:border-stone-300 transition-all justify-center"
                        >
                          <Plus className="w-4 h-4" />
                          New Contract
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 rounded-xl bg-stone-100 flex items-center justify-center mx-auto mb-3">
                      <FileText className="w-6 h-6 text-stone-400" />
                    </div>
                    <p className="text-sm text-stone-500 mb-4">No contract created yet</p>
                    <button
                      onClick={() => setShowCreateContractModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Create Contract
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Countdown */}
            {deliveryProgress && (
              <DeliveryCountdown 
                progress={deliveryProgress}
                variant="compact"
              />
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-stone-400" />
                  Quick Actions
                </h2>
              </div>
              <div className="p-3">
                <button
                  onClick={() => setIsMessageModalOpen(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-stone-50 rounded-xl transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Send Message</p>
                    <p className="text-xs text-stone-500">Chat via portal</p>
                  </div>
                </button>
                <a
                  href={`mailto:${client.email}`}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-stone-50 rounded-xl transition-colors group"
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Mail className="w-4 h-4 text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Send Email</p>
                    <p className="text-xs text-stone-500">{client.email}</p>
                  </div>
                </a>
                {client.phone && (
                  <a
                    href={`tel:${client.phone}`}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-stone-50 rounded-xl transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                      <Phone className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">Call Client</p>
                      <p className="text-xs text-stone-500">{client.phone}</p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'contracts' && (
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
          {contracts.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 mb-1">No contracts yet</h3>
              <p className="text-sm text-stone-500 mb-6">Create your first contract to get started</p>
              <button
                onClick={() => setShowCreateContractModal(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Create Contract
              </button>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {contracts.map((contract) => (
                <ContractRow 
                  key={contract.id} 
                  contract={contract} 
                  onDelete={() => router.refresh()}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Automations Tab Content */}
      {activeTab === 'automations' && (
        <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-stone-400" />
                Automated Emails
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Schedule emails to send automatically based on event date
              </p>
            </div>
            <button
              onClick={() => setShowWorkflowScheduler(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Automation
            </button>
          </div>
          <div className="p-6">
            {isLoadingWorkflows ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
              </div>
            ) : (
              <WorkflowList
                workflows={workflows}
                onRefresh={loadWorkflows}
              />
            )}
          </div>
        </div>
      )}
      </div>
      {/* End of capturable section */}

      {/* Workflow Scheduler Modal */}
      <WorkflowScheduler
        clientId={client.id}
        clientName={`${client.firstName} ${client.lastName}`}
        eventDate={client.eventDate}
        isOpen={showWorkflowScheduler}
        onClose={() => setShowWorkflowScheduler(false)}
        onSuccess={loadWorkflows}
      />

      {/* Message Modal */}
      <MessageModal
        isOpen={isMessageModalOpen}
        onClose={() => setIsMessageModalOpen(false)}
        clientId={client.id}
        clientName={`${client.firstName} ${client.lastName}`}
        clientEmail={client.email}
        clientPhone={client.phone || undefined}
        initialMessages={messages}
      />

      {/* Edit Client Modal */}
      <EditClientModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        client={client}
      />

      {/* Create Contract Modal */}
      <CreateContractModal
        isOpen={showCreateContractModal}
        onClose={() => setShowCreateContractModal(false)}
        client={client}
      />

      {/* Delete Contract Confirmation Modal */}
      <AnimatePresence>
        {showDeleteContractConfirm && latestContract && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowDeleteContractConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-w-sm p-6 shadow-2xl rounded-2xl"
            >
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium text-stone-900 text-center mb-2">
                Remove Contract?
              </h3>
              <p className="text-sm text-stone-500 text-center mb-6">
                Contract #{latestContract.id.slice(0, 8).toUpperCase()} will be permanently deleted. This will free up your contract quota for this month.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteContractConfirm(false)}
                  disabled={isDeletingContract}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteContract}
                  disabled={isDeletingContract}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeletingContract ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Archive Confirmation Modal */}
      <AnimatePresence>
        {showArchiveConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowArchiveConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                    <Archive className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">Archive Client</h3>
                    <p className="text-sm text-stone-500">This action can be undone</p>
                  </div>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed">
                  Are you sure you want to archive <strong className="text-stone-900">{client.firstName} {client.lastName}</strong>? 
                  They will be hidden from your client list but can be restored later.
                </p>
              </div>
              <div className="flex gap-3 p-4 bg-stone-50 border-t border-stone-100">
                <button
                  onClick={() => setShowArchiveConfirm(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium border border-stone-200 rounded-xl hover:bg-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    startTransition(async () => {
                      await archiveClientProfile(client.id)
                      router.push('/dashboard/clients')
                    })
                  }}
                  disabled={isPending}
                  className="flex-1 px-4 py-2.5 text-sm font-medium bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isPending ? 'Archiving...' : 'Archive Client'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
