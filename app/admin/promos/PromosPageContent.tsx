'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Tag,
  Clock,
  Users,
  DollarSign,
  Copy,
  Check,
  ExternalLink,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Edit,
  Link as LinkIcon,
  TrendingUp,
  Target,
} from 'lucide-react'
import {
  getAllCampaigns,
  toggleCampaignActive,
  deleteCampaign,
  getPromoOverviewStats,
  getCampaignLinks,
} from '@/server/actions/promo.actions'
import {
  PromotionalCampaign,
  PromoLink,
  getSpotsRemaining,
  getTimeRemaining,
  formatDiscount,
  getPromoUrl,
  CAMPAIGN_TEMPLATES,
} from '@/lib/promos/types'
import { CreateCampaignModal } from './CreateCampaignModal'

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(cents / 100)
}

function CampaignStatusBadge({ campaign }: { campaign: PromotionalCampaign }) {
  const now = new Date()
  const start = new Date(campaign.starts_at)
  const end = new Date(campaign.ends_at)
  const spots = getSpotsRemaining(campaign)
  
  if (!campaign.is_active) {
    return (
      <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border border-[#E5E5E5] text-[#737373] bg-[#F5F5F7]">
        Paused
      </span>
    )
  }
  
  if (spots !== null && spots <= 0) {
    return (
      <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border border-[#E5E5E5] text-[#737373] bg-[#F5F5F7]">
        Sold Out
      </span>
    )
  }
  
  if (now < start) {
    return (
      <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border border-blue-200 text-blue-700 bg-blue-50">
        Scheduled
      </span>
    )
  }
  
  if (now > end) {
    return (
      <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border border-[#E5E5E5] text-[#737373] bg-[#F5F5F7]">
        Ended
      </span>
    )
  }
  
  return (
    <span className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border border-emerald-200 text-emerald-700 bg-emerald-50">
      Active
    </span>
  )
}

function CountdownDisplay({ campaign }: { campaign: PromotionalCampaign }) {
  const [time, setTime] = useState(getTimeRemaining(campaign))
  
  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(campaign))
    }, 1000)
    return () => clearInterval(interval)
  }, [campaign])
  
  if (time.isExpired) {
    return <span className="text-[#A3A3A3]">Ended</span>
  }
  
  return (
    <span className={time.isUrgent ? 'text-red-600 font-medium' : 'text-[#525252]'}>
      {time.days > 0 && `${time.days}d `}
      {time.hours}h {time.minutes}m
    </span>
  )
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-3 h-3" />
          Copied
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          {label || 'Copy'}
        </>
      )}
    </button>
  )
}

function CampaignCard({
  campaign,
  onToggle,
  onDelete,
  onEdit,
}: {
  campaign: PromotionalCampaign
  onToggle: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const [showMenu, setShowMenu] = useState(false)
  const [links, setLinks] = useState<PromoLink[]>([])
  const spots = getSpotsRemaining(campaign)
  const promoUrl = getPromoUrl(campaign.slug)
  
  useEffect(() => {
    getCampaignLinks(campaign.id).then(setLinks)
  }, [campaign.id])
  
  const mainLink = links.find(l => l.name === 'Main Link') || links[0]
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white border border-[#E5E5E5] hover:border-[#141414] transition-colors"
    >
      {/* Header */}
      <div className="p-6 border-b border-[#F5F5F7]">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h3 className="font-serif text-xl text-[#141414]">{campaign.name}</h3>
              <CampaignStatusBadge campaign={campaign} />
              {campaign.is_featured && (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#141414] text-white">
                  Featured
                </span>
              )}
            </div>
            <p className="text-sm text-[#737373] mt-1">{campaign.description}</p>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-[#F5F5F7] rounded transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-[#737373]" />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-40 bg-white border border-[#E5E5E5] shadow-lg z-10"
                >
                  <button
                    onClick={() => { onEdit(); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F5F7] flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onToggle(); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F5F7] flex items-center gap-2"
                  >
                    {campaign.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {campaign.is_active ? 'Pause' : 'Activate'}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false) }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        
        {/* Discount Badge */}
        <div className="mt-4 flex items-center gap-4">
          <span 
            className="px-3 py-1.5 text-sm font-bold"
            style={{ 
              backgroundColor: campaign.banner_bg_color, 
              color: campaign.banner_text_color 
            }}
          >
            {campaign.badge_text || formatDiscount(campaign)}
          </span>
          <span className="text-sm text-[#737373]">
            {campaign.target_plans.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(', ')}
          </span>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-4 divide-x divide-[#F5F5F7] border-b border-[#F5F5F7]">
        <div className="p-4 text-center">
          <p className="text-[10px] text-[#737373] uppercase tracking-wider">Redemptions</p>
          <p className="text-xl font-serif text-[#141414] mt-1">
            {campaign.current_redemptions}
            {campaign.max_redemptions && (
              <span className="text-sm text-[#A3A3A3]">/{campaign.max_redemptions}</span>
            )}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] text-[#737373] uppercase tracking-wider">Spots Left</p>
          <p className="text-xl font-serif text-[#141414] mt-1">
            {spots !== null ? (
              <span className={spots < 20 ? 'text-red-600' : ''}>
                {spots}
              </span>
            ) : (
              '∞'
            )}
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] text-[#737373] uppercase tracking-wider">Ends In</p>
          <p className="text-xl font-serif mt-1">
            <CountdownDisplay campaign={campaign} />
          </p>
        </div>
        <div className="p-4 text-center">
          <p className="text-[10px] text-[#737373] uppercase tracking-wider">Clicks</p>
          <p className="text-xl font-serif text-[#141414] mt-1">
            {mainLink?.clicks || 0}
          </p>
        </div>
      </div>
      
      {/* Links */}
      <div className="p-4 bg-[#FAFAFA]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-[#525252]">
            <LinkIcon className="w-4 h-4" />
            <code className="bg-white px-2 py-1 border border-[#E5E5E5] text-xs font-mono">
              {promoUrl}
            </code>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={promoUrl} label="Copy Link" />
            <a
              href={promoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] hover:border-[#141414] transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Preview
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function PromosPageContent() {
  const [campaigns, setCampaigns] = useState<PromotionalCampaign[]>([])
  const [stats, setStats] = useState<{
    activeCampaigns: number
    totalRedemptions: number
    totalRevenue: number
    totalSavings: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<PromotionalCampaign | null>(null)
  const [filter, setFilter] = useState<'all' | 'active' | 'scheduled' | 'ended'>('all')
  
  const loadData = async () => {
    setLoading(true)
    const [campaignsData, statsData] = await Promise.all([
      getAllCampaigns(),
      getPromoOverviewStats(),
    ])
    setCampaigns(campaignsData)
    setStats(statsData)
    setLoading(false)
  }
  
  useEffect(() => {
    loadData()
  }, [])
  
  const handleToggle = async (id: string) => {
    await toggleCampaignActive(id)
    loadData()
  }
  
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return
    await deleteCampaign(id)
    loadData()
  }
  
  const filteredCampaigns = campaigns.filter(c => {
    const now = new Date()
    const start = new Date(c.starts_at)
    const end = new Date(c.ends_at)
    
    switch (filter) {
      case 'active':
        return c.is_active && now >= start && now <= end
      case 'scheduled':
        return now < start
      case 'ended':
        return now > end
      default:
        return true
    }
  })
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl lg:text-4xl text-[#141414] tracking-tight">Promotional Deals</h1>
          <p className="text-[#737373] mt-1 text-sm">
            Create and manage promotional campaigns
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-[#141414] text-white hover:bg-[#262626] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>
      
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E5E5E5] p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#E5E5E5]">
                <Tag className="w-4 h-4 text-[#737373]" />
              </div>
              <div>
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Active Campaigns</p>
                <p className="text-2xl font-light text-[#141414] tabular-nums">{stats.activeCampaigns}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#E5E5E5]">
                <Users className="w-4 h-4 text-[#737373]" />
              </div>
              <div>
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Total Redemptions</p>
                <p className="text-2xl font-light text-[#141414] tabular-nums">{stats.totalRedemptions}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#E5E5E5]">
                <DollarSign className="w-4 h-4 text-[#737373]" />
              </div>
              <div>
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Promo Revenue</p>
                <p className="text-2xl font-light text-[#141414] tabular-nums">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E5E5E5] p-5">
            <div className="flex items-center gap-3">
              <div className="p-2 border border-[#E5E5E5]">
                <TrendingUp className="w-4 h-4 text-[#737373]" />
              </div>
              <div>
                <p className="text-[10px] text-[#737373] uppercase tracking-wider">Customer Savings</p>
                <p className="text-2xl font-light text-[#141414] tabular-nums">{formatCurrency(stats.totalSavings)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#E5E5E5]">
        {(['all', 'active', 'scheduled', 'ended'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              filter === tab
                ? 'border-[#141414] text-[#141414]'
                : 'border-transparent text-[#737373] hover:text-[#141414]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      {/* Campaigns List */}
      {loading ? (
        <div className="text-center py-12 text-[#737373]">Loading campaigns...</div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="text-center py-12 bg-white border border-[#E5E5E5]">
          <Target className="w-12 h-12 text-[#D4D4D4] mx-auto mb-4" />
          <p className="text-[#737373]">No campaigns found</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 text-sm font-medium text-[#141414] border-b border-[#141414]"
          >
            Create your first campaign
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <AnimatePresence>
            {filteredCampaigns.map(campaign => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onToggle={() => handleToggle(campaign.id)}
                onDelete={() => handleDelete(campaign.id)}
                onEdit={() => setEditingCampaign(campaign)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Create/Edit Modal */}
      <CreateCampaignModal
        isOpen={showCreateModal || !!editingCampaign}
        onClose={() => {
          setShowCreateModal(false)
          setEditingCampaign(null)
        }}
        onSuccess={() => {
          setShowCreateModal(false)
          setEditingCampaign(null)
          loadData()
        }}
        editingCampaign={editingCampaign}
      />
    </div>
  )
}
