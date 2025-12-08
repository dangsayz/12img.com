'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { AdminUserWithUsage } from '@/lib/admin/types'
import { 
  MoreHorizontal, 
  Eye, 
  Ban, 
  CheckCircle,
  ChevronLeft,
  ChevronRight,
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

const ROLE_COLORS: Record<string, string> = {
  user: 'border border-[#E5E5E5] text-[#525252]',
  support: 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]',
  admin: 'border border-[#141414] bg-[#141414] text-white',
  super_admin: 'border border-[#141414] bg-[#141414] text-white',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'border border-[#E5E5E5] text-[#525252]',
  essential: 'border border-[#E5E5E5] bg-[#F5F5F7] text-[#525252]',
  pro: 'border border-[#141414] text-[#141414]',
  studio: 'border border-[#141414] bg-[#141414] text-white',
  elite: 'border border-[#141414] bg-[#141414] text-white',
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
    <div className="bg-white border border-[#E5E5E5] overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#F5F5F7] border-b border-[#E5E5E5]">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Storage</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Galleries</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Status</th>
              <th className="text-left px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Joined</th>
              <th className="text-right px-6 py-4 text-xs font-medium text-[#525252] uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E5]">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-[#F5F5F7] transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-[#141414]">{user.email}</p>
                    <p className="text-xs text-[#525252] font-mono mt-0.5">{user.id.slice(0, 8)}...</p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                    {user.plan || 'free'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2.5 py-1 text-xs font-medium uppercase tracking-wider ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                    {user.role?.replace('_', ' ') || 'user'}
                  </span>
                </td>
                <td className="px-6 py-4 text-[#525252]">
                  {formatBytes(user.usage.totalBytes)}
                </td>
                <td className="px-6 py-4 text-[#525252]">
                  {user.usage.galleryCount}
                </td>
                <td className="px-6 py-4">
                  {user.is_suspended ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wider border border-red-200 bg-red-50 text-red-700">
                      <Ban className="w-3 h-3" />
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium uppercase tracking-wider border border-emerald-200 bg-emerald-50 text-emerald-700">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-[#525252]">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#141414] border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#F5F5F7] transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
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
    </div>
  )
}
