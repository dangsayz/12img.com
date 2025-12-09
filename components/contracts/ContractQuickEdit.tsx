'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { InlineEditField } from './InlineEditField'
import { updateClientProfile } from '@/server/actions/client.actions'
import { regenerateContractHtml } from '@/server/actions/contract.actions'
import { type ClientProfile, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
import { parseLocalDate } from '@/lib/contracts/merge-fields'
import type { EventType } from '@/types/database'

interface ContractQuickEditProps {
  client: ClientProfile
  contractId: string
  disabled?: boolean
}

const EVENT_TYPE_OPTIONS = Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}))

// Common retainer amounts in dollars
const COMMON_RETAINER_AMOUNTS = [250, 500, 1000]

export function ContractQuickEdit({ client, contractId, disabled = false }: ContractQuickEditProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [customAmount, setCustomAmount] = useState<string>('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Helper to update a single field
  const updateField = async (field: string, value: string | number | null) => {
    const result = await updateClientProfile(client.id, { [field]: value })
    
    if (result.success) {
      // Regenerate contract HTML with updated data
      await regenerateContractHtml(contractId)
      router.refresh()
    }
    
    return {
      success: result.success,
      error: result.error?.message,
    }
  }

  // Update retainer by dollar amount
  const updateRetainerAmount = (amount: number) => {
    if (disabled) return
    
    startTransition(async () => {
      await updateField('retainerFee', amount)
      setShowCustomInput(false)
      setCustomAmount('')
    })
  }

  // Handle custom amount input
  const handleCustomAmountSubmit = () => {
    const amount = parseInt(customAmount)
    if (isNaN(amount) || amount < 0) return
    updateRetainerAmount(amount)
  }

  const eventDate = parseLocalDate(client.eventDate)
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined

  const balanceDue = client.packagePrice && client.retainerFee
    ? client.packagePrice - client.retainerFee
    : null

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <div className="border border-stone-200 rounded-xl overflow-hidden">
        {/* Event Type Badge */}
        <div className="px-4 py-3 bg-stone-50 border-b border-stone-200">
          <InlineEditField
            value={client.eventType}
            displayValue={EVENT_TYPE_LABELS[client.eventType as EventType] || client.eventType}
            onSave={v => updateField('eventType', v)}
            type="select"
            options={EVENT_TYPE_OPTIONS}
            disabled={disabled}
            className="inline-block"
          />
        </div>

        {/* Event Grid */}
        <div className="grid grid-cols-3 divide-x divide-stone-200">
          {/* Date */}
          <div className="p-4 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Date</p>
            <InlineEditField
              value={client.eventDate}
              displayValue={formattedDate}
              onSave={v => updateField('eventDate', v)}
              type="date"
              placeholder="Not set"
              disabled={disabled}
              className="font-medium text-stone-900 text-sm justify-center"
            />
          </div>

          {/* Location */}
          <div className="p-4 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Location</p>
            <InlineEditField
              value={client.eventLocation}
              onSave={v => updateField('eventLocation', v)}
              type="text"
              placeholder="Not set"
              disabled={disabled}
              className="font-medium text-stone-900 text-sm justify-center"
            />
          </div>

          {/* Venue */}
          <div className="p-4 text-center">
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mb-1">Venue</p>
            <InlineEditField
              value={client.eventVenue}
              onSave={v => updateField('eventVenue', v)}
              type="text"
              placeholder="Not set"
              disabled={disabled}
              className="font-medium text-stone-900 text-sm justify-center"
            />
          </div>
        </div>
      </div>

      {/* Investment Summary Card */}
      <div className="bg-stone-900 rounded-xl overflow-hidden text-white">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">Investment Summary</p>
        </div>

        {/* Package Info */}
        <div className="p-4 flex items-center justify-between">
          <div className="space-y-1 flex-1">
            {/* Package Name */}
            <InlineEditField
              value={client.packageName}
              onSave={v => updateField('packageName', v)}
              type="text"
              placeholder="Package name"
              disabled={disabled}
              className="text-lg font-medium"
              dark
            />
            {/* Package Hours */}
            <div className="flex items-center gap-1 text-stone-400 text-sm">
              <InlineEditField
                value={client.packageHours}
                onSave={v => updateField('packageHours', v)}
                type="number"
                min={1}
                max={24}
                placeholder="0"
                disabled={disabled}
                className="inline-flex"
                dark
              />
              <span className="text-stone-500">hours of coverage</span>
            </div>
          </div>

          {/* Package Price */}
          <div className="text-right">
            <InlineEditField
              value={client.packagePrice}
              displayValue={client.packagePrice ? `$${client.packagePrice.toLocaleString()}` : undefined}
              onSave={v => updateField('packagePrice', v)}
              type="currency"
              min={0}
              max={1000000}
              placeholder="$0"
              disabled={disabled}
              className="text-3xl font-light"
              dark
            />
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="border-t border-white/10">
          {/* Retainer Percentage Selector */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-stone-400 text-sm">Retainer Amount</span>
              {isPending && <Loader2 className="w-4 h-4 text-white/60 animate-spin" />}
            </div>
            
            <div className="flex gap-2">
              {COMMON_RETAINER_AMOUNTS.map(amount => (
                <button
                  key={amount}
                  onClick={() => updateRetainerAmount(amount)}
                  disabled={disabled || isPending}
                  className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg border transition-all ${
                    client.retainerFee === amount
                      ? 'bg-white text-stone-900 border-white'
                      : 'bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/5'
                  } disabled:opacity-50`}
                >
                  ${amount.toLocaleString()}
                </button>
              ))}
              
              {/* Custom amount button/input */}
              {showCustomInput ? (
                <div className="flex-1 flex gap-1">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                    <input
                      type="number"
                      value={customAmount}
                      onChange={e => setCustomAmount(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomAmountSubmit()}
                      placeholder="0"
                      min={0}
                      className="w-full py-2.5 pl-7 pr-3 text-sm text-stone-900 bg-white rounded-lg border border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleCustomAmountSubmit}
                    disabled={!customAmount || isPending}
                    className="px-3 py-2 text-sm font-medium bg-white text-stone-900 rounded-lg disabled:opacity-50"
                  >
                    ✓
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowCustomInput(true)}
                  disabled={disabled || isPending}
                  className={`flex-1 py-2.5 px-3 text-sm font-medium rounded-lg border transition-all ${
                    client.retainerFee !== null && !COMMON_RETAINER_AMOUNTS.includes(client.retainerFee || 0)
                      ? 'bg-white text-stone-900 border-white'
                      : 'bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/5'
                  } disabled:opacity-50`}
                >
                  {client.retainerFee !== null && !COMMON_RETAINER_AMOUNTS.includes(client.retainerFee || 0)
                    ? `$${client.retainerFee?.toLocaleString()}`
                    : 'Custom'}
                </button>
              )}
            </div>
          </div>

          {/* Calculated Values */}
          <div className="flex divide-x divide-white/10">
            {/* Retainer Amount */}
            <div className="flex-1 p-4 flex items-center justify-between">
              <span className="text-stone-400 text-sm">Retainer Due</span>
              <span className="font-medium text-sm text-white">
                {client.retainerFee ? `$${client.retainerFee.toLocaleString()}` : '—'}
              </span>
            </div>

            {/* Balance */}
            <div className="flex-1 p-4 flex items-center justify-between">
              <span className="text-stone-400 text-sm">Balance Due</span>
              <span className="font-medium text-sm text-white">
                {balanceDue !== null ? `$${balanceDue.toLocaleString()}` : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
