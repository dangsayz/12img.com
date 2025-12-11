'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Users, Image, Clock, ArrowRight, Search, Filter, MoreVertical } from 'lucide-react'
import { formatBytes } from '@/lib/access/limits'

interface VaultWithDetails {
  id: string
  client_email: string
  client_name: string | null
  storage_used_bytes: number
  storage_limit_bytes: number
  image_count: number
  subscription_status: string
  billing_period: string
  starts_at: string
  expires_at: string | null
  created_at: string
  vault_plans: {
    id: string
    name: string
    storage_gb: number
  } | null
  galleries: {
    id: string
    title: string
    slug: string
  } | null
}

interface VaultsDashboardContentProps {
  vaults: VaultWithDetails[]
}

export function VaultsDashboardContent({ vaults }: VaultsDashboardContentProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'canceled'>('all')

  const filteredVaults = vaults.filter((vault) => {
    // Search filter
    const matchesSearch =
      vault.client_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vault.galleries?.title.toLowerCase().includes(searchQuery.toLowerCase())

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && vault.subscription_status === 'active') ||
      (statusFilter === 'canceled' && vault.subscription_status !== 'active')

    return matchesSearch && matchesStatus
  })

  const activeVaults = vaults.filter((v) => v.subscription_status === 'active').length
  const totalRevenue = vaults.filter((v) => v.subscription_status === 'active').length * 39 // Approximate

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-stone-900">Client Vaults</h1>
        <p className="text-stone-600 mt-1">
          Manage photo vault subscriptions for your clients
        </p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{activeVaults}</p>
              <p className="text-sm text-stone-500">Active Vaults</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">{vaults.length}</p>
              <p className="text-sm text-stone-500">Total Clients</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Image className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-stone-900">
                {vaults.reduce((sum, v) => sum + v.image_count, 0).toLocaleString()}
              </p>
              <p className="text-sm text-stone-500">Photos Stored</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            placeholder="Search by client name, email, or gallery..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-stone-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-4 py-2.5 bg-white border border-stone-200 rounded-lg focus:ring-2 focus:ring-stone-900 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="canceled">Canceled/Expired</option>
          </select>
        </div>
      </div>

      {/* Vaults list */}
      {filteredVaults.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            {vaults.length === 0 ? 'No client vaults yet' : 'No matching vaults'}
          </h3>
          <p className="text-stone-500 mb-6 max-w-md mx-auto">
            {vaults.length === 0
              ? 'When clients purchase vault storage for their photos, they will appear here.'
              : 'Try adjusting your search or filter criteria.'}
          </p>
          {vaults.length === 0 && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm text-stone-600 hover:text-stone-900"
            >
              Go to galleries to invite clients
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Gallery
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Storage
                </th>
                <th className="text-left px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {filteredVaults.map((vault) => {
                const storagePercent = Math.round(
                  (vault.storage_used_bytes / vault.storage_limit_bytes) * 100
                )

                return (
                  <tr key={vault.id} className="hover:bg-stone-50">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-stone-900">
                          {vault.client_name || 'Unnamed Client'}
                        </p>
                        <p className="text-sm text-stone-500">{vault.client_email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {vault.galleries ? (
                        <Link
                          href={`/gallery/${vault.galleries.id}`}
                          className="text-stone-900 hover:underline"
                        >
                          {vault.galleries.title}
                        </Link>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-stone-900">{vault.vault_plans?.name || 'Vault'}</span>
                      <span className="text-stone-500 text-sm ml-1">
                        ({vault.billing_period === 'annual' ? 'Yearly' : 'Monthly'})
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="w-32">
                        <div className="flex justify-between text-xs text-stone-500 mb-1">
                          <span>{vault.image_count} photos</span>
                          <span>{storagePercent}%</span>
                        </div>
                        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-stone-900 rounded-full"
                            style={{ width: `${Math.min(storagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          vault.subscription_status === 'active'
                            ? 'bg-emerald-100 text-emerald-700'
                            : vault.subscription_status === 'past_due'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            vault.subscription_status === 'active'
                              ? 'bg-emerald-500'
                              : vault.subscription_status === 'past_due'
                              ? 'bg-amber-500'
                              : 'bg-stone-400'
                          }`}
                        />
                        {vault.subscription_status === 'active'
                          ? 'Active'
                          : vault.subscription_status === 'past_due'
                          ? 'Past Due'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4 text-stone-500" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
