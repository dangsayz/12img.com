'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  MessageSquare,
  FileText,
  Users,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react'
import { type ContractWithDetails, type ExtendedContractStatus, type Milestone, type DeliveryProgress } from '@/lib/contracts/types'
import {
  MilestoneTimeline,
  DeliveryCountdown,
  ContractStatusBadge,
  StatusTransitionPanel,
  StatusProgress,
} from '@/components/milestones'
import { getMilestones, getDeliveryProgress } from '@/server/actions/milestone.actions'

interface ContractDetailViewProps {
  contract: ContractWithDetails
  portalUrl?: string
}

export function ContractDetailView({ contract, portalUrl }: ContractDetailViewProps) {
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [deliveryProgress, setDeliveryProgress] = useState<DeliveryProgress | null>(null)
  const [currentStatus, setCurrentStatus] = useState<ExtendedContractStatus>(
    contract.status as ExtendedContractStatus
  )
  const [copied, setCopied] = useState(false)

  // Load milestones and delivery progress
  useEffect(() => {
    const loadData = async () => {
      const [milestonesResult, progressResult] = await Promise.all([
        getMilestones(contract.id),
        getDeliveryProgress(contract.id),
      ])

      if (milestonesResult.success && milestonesResult.data) {
        setMilestones(milestonesResult.data)
      }
      if (progressResult.success && progressResult.data) {
        setDeliveryProgress(progressResult.data)
      }
    }

    loadData()
  }, [contract.id])

  const handleStatusChange = (newStatus: ExtendedContractStatus) => {
    setCurrentStatus(newStatus)
    // Reload milestones after status change
    getMilestones(contract.id).then(result => {
      if (result.success && result.data) {
        setMilestones(result.data)
      }
    })
    getDeliveryProgress(contract.id).then(result => {
      if (result.success && result.data) {
        setDeliveryProgress(result.data)
      }
    })
  }

  const copyPortalUrl = () => {
    if (portalUrl) {
      navigator.clipboard.writeText(portalUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const eventDate = contract.client?.eventDate ? new Date(contract.client.eventDate) : null

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-stone-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/contracts"
                className="p-2 -ml-2 hover:bg-stone-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-stone-600" />
              </Link>
              <div className="hidden sm:block h-6 w-px bg-stone-200" />
              <div>
                <h1 className="text-base font-semibold text-stone-900">
                  {contract.client?.firstName} {contract.client?.lastName}
                  {contract.client?.partnerFirstName && ` & ${contract.client.partnerFirstName}`}
                </h1>
                <p className="text-xs text-stone-500">Contract #{contract.id.slice(0, 8)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <ContractStatusBadge status={currentStatus} />
              {portalUrl && (
                <button
                  onClick={copyPortalUrl}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-stone-600 hover:text-stone-900 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy Portal Link
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Progress Bar */}
        <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-4">
            Contract Progress
          </h2>
          <StatusProgress currentStatus={currentStatus} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Countdown */}
            {deliveryProgress && (
              <DeliveryCountdown progress={deliveryProgress} variant="full" />
            )}

            {/* Milestone Timeline */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-stone-400 uppercase tracking-wider mb-6">
                Milestone Timeline
              </h2>
              <MilestoneTimeline
                milestones={milestones}
                currentStatus={currentStatus}
                variant="vertical"
                showDetails
              />
            </div>

            {/* Communication Thread Link */}
            <Link
              href={`/dashboard/clients/${contract.clientId}`}
              className="block bg-white rounded-2xl border border-stone-200 p-6 shadow-sm hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-stone-900 group-hover:text-blue-600 transition-colors">
                      Communication Thread
                    </h3>
                    <p className="text-sm text-stone-500">
                      View messages and updates with client
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-5 h-5 text-stone-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </Link>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status Actions */}
            <StatusTransitionPanel
              contractId={contract.id}
              currentStatus={currentStatus}
              deliveryWindowDays={contract.deliveryWindowDays ?? 60}
              onStatusChange={handleStatusChange}
            />

            {/* Client Info Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                Client Details
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-stone-600" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">
                      {contract.client?.firstName} {contract.client?.lastName}
                    </p>
                    <p className="text-sm text-stone-500">{contract.client?.email}</p>
                  </div>
                </div>

                {contract.client?.partnerFirstName && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                      <Users className="w-5 h-5 text-stone-600" />
                    </div>
                    <div>
                      <p className="font-medium text-stone-900">
                        {contract.client.partnerFirstName} {contract.client.partnerLastName}
                      </p>
                      {contract.client.partnerEmail && (
                        <p className="text-sm text-stone-500">{contract.client.partnerEmail}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Info Card */}
            <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                Event Details
              </h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Date</p>
                    <p className="font-medium text-stone-900">
                      {eventDate
                        ? eventDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric',
                          })
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Location</p>
                    <p className="font-medium text-stone-900">
                      {contract.client?.eventLocation || 'Not set'}
                    </p>
                    {contract.client?.eventVenue && (
                      <p className="text-sm text-stone-500">{contract.client.eventVenue}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-stone-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-stone-500">Coverage</p>
                    <p className="font-medium text-stone-900">
                      {contract.client?.packageHours
                        ? `${contract.client.packageHours} hours`
                        : 'Not set'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Info Card */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl p-5 text-white shadow-xl">
              <h3 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-4">
                Package
              </h3>
              <p className="text-lg font-medium mb-1">
                {contract.client?.packageName || 'Custom Package'}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-light">
                  ${contract.client?.packagePrice?.toLocaleString() || '0'}
                </span>
              </div>

              {contract.client?.retainerFee && (
                <div className="mt-4 pt-4 border-t border-white/10 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Retainer</span>
                    <span>${contract.client.retainerFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-stone-400">Balance</span>
                    <span>
                      ${((contract.client.packagePrice || 0) - contract.client.retainerFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* View Contract Link */}
            <Link
              href={`/dashboard/contracts/${contract.id}/view`}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-xl transition-colors"
            >
              <FileText className="w-5 h-5" />
              View Full Contract
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
