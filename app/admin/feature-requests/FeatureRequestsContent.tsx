'use client'

import { useState } from 'react'
import { createBrowserClient } from '@/lib/supabase/client'
import { MessageSquare, Mail, Clock, CheckCircle, Lightbulb, X, Rocket, Archive } from 'lucide-react'
import type { FeatureRequest } from './page'

const STATUS_CONFIG = {
  new: { label: 'New', color: 'bg-blue-100 text-blue-700', icon: MessageSquare },
  reviewed: { label: 'Reviewed', color: 'bg-stone-100 text-stone-700', icon: CheckCircle },
  planned: { label: 'Planned', color: 'bg-amber-100 text-amber-700', icon: Lightbulb },
  shipped: { label: 'Shipped', color: 'bg-emerald-100 text-emerald-700', icon: Rocket },
  declined: { label: 'Declined', color: 'bg-red-100 text-red-700', icon: X },
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString()
}

interface Props {
  initialRequests: FeatureRequest[]
}

export function FeatureRequestsContent({ initialRequests }: Props) {
  const [requests, setRequests] = useState<FeatureRequest[]>(initialRequests)
  const [filter, setFilter] = useState<string>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesValue, setNotesValue] = useState('')

  const supabase = createBrowserClient()

  const updateStatus = async (id: string, status: FeatureRequest['status']) => {
    const { error } = await supabase
      .from('feature_requests')
      .update({ status })
      .eq('id', id)

    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    }
  }

  const saveNotes = async (id: string) => {
    const { error } = await supabase
      .from('feature_requests')
      .update({ admin_notes: notesValue })
      .eq('id', id)

    if (!error) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, admin_notes: notesValue } : r))
      setEditingNotes(null)
    }
  }

  const filteredRequests = filter === 'all' 
    ? requests 
    : requests.filter(r => r.status === filter)

  const counts = {
    all: requests.length,
    new: requests.filter(r => r.status === 'new').length,
    reviewed: requests.filter(r => r.status === 'reviewed').length,
    planned: requests.filter(r => r.status === 'planned').length,
    shipped: requests.filter(r => r.status === 'shipped').length,
    declined: requests.filter(r => r.status === 'declined').length,
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'new', 'reviewed', 'planned', 'shipped', 'declined'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              filter === status
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {status === 'all' ? 'All' : STATUS_CONFIG[status].label} ({counts[status]})
          </button>
        ))}
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500">No feature requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((req) => {
            const StatusIcon = STATUS_CONFIG[req.status].icon
            return (
              <div key={req.id} className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Status Badge */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_CONFIG[req.status].color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[req.status].label}
                      </span>
                      <span className="text-xs text-stone-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(req.created_at)}
                      </span>
                    </div>

                    {/* Request Text */}
                    <p className="text-stone-900 whitespace-pre-wrap">{req.request}</p>

                    {/* Email */}
                    {req.email && (
                      <p className="text-sm text-stone-500 mt-2 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        {req.email}
                      </p>
                    )}

                    {/* Admin Notes */}
                    {editingNotes === req.id ? (
                      <div className="mt-3">
                        <textarea
                          value={notesValue}
                          onChange={(e) => setNotesValue(e.target.value)}
                          placeholder="Add internal notes..."
                          className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-stone-900"
                          rows={2}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => saveNotes(req.id)}
                            className="px-3 py-1.5 text-xs bg-stone-900 text-white rounded-lg hover:bg-stone-800"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingNotes(null)}
                            className="px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : req.admin_notes ? (
                      <button
                        onClick={() => { setEditingNotes(req.id); setNotesValue(req.admin_notes || '') }}
                        className="mt-3 text-sm text-stone-500 italic hover:text-stone-700"
                      >
                        Notes: {req.admin_notes}
                      </button>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(req.id); setNotesValue('') }}
                        className="mt-3 text-xs text-stone-400 hover:text-stone-600"
                      >
                        + Add notes
                      </button>
                    )}
                  </div>

                  {/* Status Actions */}
                  <div className="flex flex-col gap-1">
                    {(['new', 'reviewed', 'planned', 'shipped', 'declined'] as const).map((status) => {
                      if (status === req.status) return null
                      const Icon = STATUS_CONFIG[status].icon
                      return (
                        <button
                          key={status}
                          onClick={() => updateStatus(req.id, status)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                        >
                          <Icon className="w-3 h-3" />
                          {STATUS_CONFIG[status].label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
