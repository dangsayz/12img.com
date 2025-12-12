'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Eye, 
  Download, 
  Users,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BarChart3
} from 'lucide-react'
import { getGalleryAnalytics, type GalleryAnalytics as GalleryAnalyticsType, type RecentActivity } from '@/server/actions/analytics.actions'

interface GalleryAnalyticsProps {
  galleryId: string
}

export function GalleryAnalytics({ galleryId }: GalleryAnalyticsProps) {
  const [analytics, setAnalytics] = useState<GalleryAnalyticsType | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showActivity, setShowActivity] = useState(false)

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true)
      const result = await getGalleryAnalytics(galleryId)
      if (result.error) {
        setError(result.error)
      } else {
        setAnalytics(result.analytics)
        setRecentActivity(result.recentActivity)
      }
      setLoading(false)
    }
    fetchAnalytics()
  }, [galleryId])

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-10 h-10 bg-stone-200 rounded-full" />
          <div className="h-4 w-32 bg-stone-200 rounded" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 text-center text-stone-500">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-stone-300" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  // Empty state - no analytics yet
  if (!analytics || (analytics.totalViews === 0 && analytics.totalDownloads === 0)) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <BarChart3 className="w-6 h-6 text-stone-400" />
        </div>
        <h3 className="font-medium text-stone-900 mb-1">No activity yet</h3>
        <p className="text-sm text-stone-500">
          Share your gallery to start tracking views and downloads.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          icon={Eye} 
          label="Total Views" 
          value={analytics.totalViews} 
          subLabel={`${analytics.uniqueViews} unique`}
          color="blue"
        />
        <StatCard 
          icon={Download} 
          label="Downloads" 
          value={analytics.totalDownloads} 
          subLabel={`${analytics.uniqueDownloads} unique`}
          color="emerald"
        />
      </div>

      {/* Time-based Stats */}
      <div className="grid grid-cols-2 gap-3">
        <MiniStatCard 
          icon={TrendingUp}
          label="Today"
          views={analytics.viewsToday}
          downloads={analytics.downloadsToday}
        />
        <MiniStatCard 
          icon={Clock}
          label="This Week"
          views={analytics.viewsThisWeek}
          downloads={analytics.downloadsThisWeek}
        />
      </div>

      {/* Last Activity */}
      {(analytics.lastViewAt || analytics.lastDownloadAt) && (
        <div className="bg-stone-50 rounded-xl p-4 space-y-2">
          <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider">
            Last Activity
          </h4>
          <div className="space-y-1.5 text-sm">
            {analytics.lastViewAt && (
              <div className="flex items-center gap-2 text-stone-600">
                <Eye className="w-3.5 h-3.5 text-blue-500" />
                <span>Viewed {formatTimeAgo(analytics.lastViewAt)}</span>
              </div>
            )}
            {analytics.lastDownloadAt && (
              <div className="flex items-center gap-2 text-stone-600">
                <Download className="w-3.5 h-3.5 text-emerald-500" />
                <span>Downloaded {formatTimeAgo(analytics.lastDownloadAt)}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Toggle */}
      {recentActivity.length > 0 && (
        <div>
          <button
            onClick={() => setShowActivity(!showActivity)}
            className="w-full flex items-center justify-between px-4 py-3 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-stone-400" />
              <span className="text-sm font-medium text-stone-700">Recent Activity</span>
              <span className="text-xs text-stone-400">({recentActivity.length})</span>
            </div>
            {showActivity ? (
              <ChevronUp className="w-4 h-4 text-stone-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-stone-400" />
            )}
          </button>

          <AnimatePresence>
            {showActivity && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-2 bg-white border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-64 overflow-y-auto">
                  {recentActivity.map((activity, index) => (
                    <ActivityRow key={index} activity={activity} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subLabel,
  color 
}: { 
  icon: React.ElementType
  label: string
  value: number
  subLabel?: string
  color: 'blue' | 'emerald'
}) {
  const colorClasses = {
    blue: 'text-blue-600',
    emerald: 'text-emerald-600',
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4">
      <Icon className={`w-4 h-4 mb-2 ${colorClasses[color]}`} />
      <div className="text-2xl font-semibold text-stone-900">{value.toLocaleString()}</div>
      <div className="text-xs text-stone-500">{label}</div>
      {subLabel && (
        <div className="text-[10px] text-stone-400 mt-0.5">{subLabel}</div>
      )}
    </div>
  )
}

function MiniStatCard({ 
  icon: Icon,
  label,
  views,
  downloads
}: { 
  icon: React.ElementType
  label: string
  views: number
  downloads: number
}) {
  return (
    <div className="bg-stone-50 rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-2">
        <Icon className="w-3.5 h-3.5 text-stone-400" />
        <span className="text-xs font-medium text-stone-600">{label}</span>
      </div>
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1">
          <Eye className="w-3 h-3 text-blue-500" />
          <span className="text-stone-700">{views}</span>
        </div>
        <div className="flex items-center gap-1">
          <Download className="w-3 h-3 text-emerald-500" />
          <span className="text-stone-700">{downloads}</span>
        </div>
      </div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: RecentActivity }) {
  const isView = activity.type === 'view'
  
  return (
    <div className="px-4 py-3 flex items-center gap-3">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
        isView ? 'bg-blue-50' : 'bg-emerald-50'
      }`}>
        {isView ? (
          <Eye className="w-3.5 h-3.5 text-blue-500" />
        ) : (
          <Download className="w-3.5 h-3.5 text-emerald-500" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-700">
            Visitor {activity.visitorId}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
            {isView ? 'Viewed' : activity.downloadType || 'Downloaded'}
          </span>
        </div>
        {activity.referrer && (
          <div className="flex items-center gap-1 text-xs text-stone-400 mt-0.5 truncate">
            <ExternalLink className="w-3 h-3 flex-shrink-0" />
            <span className="truncate">{formatReferrer(activity.referrer)}</span>
          </div>
        )}
      </div>
      
      <div className="text-xs text-stone-400 flex-shrink-0">
        {formatTimeAgo(activity.createdAt)}
      </div>
    </div>
  )
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
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}

function formatReferrer(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname.replace('www.', '')
  } catch {
    return url
  }
}
