'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Mail, 
  Eye, 
  MousePointer, 
  Download, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Send,
  BarChart3,
  Users
} from 'lucide-react'
import { getGalleryEmailActivity, type EmailLogWithEvents, type GalleryEmailStats } from '@/server/actions/email.actions'

interface EmailActivityProps {
  galleryId: string
}

export function EmailActivity({ galleryId }: EmailActivityProps) {
  const [emails, setEmails] = useState<EmailLogWithEvents[]>([])
  const [stats, setStats] = useState<GalleryEmailStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchActivity() {
      setLoading(true)
      const result = await getGalleryEmailActivity(galleryId)
      if (result.error) {
        setError(result.error)
      } else {
        setEmails(result.emails)
        setStats(result.stats)
      }
      setLoading(false)
    }
    fetchActivity()
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
        <XCircle className="w-8 h-8 mx-auto mb-2 text-red-400" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-4">
          <Mail className="w-6 h-6 text-stone-400" />
        </div>
        <h3 className="font-medium text-stone-900 mb-1">No emails sent yet</h3>
        <p className="text-sm text-stone-500">
          Send this gallery to a client to start tracking engagement.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard 
            icon={Send} 
            label="Sent" 
            value={stats.totalEmails} 
            color="stone"
          />
          <StatCard 
            icon={Eye} 
            label="Opens" 
            value={`${stats.openRate}%`} 
            subValue={`${stats.emailsOpened}/${stats.totalEmails}`}
            color="blue"
          />
          <StatCard 
            icon={MousePointer} 
            label="Clicks" 
            value={`${stats.clickRate}%`} 
            subValue={`${stats.emailsClicked}/${stats.totalEmails}`}
            color="violet"
          />
          <StatCard 
            icon={Download} 
            label="Downloads" 
            value={`${stats.downloadRate}%`} 
            subValue={`${stats.emailsWithDownloads}/${stats.totalEmails}`}
            color="emerald"
          />
        </div>
      )}

      {/* Email List */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-stone-500 uppercase tracking-wider px-1">
          Email History
        </h4>
        <div className="space-y-2">
          {emails.map((email) => (
            <EmailRow 
              key={email.id} 
              email={email} 
              isExpanded={expandedId === email.id}
              onToggle={() => setExpandedId(expandedId === email.id ? null : email.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  subValue,
  color 
}: { 
  icon: React.ElementType
  label: string
  value: string | number
  subValue?: string
  color: 'stone' | 'blue' | 'violet' | 'emerald'
}) {
  const colorClasses = {
    stone: 'bg-white border border-stone-200 text-stone-600',
    blue: 'bg-white border border-stone-200 text-blue-600',
    violet: 'bg-white border border-stone-200 text-violet-600',
    emerald: 'bg-white border border-stone-200 text-emerald-600',
  }

  return (
    <div className={`p-4 rounded-xl ${colorClasses[color]}`}>
      <Icon className="w-4 h-4 mb-2 opacity-70" />
      <div className="text-xl font-semibold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
      {subValue && (
        <div className="text-[10px] opacity-50 mt-0.5">{subValue}</div>
      )}
    </div>
  )
}

function EmailRow({ 
  email, 
  isExpanded, 
  onToggle 
}: { 
  email: EmailLogWithEvents
  isExpanded: boolean
  onToggle: () => void
}) {
  const typeLabels: Record<string, string> = {
    gallery_invite: 'Gallery Invite',
    archive_ready: 'Download Ready',
    reminder: 'Reminder',
    welcome: 'Welcome',
    other: 'Other',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    sent: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    delivered: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    opened: <Eye className="w-4 h-4 text-blue-500" />,
    failed: <XCircle className="w-4 h-4 text-red-500" />,
    bounced: <XCircle className="w-4 h-4 text-orange-500" />,
    pending: <Clock className="w-4 h-4 text-stone-400" />,
  }

  return (
    <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-stone-50 transition-colors text-left"
      >
        <div className="flex-shrink-0">
          {statusIcons[email.status] || statusIcons.pending}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-stone-900 truncate">
              {email.recipient_email}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded">
              {typeLabels[email.email_type] || email.email_type}
            </span>
          </div>
          <div className="text-xs text-stone-500 mt-0.5">
            {formatDate(email.created_at)}
          </div>
        </div>

        {/* Activity indicators */}
        <div className="flex items-center gap-2 text-xs text-stone-400">
          {email.opened_count > 0 && (
            <span className="flex items-center gap-1 text-blue-500">
              <Eye className="w-3 h-3" />
              {email.opened_count}
            </span>
          )}
          {email.clicked_count > 0 && (
            <span className="flex items-center gap-1 text-violet-500">
              <MousePointer className="w-3 h-3" />
              {email.clicked_count}
            </span>
          )}
          {email.download_count > 0 && (
            <span className="flex items-center gap-1 text-emerald-500">
              <Download className="w-3 h-3" />
              {email.download_count}
            </span>
          )}
        </div>

        <div className="flex-shrink-0">
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-stone-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-stone-400" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-stone-100 space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-stone-500">Subject:</span>
                  <p className="text-stone-900 truncate">{email.subject}</p>
                </div>
                <div>
                  <span className="text-stone-500">Status:</span>
                  <p className="text-stone-900 capitalize">{email.status}</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="space-y-2">
                <span className="text-xs text-stone-500">Activity</span>
                <div className="space-y-1.5">
                  {email.opened_at && (
                    <ActivityItem 
                      icon={Eye} 
                      label="Opened" 
                      time={email.opened_at}
                      count={email.opened_count}
                      color="blue"
                    />
                  )}
                  {email.clicked_at && (
                    <ActivityItem 
                      icon={MousePointer} 
                      label="Clicked link" 
                      time={email.clicked_at}
                      count={email.clicked_count}
                      color="violet"
                    />
                  )}
                  {email.downloaded_at && (
                    <ActivityItem 
                      icon={Download} 
                      label="Downloaded" 
                      time={email.downloaded_at}
                      count={email.download_count}
                      color="emerald"
                    />
                  )}
                  {!email.opened_at && !email.clicked_at && !email.downloaded_at && (
                    <p className="text-xs text-stone-400 italic">No activity yet</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActivityItem({ 
  icon: Icon, 
  label, 
  time, 
  count,
  color 
}: { 
  icon: React.ElementType
  label: string
  time: string
  count: number
  color: 'blue' | 'violet' | 'emerald'
}) {
  const colorClasses = {
    blue: 'text-blue-500 bg-blue-50',
    violet: 'text-violet-500 bg-violet-50',
    emerald: 'text-emerald-500 bg-emerald-50',
  }

  return (
    <div className="flex items-center gap-2 text-xs">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${colorClasses[color]}`}>
        <Icon className="w-3 h-3" />
      </div>
      <span className="text-stone-700">{label}</span>
      {count > 1 && (
        <span className="text-stone-400">×{count}</span>
      )}
      <span className="text-stone-400 ml-auto">{formatDate(time)}</span>
    </div>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  })
}
