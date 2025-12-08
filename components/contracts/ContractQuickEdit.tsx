'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { InlineEditField } from './InlineEditField'
import { updateClientProfile } from '@/server/actions/client.actions'
import { regenerateContractHtml } from '@/server/actions/contract.actions'
import { type ClientProfile, EVENT_TYPE_LABELS } from '@/lib/contracts/types'
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

const RETAINER_PERCENTAGES = [25, 50, 100]

export function ContractQuickEdit({ client, contractId, disabled = false }: ContractQuickEditProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [customPercent, setCustomPercent] = useState<string>('')
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

  // Update retainer by percentage
  const updateRetainerByPercent = (percent: number) => {
    if (!client.packagePrice || disabled) return
    
    startTransition(async () => {
      const retainerAmount = Math.round((client.packagePrice! * percent) / 100)
      await updateField('retainerFee', retainerAmount)
      setShowCustomInput(false)
      setCustomPercent('')
    })
  }

  // Handle custom percentage input
  const handleCustomPercentSubmit = () => {
    const percent = parseInt(customPercent)
    if (isNaN(percent) || percent < 0 || percent > 100) return
    updateRetainerByPercent(percent)
  }

  const eventDate = client.eventDate ? new Date(client.eventDate) : null
  const formattedDate = eventDate
    ? eventDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : undefined

  // Calculate retainer percentage if both values exist
  const retainerPercentage = client.packagePrice && client.retainerFee
    ? Math.round((client.retainerFee / client.packagePrice) * 100)
    : null

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
            
            {client.packagePrice ? (
              <div className="flex gap-2">
                {RETAINER_PERCENTAGES.map(percent => (
                  <button
                    key={percent}
                    onClick={() => updateRetainerByPercent(percent)}
                    disabled={disabled || isPending}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                      retainerPercentage === percent
                        ? 'bg-white text-stone-900 border-white'
                        : 'bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/5'
                    } disabled:opacity-50`}
                  >
                    {percent}%
                    <span className="block text-xs opacity-60 mt-0.5">
                      ${Math.round((client.packagePrice! * percent) / 100).toLocaleString()}
                    </span>
                  </button>
                ))}
                
                {/* Custom percentage button/input */}
                {showCustomInput ? (
                  <div className="flex-1 flex gap-1">
                    <input
                      type="number"
                      value={customPercent}
                      onChange={e => setCustomPercent(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleCustomPercentSubmit()}
                      placeholder="%"
                      min={0}
                      max={100}
                      className="w-full py-2 px-3 text-sm text-stone-900 bg-white rounded-lg border border-white focus:outline-none focus:ring-2 focus:ring-white/50"
                      autoFocus
                    />
                    <button
                      onClick={handleCustomPercentSubmit}
                      disabled={!customPercent || isPending}
                      className="px-3 py-2 text-sm font-medium bg-white text-stone-900 rounded-lg disabled:opacity-50"
                    >
                      ✓
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowCustomInput(true)}
                    disabled={disabled || isPending}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg border transition-all ${
                      retainerPercentage !== null && !RETAINER_PERCENTAGES.includes(retainerPercentage)
                        ? 'bg-white text-stone-900 border-white'
                        : 'bg-transparent text-white border-white/20 hover:border-white/40 hover:bg-white/5'
                    } disabled:opacity-50`}
                  >
                    {retainerPercentage !== null && !RETAINER_PERCENTAGES.includes(retainerPercentage) 
                      ? `${retainerPercentage}%` 
                      : 'Other'}
                    {retainerPercentage !== null && !RETAINER_PERCENTAGES.includes(retainerPercentage) && (
                      <span className="block text-xs opacity-60 mt-0.5">
                        ${client.retainerFee?.toLocaleString()}
                      </span>
                    )}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-sm text-stone-500 italic">Set package price first</p>
            )}
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
