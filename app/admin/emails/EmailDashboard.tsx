'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  Mail,
  Send,
  TrendingUp,
  MousePointer,
  Eye,
  Search,
  Filter,
  Download,
  Plus,
  Tag,
  MoreHorizontal,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  BarChart3,
  Clock,
  Zap,
} from 'lucide-react'
import type { EmailStats, EmailSubscriber, EmailCampaign } from '@/server/admin/emails'

interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

interface EmailDashboardProps {
  stats: EmailStats
  subscribers: PaginatedResult<EmailSubscriber>
  campaigns: PaginatedResult<EmailCampaign>
  allTags: string[]
  currentTab: string
  currentPage: number
  searchQuery?: string
  statusFilter?: string
  tagsFilter?: string
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'subscribers', label: 'Subscribers', icon: Users },
  { id: 'campaigns', label: 'Campaigns', icon: Send },
]

function StatCard({ 
  label, 
  value, 
  subValue, 
  icon: Icon, 
  trend,
  color = 'stone' 
}: { 
  label: string
  value: string | number
  subValue?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  color?: 'stone' | 'emerald' | 'amber' | 'rose'
}) {
  const colorClasses = {
    stone: 'bg-stone-50 text-stone-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }
  
  return (
    <div className="bg-white border border-[#E5E5E5] p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.positive ? '+' : ''}{trend.value}%
          </span>
        )}
      </div>
      <p className="text-2xl font-semibold text-[#141414]">{value}</p>
      <p className="text-sm text-[#525252] mt-1">{label}</p>
      {subValue && (
        <p className="text-xs text-[#8A8A8A] mt-2">{subValue}</p>
      )}
    </div>
  )
}

function SubscriberRow({ subscriber }: { subscriber: EmailSubscriber }) {
  const openRate = subscriber.emails_received > 0 
    ? ((subscriber.emails_opened / subscriber.emails_received) * 100).toFixed(0)
    : '0'
  
  const statusColors = {
    active: 'bg-emerald-100 text-emerald-700',
    unsubscribed: 'bg-stone-100 text-stone-600',
    bounced: 'bg-rose-100 text-rose-700',
    complained: 'bg-amber-100 text-amber-700',
  }
  
  return (
    <tr className="border-b border-[#E5E5E5] hover:bg-stone-50 transition-colors">
      <td className="py-4 px-4">
        <div>
          <p className="font-medium text-[#141414]">{subscriber.email}</p>
          {subscriber.name && (
            <p className="text-sm text-[#525252]">{subscriber.name}</p>
          )}
        </div>
      </td>
      <td className="py-4 px-4">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[subscriber.status]}`}>
          {subscriber.status}
        </span>
      </td>
      <td className="py-4 px-4">
        <span className="text-sm text-[#525252] capitalize">{subscriber.source}</span>
      </td>
      <td className="py-4 px-4">
        <div className="flex flex-wrap gap-1">
          {subscriber.tags.slice(0, 3).map(tag => (
            <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded bg-stone-100 text-xs text-stone-600">
              {tag}
            </span>
          ))}
          {subscriber.tags.length > 3 && (
            <span className="text-xs text-[#8A8A8A]">+{subscriber.tags.length - 3}</span>
          )}
        </div>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-sm text-[#525252]">{subscriber.emails_received}</span>
      </td>
      <td className="py-4 px-4 text-center">
        <span className="text-sm font-medium text-[#141414]">{openRate}%</span>
      </td>
      <td className="py-4 px-4 text-right">
        <span className="text-sm text-[#8A8A8A]">
          {new Date(subscriber.created_at).toLocaleDateString()}
        </span>
      </td>
    </tr>
  )
}

function CampaignCard({ campaign }: { campaign: EmailCampaign }) {
  const openRate = campaign.total_sent > 0 
    ? ((campaign.total_opened / campaign.total_sent) * 100).toFixed(1)
    : '0'
  const clickRate = campaign.total_sent > 0 
    ? ((campaign.total_clicked / campaign.total_sent) * 100).toFixed(1)
    : '0'
  
  const statusConfig = {
    draft: { color: 'bg-stone-100 text-stone-600', icon: Clock },
    scheduled: { color: 'bg-amber-100 text-amber-700', icon: Clock },
    sending: { color: 'bg-blue-100 text-blue-700', icon: Zap },
    sent: { color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    cancelled: { color: 'bg-rose-100 text-rose-700', icon: XCircle },
  }
  
  const config = statusConfig[campaign.status]
  const StatusIcon = config.icon
  
  return (
    <div className="bg-white border border-[#E5E5E5] p-5 hover:border-stone-300 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#141414] truncate">{campaign.name}</h3>
          <p className="text-sm text-[#525252] truncate mt-0.5">{campaign.subject}</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color} ml-3`}>
          <StatusIcon className="w-3 h-3" />
          {campaign.status}
        </span>
      </div>
      
      {campaign.status === 'sent' && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-[#E5E5E5]">
          <div>
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Sent</p>
            <p className="text-lg font-semibold text-[#141414]">{campaign.total_sent.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Open Rate</p>
            <p className="text-lg font-semibold text-[#141414]">{openRate}%</p>
          </div>
          <div>
            <p className="text-xs text-[#8A8A8A] uppercase tracking-wider">Click Rate</p>
            <p className="text-lg font-semibold text-[#141414]">{clickRate}%</p>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#E5E5E5]">
        <span className="text-xs text-[#8A8A8A]">
          {campaign.sent_at 
            ? `Sent ${new Date(campaign.sent_at).toLocaleDateString()}`
            : `Created ${new Date(campaign.created_at).toLocaleDateString()}`
          }
        </span>
        <button className="text-xs text-[#525252] hover:text-[#141414] transition-colors">
          View Details →
        </button>
      </div>
    </div>
  )
}

export function EmailDashboard({
  stats,
  subscribers,
  campaigns,
  allTags,
  currentTab,
  currentPage,
  searchQuery,
  statusFilter,
  tagsFilter,
}: EmailDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchQuery || '')
  const [showFilters, setShowFilters] = useState(false)
  
  const updateParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    router.push(`/admin/emails?${params.toString()}`)
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ search: search || undefined, page: '1' })
  }
  
  const handleExport = async () => {
    // TODO: Implement export
    alert('Export functionality coming soon!')
  }
  
  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E5E5]">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => updateParams({ tab: tab.id, page: '1' })}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                isActive 
                  ? 'border-[#141414] text-[#141414]' 
                  : 'border-transparent text-[#525252] hover:text-[#141414]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>
      
      {/* Overview Tab */}
      {currentTab === 'overview' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Subscribers"
              value={stats.totalSubscribers.toLocaleString()}
              subValue={`${stats.activeSubscribers.toLocaleString()} active`}
              icon={Users}
              color="stone"
            />
            <StatCard
              label="Emails Sent"
              value={stats.totalEmailsSent.toLocaleString()}
              subValue={`${stats.totalCampaigns} campaigns`}
              icon={Send}
              color="emerald"
            />
            <StatCard
              label="Avg Open Rate"
              value={`${stats.avgOpenRate.toFixed(1)}%`}
              icon={Eye}
              color="amber"
            />
            <StatCard
              label="Avg Click Rate"
              value={`${stats.avgClickRate.toFixed(1)}%`}
              icon={MousePointer}
              color="rose"
            />
          </div>
          
          {/* Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <button 
              onClick={() => updateParams({ tab: 'campaigns' })}
              className="flex items-center gap-4 p-6 bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-lg hover:from-stone-800 hover:to-stone-700 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Create Campaign</p>
                <p className="text-sm text-white/70">Send a broadcast email</p>
              </div>
            </button>
            
            <button 
              onClick={() => updateParams({ tab: 'subscribers' })}
              className="flex items-center gap-4 p-6 bg-white border border-[#E5E5E5] rounded-lg hover:border-stone-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <Users className="w-6 h-6 text-stone-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#141414]">View Subscribers</p>
                <p className="text-sm text-[#525252]">{stats.activeSubscribers.toLocaleString()} active</p>
              </div>
            </button>
            
            <button 
              onClick={handleExport}
              className="flex items-center gap-4 p-6 bg-white border border-[#E5E5E5] rounded-lg hover:border-stone-300 transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center group-hover:bg-stone-200 transition-colors">
                <Download className="w-6 h-6 text-stone-600" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-[#141414]">Export List</p>
                <p className="text-sm text-[#525252]">Download as CSV</p>
              </div>
            </button>
          </div>
          
          {/* Recent Campaigns */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#141414]">Recent Campaigns</h2>
              <button 
                onClick={() => updateParams({ tab: 'campaigns' })}
                className="text-sm text-[#525252] hover:text-[#141414] transition-colors"
              >
                View all →
              </button>
            </div>
            
            {stats.recentCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {stats.recentCampaigns.map(campaign => (
                  <CampaignCard key={campaign.id} campaign={campaign} />
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E5E5E5] p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-stone-400" />
                </div>
                <h3 className="font-medium text-[#141414] mb-2">No campaigns yet</h3>
                <p className="text-sm text-[#525252] mb-4">Create your first email campaign to engage your subscribers</p>
                <button className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors">
                  Create Campaign
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Subscribers Tab */}
      {currentTab === 'subscribers' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Search & Filters */}
          <div className="flex items-center gap-3">
            <form onSubmit={handleSearch} className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A8A8A]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-stone-400 transition-colors"
              />
            </form>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm font-medium transition-colors ${
                showFilters || statusFilter || tagsFilter
                  ? 'bg-stone-900 text-white border-stone-900'
                  : 'bg-white text-[#525252] border-[#E5E5E5] hover:border-stone-300'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
            
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-[#E5E5E5] rounded-lg text-sm font-medium text-[#525252] hover:border-stone-300 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          
          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-stone-50 border border-[#E5E5E5] rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#525252] uppercase tracking-wider mb-2">
                        Status
                      </label>
                      <select
                        value={statusFilter || ''}
                        onChange={(e) => updateParams({ status: e.target.value || undefined, page: '1' })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-stone-400"
                      >
                        <option value="">All statuses</option>
                        <option value="active">Active</option>
                        <option value="unsubscribed">Unsubscribed</option>
                        <option value="bounced">Bounced</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-[#525252] uppercase tracking-wider mb-2">
                        Tags
                      </label>
                      <select
                        value={tagsFilter || ''}
                        onChange={(e) => updateParams({ tags: e.target.value || undefined, page: '1' })}
                        className="w-full px-3 py-2 bg-white border border-[#E5E5E5] rounded-lg text-sm focus:outline-none focus:border-stone-400"
                      >
                        <option value="">All tags</option>
                        {allTags.map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button
                        onClick={() => updateParams({ status: undefined, tags: undefined, search: undefined, page: '1' })}
                        className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Subscribers Table */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-stone-50 border-b border-[#E5E5E5]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Subscriber
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Source
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Tags
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Emails
                    </th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Open Rate
                    </th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Joined
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.data.length > 0 ? (
                    subscribers.data.map((subscriber: EmailSubscriber) => (
                      <SubscriberRow key={subscriber.id} subscriber={subscriber} />
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-3">
                          <Users className="w-6 h-6 text-stone-400" />
                        </div>
                        <p className="text-[#525252]">No subscribers found</p>
                        <p className="text-sm text-[#8A8A8A] mt-1">Try adjusting your filters</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {subscribers.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5E5]">
                <p className="text-sm text-[#525252]">
                  Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, subscribers.total)} of {subscribers.total.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateParams({ page: String(currentPage - 1) })}
                    disabled={currentPage <= 1}
                    className="p-2 border border-[#E5E5E5] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm text-[#525252]">
                    Page {currentPage} of {subscribers.totalPages}
                  </span>
                  <button
                    onClick={() => updateParams({ page: String(currentPage + 1) })}
                    disabled={currentPage >= subscribers.totalPages}
                    className="p-2 border border-[#E5E5E5] rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
      
      {/* Campaigns Tab */}
      {currentTab === 'campaigns' && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="px-4 py-2 text-sm font-medium text-[#141414] border-b-2 border-[#141414]">
                All
              </button>
              <button className="px-4 py-2 text-sm font-medium text-[#525252] hover:text-[#141414] transition-colors">
                Drafts
              </button>
              <button className="px-4 py-2 text-sm font-medium text-[#525252] hover:text-[#141414] transition-colors">
                Sent
              </button>
            </div>
            
            <button className="flex items-center gap-2 px-4 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors">
              <Plus className="w-4 h-4" />
              New Campaign
            </button>
          </div>
          
          {/* Campaigns Grid */}
          {campaigns.data.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {campaigns.data.map((campaign: EmailCampaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-[#E5E5E5] p-16 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center mx-auto mb-6">
                <Mail className="w-10 h-10 text-amber-500" />
              </div>
              <h3 className="font-serif text-2xl text-[#141414] mb-3">Create Your First Campaign</h3>
              <p className="text-[#525252] max-w-md mx-auto mb-6">
                Send beautiful emails to your subscribers with special offers, updates, and announcements.
              </p>
              <button className="px-6 py-3 bg-stone-900 text-white font-medium rounded-lg hover:bg-stone-800 transition-colors">
                Create Campaign
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
