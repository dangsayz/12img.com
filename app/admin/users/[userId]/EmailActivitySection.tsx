'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Mail, 
  Send, 
  Eye, 
  MousePointer, 
  Download, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Folder
} from 'lucide-react'
import type { AdminEmailLog, AdminEmailStats } from '@/server/admin/users'

interface Props {
  emails: AdminEmailLog[]
  stats: AdminEmailStats
}

const STATUS_CONFIG: Record<string, { icon: typeof CheckCircle; color: string; bg: string; label: string }> = {
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Pending' },
  sent: { icon: Send, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Sent' },
  delivered: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Delivered' },
  opened: { icon: Eye, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Opened' },
  bounced: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Bounced' },
  failed: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
}

const EMAIL_TYPE_LABELS: Record<string, string> = {
  gallery_invite: 'Gallery Invite',
  archive_ready: 'Archive Ready',
  reminder: 'Reminder',
  welcome: 'Welcome',
  other: 'Other',
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

function EmailRow({ email }: { email: AdminEmailLog }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)
  const config = STATUS_CONFIG[email.status] || STATUS_CONFIG.sent
  const StatusIcon = config.icon
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors text-left"
      >
        <div className={`p-1.5 rounded ${config.bg}`}>
          <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 truncate">
              {email.recipient_email}
            </span>
            {email.recipient_name && (
              <span className="text-xs text-gray-500 truncate">
                ({email.recipient_name})
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500">
              {EMAIL_TYPE_LABELS[email.email_type] || email.email_type}
            </span>
            {email.gallery_title && (
              <>
                <span className="text-gray-300">·</span>
                <span className="text-xs text-gray-500 truncate">
                  {email.gallery_title}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {email.opened_count > 0 && (
            <span className="flex items-center gap-1" title="Opens">
              <Eye className="w-3 h-3" />
              {email.opened_count}
            </span>
          )}
          {email.clicked_count > 0 && (
            <span className="flex items-center gap-1" title="Clicks">
              <MousePointer className="w-3 h-3" />
              {email.clicked_count}
            </span>
          )}
          {email.download_count > 0 && (
            <span className="flex items-center gap-1" title="Downloads">
              <Download className="w-3 h-3" />
              {email.download_count}
            </span>
          )}
        </div>
        
        <span className="text-xs text-gray-400 whitespace-nowrap">
          {formatRelativeTime(email.created_at)}
        </span>
        
        {expanded ? (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-400" />
        )}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 pt-1 bg-gray-50/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {/* Left column - Email details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Subject</p>
                <p className="text-gray-900">{email.subject}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                  <StatusIcon className="w-3 h-3" />
                  {config.label}
                </span>
              </div>
              
              {email.error_message && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Error</p>
                  <p className="text-red-600 text-xs bg-red-50 p-2 rounded">
                    {email.error_message}
                  </p>
                </div>
              )}
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Sent</p>
                <p className="text-gray-700">{formatDate(email.created_at)}</p>
              </div>
              
              {email.gallery_id && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gallery</p>
                  <Link 
                    href={`/admin/galleries/${email.gallery_id}`}
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700"
                  >
                    <Folder className="w-3 h-3" />
                    {email.gallery_title || 'View Gallery'}
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
            
            {/* Right column - Tracking details */}
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">Opens</p>
                {email.opened_at ? (
                  <div>
                    <p className="text-gray-700">
                      {email.opened_count} time{email.opened_count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      First: {formatDate(email.opened_at)}
                    </p>
                    {email.last_opened_at && email.last_opened_at !== email.opened_at && (
                      <p className="text-xs text-gray-500">
                        Last: {formatDate(email.last_opened_at)}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400">Not opened</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Link Clicks</p>
                {email.clicked_at ? (
                  <div>
                    <p className="text-gray-700">
                      {email.clicked_count} time{email.clicked_count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      First: {formatDate(email.clicked_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">No clicks</p>
                )}
              </div>
              
              <div>
                <p className="text-xs text-gray-500 mb-1">Downloads</p>
                {email.downloaded_at ? (
                  <div>
                    <p className="text-gray-700">
                      {email.download_count} time{email.download_count !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">
                      First: {formatDate(email.downloaded_at)}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-400">No downloads</p>
                )}
              </div>
              
              {email.resend_message_id && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Resend ID</p>
                  <button
                    onClick={() => copyToClipboard(email.resend_message_id!)}
                    className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-mono"
                  >
                    {email.resend_message_id.slice(0, 16)}...
                    {copied ? (
                      <Check className="w-3 h-3 text-green-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function EmailActivitySection({ emails, stats }: Props) {
  const hasEmails = emails.length > 0
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-400" />
            Email Activity
          </h2>
          <span className="text-sm text-gray-500">
            {stats.totalSent} sent
          </span>
        </div>
        
        {/* Stats bar */}
        {hasEmails && (
          <div className="flex items-center gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-gray-600">{stats.openRate}% opened</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-gray-600">{stats.clickRate}% clicked</span>
            </div>
            {stats.totalBounced > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-600">{stats.bounceRate}% bounced</span>
              </div>
            )}
            {stats.totalFailed > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-red-600">{stats.totalFailed} failed</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {hasEmails ? (
        <div className="max-h-[400px] overflow-y-auto">
          {emails.map((email) => (
            <EmailRow key={email.id} email={email} />
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Mail className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500">No emails sent yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Gallery invites and notifications will appear here
          </p>
        </div>
      )}
      
      {/* Delivery health indicator */}
      {hasEmails && (stats.totalBounced > 0 || stats.totalFailed > 0) && (
        <div className="p-3 bg-amber-50 border-t border-amber-100">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-medium text-amber-800">Delivery Issues Detected</p>
              <p className="text-amber-700 mt-0.5">
                {stats.totalBounced > 0 && `${stats.totalBounced} bounced`}
                {stats.totalBounced > 0 && stats.totalFailed > 0 && ', '}
                {stats.totalFailed > 0 && `${stats.totalFailed} failed`}
                . Check recipient email addresses and Resend dashboard for details.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
