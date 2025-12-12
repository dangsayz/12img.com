'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HardDrive,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ArrowUpRight,
  ExternalLink,
  ChevronDown,
  Database,
  Image as ImageIcon,
  Archive,
  Folder,
  Zap,
} from 'lucide-react'
import type { 
  StorageSummary, 
  UserStorageRecord, 
  StorageGrowthPoint,
  BucketStats,
} from '@/server/admin/storage'

interface Props {
  summary: StorageSummary
  topUsers: UserStorageRecord[]
  growth: StorageGrowthPoint[]
  conversionTargets: {
    hotLeads: UserStorageRecord[]
    warmLeads: UserStorageRecord[]
    upgradeReady: UserStorageRecord[]
  }
  buckets: BucketStats[]
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatGB(bytes: number): string {
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function ProgressBar({ 
  percent, 
  size = 'md',
  showLabel = true,
}: { 
  percent: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}) {
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-4' : 'h-2.5'
  const color = percent >= 90 
    ? 'bg-red-500' 
    : percent >= 80 
    ? 'bg-amber-500' 
    : percent >= 50 
    ? 'bg-emerald-500' 
    : 'bg-[#141414]'
  
  return (
    <div className="w-full">
      <div className={`w-full bg-[#E5E5E5] ${height} overflow-hidden`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(percent, 100)}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={`${height} ${color}`}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-[#737373] mt-1">{percent.toFixed(1)}%</p>
      )}
    </div>
  )
}

function StatCard({ 
  title, 
  value, 
  subtitle,
  icon: Icon,
  trend,
  highlight,
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
  highlight?: boolean
}) {
  return (
    <div className={`p-4 lg:p-5 border transition-colors ${
      highlight 
        ? 'bg-[#141414] text-white border-[#141414]' 
        : 'bg-white border-[#E5E5E5] hover:border-[#141414]'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-xs uppercase tracking-wider ${highlight ? 'text-white/60' : 'text-[#525252]'}`}>
            {title}
          </p>
          <p className={`mt-1 text-2xl lg:text-3xl font-serif ${highlight ? 'text-white' : 'text-[#141414]'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-xs ${highlight ? 'text-white/60' : 'text-[#737373]'}`}>
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs">
              {trend.positive ? (
                <TrendingUp className={`w-3 h-3 ${highlight ? 'text-emerald-400' : 'text-emerald-600'}`} />
              ) : (
                <TrendingDown className={`w-3 h-3 ${highlight ? 'text-red-400' : 'text-red-600'}`} />
              )}
              <span className={trend.positive 
                ? (highlight ? 'text-emerald-400' : 'text-emerald-600') 
                : (highlight ? 'text-red-400' : 'text-red-600')
              }>
                {trend.positive ? '+' : ''}{trend.value}%
              </span>
            </div>
          )}
        </div>
        <div className={`p-2 border ${highlight ? 'border-white/20' : 'border-[#E5E5E5]'}`}>
          <Icon className={`w-4 h-4 ${highlight ? 'text-white' : 'text-[#525252]'}`} />
        </div>
      </div>
    </div>
  )
}

export function StorageContent({
  summary,
  topUsers,
  growth,
  conversionTargets,
  buckets,
}: Props) {
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'conversion' | 'buckets'>('leaderboard')
  const [showAllUsers, setShowAllUsers] = useState(false)
  
  const displayedUsers = showAllUsers ? topUsers : topUsers.slice(0, 20)
  const totalHotLeads = conversionTargets.hotLeads.length + conversionTargets.warmLeads.length
  
  // Calculate growth trend
  const latestGrowth = growth.length > 1 ? growth[growth.length - 1] : null
  const growthTrend = latestGrowth?.dailyGrowthPercent 
    ? { value: Math.abs(latestGrowth.dailyGrowthPercent), positive: latestGrowth.dailyGrowthPercent > 0 }
    : undefined
  
  return (
    <div className="space-y-6">
      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <div className="col-span-2 lg:col-span-1">
          <StatCard
            title="Total Storage"
            value={formatGB(summary.totalBytes)}
            subtitle={`${summary.totalImages.toLocaleString()} images`}
            icon={HardDrive}
            highlight
          />
        </div>
        <StatCard
          title="Avg per User"
          value={formatBytes(summary.avgBytesPerUser)}
          subtitle={`${summary.totalUsers.toLocaleString()} users`}
          icon={Users}
        />
        <StatCard
          title="At 80%+ Capacity"
          value={summary.usersOver80Percent}
          subtitle="Upgrade targets"
          icon={AlertTriangle}
        />
        <StatCard
          title="At 90%+ Capacity"
          value={summary.usersOver90Percent}
          subtitle="Critical alerts"
          icon={Zap}
        />
      </div>
      
      {/* Storage by Plan */}
      <div className="bg-white border border-[#E5E5E5] p-4 lg:p-6">
        <h2 className="font-serif text-xl text-[#141414] mb-4">Storage by Plan</h2>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.storageByPlan.map((plan) => (
            <div key={plan.plan} className="p-4 border border-[#E5E5E5]">
              <p className="text-xs uppercase tracking-wider text-[#525252]">{plan.plan}</p>
              <p className="text-xl font-serif text-[#141414] mt-1">{formatBytes(plan.bytes)}</p>
              <p className="text-xs text-[#737373] mt-1">{plan.users} users</p>
            </div>
          ))}
        </div>
        
        {/* Visual breakdown */}
        <div className="mt-6">
          <div className="flex h-8 overflow-hidden border border-[#E5E5E5]">
            {summary.storageByPlan.map((plan, i) => {
              const percent = summary.totalBytes > 0 
                ? (plan.bytes / summary.totalBytes) * 100 
                : 0
              const colors = ['bg-[#141414]', 'bg-[#525252]', 'bg-[#737373]', 'bg-[#A3A3A3]', 'bg-[#D4D4D4]']
              return (
                <motion.div
                  key={plan.plan}
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className={`${colors[i % colors.length]} flex items-center justify-center`}
                  title={`${plan.plan}: ${percent.toFixed(1)}%`}
                >
                  {percent > 10 && (
                    <span className="text-xs text-white font-medium">{plan.plan}</span>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Conversion Alert */}
      {totalHotLeads > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#141414] text-white p-4 lg:p-5 flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 border border-white/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium">
                {totalHotLeads} Storage-Based Conversion Opportunities
              </p>
              <p className="text-sm text-white/60">
                {conversionTargets.hotLeads.length} hot leads at 80%+ · {conversionTargets.warmLeads.length} warm leads at 50%+
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('conversion')}
            className="px-4 py-2 bg-white text-[#141414] text-sm font-medium hover:bg-white/90 transition-colors"
          >
            View Leads
          </button>
        </motion.div>
      )}
      
      {/* Tabs */}
      <div className="border-b border-[#E5E5E5] overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {[
            { key: 'leaderboard', label: 'Leaderboard', mobileLabel: 'Leaders', count: topUsers.length },
            { key: 'conversion', label: 'Conversion Targets', mobileLabel: 'Targets', count: totalHotLeads },
            { key: 'buckets', label: 'Bucket Analytics', mobileLabel: 'Buckets', count: buckets.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors relative whitespace-nowrap ${
                activeTab === tab.key
                  ? 'text-[#141414]'
                  : 'text-[#737373] hover:text-[#525252]'
              }`}
            >
              <span className="sm:hidden">{tab.mobileLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count > 0 && (
                <span className={`ml-1 sm:ml-2 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs ${
                  activeTab === tab.key ? 'bg-[#141414] text-white' : 'bg-[#E5E5E5] text-[#525252]'
                }`}>
                  {tab.count}
                </span>
              )}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="storageTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'leaderboard' && (
          <motion.div
            key="leaderboard"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-[#E5E5E5]"
          >
            {/* Mobile: stacked cards */}
            <div className="divide-y divide-[#E5E5E5] md:hidden">
              {displayedUsers.map((user, index) => (
                <div 
                  key={user.userId} 
                  className={`p-4 space-y-3 ${
                    user.isAtRisk ? 'bg-red-50/30' : 
                    user.upgradePotential === 'HOT' ? 'bg-emerald-50/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-[#737373]">#{index + 1}</span>
                        <p className="font-medium text-[#141414] truncate text-sm">
                          {user.businessName || user.email}
                        </p>
                      </div>
                      {user.businessName && (
                        <p className="text-[10px] text-[#737373] truncate mt-0.5">{user.email}</p>
                      )}
                    </div>
                    <Link
                      href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                      className="p-2 border border-[#E5E5E5] hover:border-[#141414] transition-colors flex-shrink-0"
                    >
                      <ExternalLink className="w-4 h-4 text-[#525252]" />
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 border border-[#E5E5E5] text-[#525252] uppercase text-[10px]">
                      {user.plan}
                    </span>
                    <span className="px-2 py-0.5 border border-[#E5E5E5] bg-[#FAFAFA] text-[#525252]">
                      {user.galleryCount} galleries
                    </span>
                    <span className="px-2 py-0.5 border border-[#E5E5E5] bg-[#FAFAFA] text-[#525252]">
                      {user.totalImages.toLocaleString()} images
                    </span>
                    {user.upgradePotential !== 'NONE' ? (
                      <span className={`px-2 py-0.5 text-[10px] font-medium uppercase ${
                        user.upgradePotential === 'HOT' 
                          ? 'bg-emerald-100 text-emerald-700'
                          : user.upgradePotential === 'WARM'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-[#F5F5F7] text-[#525252]'
                      }`}>
                        {user.upgradePotential.replace('_', ' ')}
                      </span>
                    ) : user.isAtRisk ? (
                      <span className="px-2 py-0.5 text-[10px] font-medium uppercase bg-red-100 text-red-700">
                        AT RISK
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-[#525252]">{user.storageMB} MB / {user.storageLimitMB} MB</span>
                      <span className="text-[#737373]">{user.storagePercent.toFixed(1)}%</span>
                    </div>
                    <ProgressBar percent={user.storagePercent} size="sm" showLabel={false} />
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: full table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAFAFA] border-b border-[#E5E5E5]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      #
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      User
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Plan
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Galleries
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Images
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Storage
                    </th>
                    <th className="w-48 px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="text-center px-4 py-3 text-xs font-medium text-[#525252] uppercase tracking-wider">
                      Status
                    </th>
                    <th className="w-10 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {displayedUsers.map((user, index) => (
                    <tr 
                      key={user.userId} 
                      className={`hover:bg-[#FAFAFA] transition-colors ${
                        user.isAtRisk ? 'bg-red-50/30' : 
                        user.upgradePotential === 'HOT' ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      <td className="px-4 py-3 text-[#737373]">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="min-w-0">
                          <p className="font-medium text-[#141414] truncate">
                            {user.businessName || user.email}
                          </p>
                          {user.businessName && (
                            <p className="text-xs text-[#737373] truncate">{user.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-xs font-medium uppercase tracking-wider border border-[#E5E5E5]">
                          {user.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-[#525252]">
                        {user.galleryCount}
                      </td>
                      <td className="px-4 py-3 text-center text-[#525252]">
                        {user.totalImages.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="font-medium text-[#141414]">{user.storageMB} MB</span>
                        <span className="text-xs text-[#737373] ml-1">/ {user.storageLimitMB} MB</span>
                      </td>
                      <td className="px-4 py-3">
                        <ProgressBar percent={user.storagePercent} size="sm" />
                      </td>
                      <td className="px-4 py-3 text-center">
                        {user.upgradePotential !== 'NONE' ? (
                          <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                            user.upgradePotential === 'HOT' 
                              ? 'bg-emerald-100 text-emerald-700'
                              : user.upgradePotential === 'WARM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-[#F5F5F7] text-[#525252]'
                          }`}>
                            {user.upgradePotential.replace('_', ' ')}
                          </span>
                        ) : user.isAtRisk ? (
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-red-100 text-red-700">
                            AT RISK
                          </span>
                        ) : (
                          <span className="text-[#737373]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                          className="p-1.5 hover:bg-[#F5F5F7] transition-colors inline-flex"
                        >
                          <ExternalLink className="w-4 h-4 text-[#525252]" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {topUsers.length > 20 && (
              <div className="px-4 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
                <button
                  onClick={() => setShowAllUsers(!showAllUsers)}
                  className="text-sm text-[#525252] hover:text-[#141414] transition-colors flex items-center gap-1"
                >
                  {showAllUsers ? 'Show Less' : `Show All ${topUsers.length} Users`}
                  <ChevronDown className={`w-4 h-4 transition-transform ${showAllUsers ? 'rotate-180' : ''}`} />
                </button>
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'conversion' && (
          <motion.div
            key="conversion"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Hot Leads */}
            {conversionTargets.hotLeads.length > 0 && (
              <div className="bg-white border border-[#E5E5E5]">
                <div className="px-4 py-3 border-b border-[#E5E5E5] bg-emerald-50">
                  <h3 className="font-medium text-emerald-800 flex items-center gap-2">
                    <Zap className="w-4 h-4" />
                    Hot Leads — 80%+ Storage Used (Free Plan)
                  </h3>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    These users are hitting their limits. High probability of conversion.
                  </p>
                </div>
                <div className="divide-y divide-[#E5E5E5]">
                  {conversionTargets.hotLeads.map((user) => (
                    <div key={user.userId} className="p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#141414]">{user.businessName || user.email}</p>
                        <p className="text-xs text-[#737373]">
                          {user.galleryCount} galleries · {user.totalImages} images · {user.storagePercent.toFixed(1)}% used
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-24">
                          <ProgressBar percent={user.storagePercent} size="sm" showLabel={false} />
                        </div>
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                          className="px-3 py-1.5 text-xs font-medium bg-[#141414] text-white hover:bg-black transition-colors"
                        >
                          View User
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Warm Leads */}
            {conversionTargets.warmLeads.length > 0 && (
              <div className="bg-white border border-[#E5E5E5]">
                <div className="px-4 py-3 border-b border-[#E5E5E5] bg-amber-50">
                  <h3 className="font-medium text-amber-800 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Warm Leads — 50-80% Storage Used (Free Plan)
                  </h3>
                  <p className="text-xs text-amber-600 mt-0.5">
                    Engaged users approaching limits. Good candidates for nurture campaigns.
                  </p>
                </div>
                <div className="divide-y divide-[#E5E5E5]">
                  {conversionTargets.warmLeads.slice(0, 10).map((user) => (
                    <div key={user.userId} className="p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#141414]">{user.businessName || user.email}</p>
                        <p className="text-xs text-[#737373]">
                          {user.galleryCount} galleries · {user.totalImages} images · {user.storagePercent.toFixed(1)}% used
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-24">
                          <ProgressBar percent={user.storagePercent} size="sm" showLabel={false} />
                        </div>
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                          className="px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] hover:border-[#141414] transition-colors"
                        >
                          View User
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Upgrade Ready (Paid users at limits) */}
            {conversionTargets.upgradeReady.length > 0 && (
              <div className="bg-white border border-[#E5E5E5]">
                <div className="px-4 py-3 border-b border-[#E5E5E5]">
                  <h3 className="font-medium text-[#141414] flex items-center gap-2">
                    <ArrowUpRight className="w-4 h-4" />
                    Upgrade Ready — Paid Users at 80%+
                  </h3>
                  <p className="text-xs text-[#737373] mt-0.5">
                    Paid users who may need a higher tier plan.
                  </p>
                </div>
                <div className="divide-y divide-[#E5E5E5]">
                  {conversionTargets.upgradeReady.map((user) => (
                    <div key={user.userId} className="p-4 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-[#141414]">{user.businessName || user.email}</p>
                        <p className="text-xs text-[#737373]">
                          <span className="uppercase">{user.plan}</span> · {user.storagePercent.toFixed(1)}% used
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#F5F5F7] text-[#525252]">
                          → {user.upgradePotential.replace('UPGRADE_', '')}
                        </span>
                        <Link
                          href={`/admin/users?search=${encodeURIComponent(user.email)}`}
                          className="px-3 py-1.5 text-xs font-medium border border-[#E5E5E5] hover:border-[#141414] transition-colors"
                        >
                          View User
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {totalHotLeads === 0 && conversionTargets.upgradeReady.length === 0 && (
              <div className="bg-white border border-[#E5E5E5] p-12 text-center">
                <div className="w-12 h-12 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-4">
                  <Users className="w-6 h-6 text-[#525252]" />
                </div>
                <p className="text-[#525252]">No conversion targets at this time</p>
              </div>
            )}
          </motion.div>
        )}
        
        {activeTab === 'buckets' && (
          <motion.div
            key="buckets"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-4"
          >
            {buckets.map((bucket) => {
              const Icon = bucket.bucket === 'galleries' 
                ? ImageIcon 
                : bucket.bucket === 'archives' 
                ? Archive 
                : Folder
              
              return (
                <div key={bucket.bucket} className="bg-white border border-[#E5E5E5] p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-[#525252]">{bucket.bucket}</p>
                      <p className="text-2xl font-serif text-[#141414] mt-1">{formatBytes(bucket.totalBytes)}</p>
                    </div>
                    <div className="p-2 border border-[#E5E5E5]">
                      <Icon className="w-4 h-4 text-[#525252]" />
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Files</span>
                      <span className="text-[#141414]">{bucket.fileCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#737373]">Avg Size</span>
                      <span className="text-[#141414]">{formatBytes(bucket.avgFileSize)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
