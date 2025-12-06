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
  user: 'bg-gray-100 text-gray-600',
  support: 'bg-blue-100 text-blue-700',
  admin: 'bg-amber-100 text-amber-700',
  super_admin: 'bg-red-100 text-red-700',
}

const PLAN_COLORS: Record<string, string> = {
  free: 'bg-gray-100 text-gray-600',
  essential: 'bg-amber-100 text-amber-700',
  pro: 'bg-emerald-100 text-emerald-700',
  studio: 'bg-violet-100 text-violet-700',
  elite: 'bg-purple-100 text-purple-700',
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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">User</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Plan</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Role</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Storage</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Galleries</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Joined</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{user.email}</p>
                    <p className="text-xs text-gray-400 font-mono">{user.id.slice(0, 8)}...</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${PLAN_COLORS[user.plan] || PLAN_COLORS.free}`}>
                    {user.plan || 'free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${ROLE_COLORS[user.role] || ROLE_COLORS.user}`}>
                    {user.role?.replace('_', ' ') || 'user'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {formatBytes(user.usage.totalBytes)}
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {user.usage.galleryCount}
                </td>
                <td className="px-4 py-3">
                  {user.is_suspended ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-700">
                      <Ban className="w-3 h-3" />
                      Suspended
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {formatDate(user.created_at)}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
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
      <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => goToPage(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => goToPage(pagination.page + 1)}
            disabled={pagination.page >= pagination.totalPages}
            className="p-1 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
