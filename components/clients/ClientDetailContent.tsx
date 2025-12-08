'use client'

import { useState, useTransition } from 'react'
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
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import { type ClientProfile, type ContractWithDetails, type Milestone, type DeliveryProgress, CONTRACT_STATUS_CONFIG, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
import { type Message } from '@/server/actions/message.actions'
import { generatePortalToken, getPortalUrl, type PortalToken } from '@/server/actions/portal.actions'
import { archiveClientProfile } from '@/server/actions/client.actions'
import { MessageModal } from '@/components/messages/MessageModal'
import { EditClientModal } from '@/components/clients/EditClientModal'
import { CreateContractModal } from '@/components/contracts/CreateContractModal'
import { EventCountdown } from '@/components/clients/EventCountdown'
import { MilestoneTimeline, MilestoneTimelineCompact } from '@/components/milestones'
import { DeliveryCountdown } from '@/components/milestones'
import { ContractStatusBadge } from '@/components/contracts/ContractStatusBadge'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'contracts'>('overview')
  const [copiedLink, setCopiedLink] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)
  const [showCreateContractModal, setShowCreateContractModal] = useState(false)

  const activeToken = portalTokens.find(t => !t.isRevoked && new Date(t.expiresAt) > new Date())
  const latestContract = contracts[0]

  const handleCopyPortalLink = async () => {
    if (!activeToken) return
    const url = await getPortalUrl(activeToken.token)
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

  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const daysUntil = eventDate
    ? Math.ceil((eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/clients"
          className="inline-flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Clients
        </Link>

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
                      {client.firstName}
                      {client.partnerFirstName && (
                        <span className="text-stone-400 font-extralight"> & </span>
                      )}
                      {client.partnerFirstName || client.lastName}
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
                        <Sparkles className="w-3 h-3" />
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
              <div className="flex items-center gap-2 lg:ml-6">
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
      <div className="flex items-center gap-1 mb-6">
        <div className="flex gap-1 p-1 bg-stone-100/80 rounded-xl">
          {(['overview', 'contracts'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all ${
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
            </button>
          ))}
        </div>
        
        {/* Message Button - Opens Modal */}
        <button
          onClick={() => setIsMessageModalOpen(true)}
          className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors shadow-sm"
        >
          <MessageSquare className="w-4 h-4" />
          Messages
          {messages.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">
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
            <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-stone-400" />
                  Event Details
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="group">
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
                  <div className="group">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Event Type</p>
                    <p className="text-base font-medium text-stone-900">
                      {EVENT_TYPE_LABELS[client.eventType]}
                    </p>
                  </div>
                  <div className="group">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Location</p>
                    <p className="text-base font-medium text-stone-900">
                      {client.eventLocation || <span className="text-stone-400 italic">Not set</span>}
                    </p>
                  </div>
                  <div className="group">
                    <p className="text-xs font-medium text-stone-400 uppercase tracking-wider mb-1.5">Venue</p>
                    <p className="text-base font-medium text-stone-900">
                      {client.eventVenue || <span className="text-stone-400 italic">Not set</span>}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package */}
            {client.packageName && (
              <div className="bg-white rounded-2xl border border-stone-200/60 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 bg-stone-50/50">
                  <h2 className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    Package
                  </h2>
                </div>
                <div className="p-6">
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
                </div>
              </div>
            )}

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
                  <h2 className="text-sm font-semibold text-stone-900">Notes</h2>
                </div>
                <div className="p-6">
                  <p className="text-sm text-stone-600 whitespace-pre-wrap leading-relaxed">{client.notes}</p>
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
                  <Sparkles className="w-4 h-4 text-stone-400" />
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
              {contracts.map((contract, index) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-5 hover:bg-stone-50/50 transition-colors group"
                >
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
                  <div className="flex items-center gap-3">
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
