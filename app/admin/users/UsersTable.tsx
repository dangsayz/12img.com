'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { AdminUserWithUsage } from '@/lib/admin/types'
import { 
  Eye, 
  Ban, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function getRelativeTime(date: string): string {
  const now = new Date()
  const then = new Date(date)
  const diffMs = now.getTime() - then.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return `${Math.floor(diffDays / 365)} years ago`
}

const ROLE_COLORS: Record<string, string> = {
  user: 'border border-[#E5E5E5] text-[#525252]',
  support: 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]',
  admin: 'border border-[#141414] bg-[#141414] text-white',
  super_admin: 'border border-[#141414] bg-[#141414] text-white',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'border border-[#E5E5E5] text-[#525252]',
  starter: 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]',
  essential: 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]',
  pro: 'border border-[#141414] text-[#141414]',
  studio: 'border border-[#141414] bg-[#141414] text-white',
  elite: 'border border-[#141414] bg-[#141414] text-white',
}

// Animation variants
const tableContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.1,
    },
  },
}

const tableRow = {
  hidden: { opacity: 0, x: -10 },
  show: { 
    opacity: 1, 
    x: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 30,
    }
  },
}

interface Props {
  users: AdminUserWithUsage[]
  pagination: {
    page: number
    totalPages: number
    total: number
  }
}

export function UsersTable({ users, pagination }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', String(page))
    router.push(`/admin/users?${params.toString()}`)
  }
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white border border-[#E5E5E5] overflow-hidden"
    >
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F7] border-b border-[#E5E5E5]">
            <tr>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">User</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Plan</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Role</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Storage</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Galleries</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Status</th>
              <th className="text-left px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Joined</th>
              <th className="text-right px-6 py-4 text-[10px] font-medium text-[#525252] uppercase tracking-[0.15em]">Actions</th>
            </tr>
          </thead>
          <motion.tbody 
            variants={tableContainer}
            initial="hidden"
            animate="show"
            className="divide-y divide-[#E5E5E5]"
          >
            {users.map((user, index) => (
              <motion.tr 
                key={user.id} 
                variants={tableRow}
                className="group hover:bg-[#FAFAFA] transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {/* Avatar placeholder */}
                    <div className="w-9 h-9 bg-gradient-to-br from-[#F5F5F7] to-[#E5E5E5] flex items-center justify-center text-xs font-medium text-[#525252] uppercase">
                      {user.email.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-[#141414] group-hover:text-[#000] transition-colors">{user.email}</p>
                      <p className="text-[10px] text-[#737373] font-mono mt-0.5 tracking-wide">{user.id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                    {user.plan || 'free'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                    {user.role?.replace('_', ' ') || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[#141414] font-medium tabular-nums">{formatBytes(user.usage.totalBytes)}</span>
                    {user.usage.imageCount > 0 && (
                      <span className="text-[10px] text-[#737373]">{user.usage.imageCount.toLocaleString()} images</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[#141414] font-medium tabular-nums">{user.usage.galleryCount}</span>
                </td>
                <td className="px-6 py-4">
                  {user.is_suspended ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] border border-red-200 bg-red-50 text-red-600">
                      <Ban className="w-3 h-3" />
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.1em] border border-emerald-200 bg-emerald-50 text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-[#525252]">{formatDate(user.created_at)}</span>
                    <span className="text-[10px] text-[#737373]">{getRelativeTime(user.created_at)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-[#141414] border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#141414] hover:text-white transition-all duration-200 group/btn"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                    <ExternalLink className="w-3 h-3 opacity-0 -ml-1 group-hover/btn:opacity-100 group-hover/btn:ml-0 transition-all duration-200" />
                  </Link>
                </td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-4 border-t border-[#E5E5E5]">
        <p className="text-sm text-[#525252]">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-2 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-2 border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
