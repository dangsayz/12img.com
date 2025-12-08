import { 
  ScrollText, 
  User, 
  Image, 
  CreditCard, 
  Mail, 
  Settings, 
  Shield,
  Eye,
  Ban,
  CheckCircle,
  Trash2,
  RefreshCw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { getAuditLogs } from '@/server/admin/audit'
import Link from 'next/link'

interface Props {
  searchParams: Promise<{ page?: string; action?: string }>
}

// Action category colors and icons
const ACTION_CONFIG: Record<string, { icon: typeof User; color: string; bg: string }> = {
  'user.view': { icon: Eye, color: 'text-blue-600', bg: 'bg-blue-50' },
  'user.suspend': { icon: Ban, color: 'text-red-600', bg: 'bg-red-50' },
  'user.reactivate': { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
  'user.update_limits': { icon: Settings, color: 'text-amber-600', bg: 'bg-amber-50' },
  'user.update_plan': { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  'user.delete': { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  'user.impersonate': { icon: User, color: 'text-orange-600', bg: 'bg-orange-50' },
  'gallery.view': { icon: Image, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  'gallery.delete': { icon: Trash2, color: 'text-red-600', bg: 'bg-red-50' },
  'gallery.restore': { icon: RefreshCw, color: 'text-green-600', bg: 'bg-green-50' },
  'billing.override_plan': { icon: CreditCard, color: 'text-purple-600', bg: 'bg-purple-50' },
  'billing.sync': { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50' },
  'email.send_single': { icon: Mail, color: 'text-blue-600', bg: 'bg-blue-50' },
  'email.send_broadcast': { icon: Mail, color: 'text-purple-600', bg: 'bg-purple-50' },
  'admin.role_change': { icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50' },
  'admin.login': { icon: User, color: 'text-green-600', bg: 'bg-green-50' },
}

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || { icon: ScrollText, color: 'text-gray-600', bg: 'bg-gray-50' }
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAction(action: string): string {
  return action.replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const params = await searchParams
  const page = parseInt(params.page || '1', 10)
  const actionFilter = params.action
  
  let logs: Awaited<ReturnType<typeof getAuditLogs>> | null = null
  let error: string | null = null
  
  try {
    logs = await getAuditLogs({
      page,
      pageSize: 50,
      filters: actionFilter ? { action: actionFilter as any } : undefined,
    })
  } catch (err) {
    console.error('Audit logs error:', err)
    error = err instanceof Error ? err.message : 'Unknown error'
  }
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-3xl lg:text-4xl text-[#141414]">Audit Logs</h1>
        <p className="text-[#525252] mt-2">
          Complete record of all administrative actions for compliance and security
        </p>
      </div>
      
      {error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : logs && logs.data.length > 0 ? (
        <>
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-[#525252]">
            <span>{logs.total.toLocaleString()} total entries</span>
            <span>·</span>
            <span>Page {logs.page} of {logs.totalPages}</span>
          </div>
          
          {/* Logs Table */}
          <div className="bg-white border border-[#E5E5E5] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
                    <th className="text-left text-xs font-medium text-[#525252] uppercase tracking-wider px-4 py-3">
                      Action
                    </th>
                    <th className="text-left text-xs font-medium text-[#525252] uppercase tracking-wider px-4 py-3">
                      Admin
                    </th>
                    <th className="text-left text-xs font-medium text-[#525252] uppercase tracking-wider px-4 py-3">
                      Target
                    </th>
                    <th className="text-left text-xs font-medium text-[#525252] uppercase tracking-wider px-4 py-3">
                      Details
                    </th>
                    <th className="text-right text-xs font-medium text-[#525252] uppercase tracking-wider px-4 py-3">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5E5]">
                  {logs.data.map((log) => {
                    const config = getActionConfig(log.action)
                    const Icon = config.icon
                    
                    return (
                      <tr key={log.id} className="hover:bg-[#FAFAFA] transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded ${config.bg}`}>
                              <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                            </div>
                            <span className="text-sm font-medium text-[#141414]">
                              {formatAction(log.action)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm text-[#141414]">{log.admin_email}</p>
                            <p className="text-xs text-[#737373]">{log.admin_role}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.target_type ? (
                            <div>
                              <p className="text-sm text-[#141414]">{log.target_identifier || '—'}</p>
                              <p className="text-xs text-[#737373]">{log.target_type}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-[#737373]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.metadata && Object.keys(log.metadata).length > 0 ? (
                            <div className="max-w-xs">
                              {Object.entries(log.metadata).slice(0, 2).map(([key, value]) => (
                                <p key={key} className="text-xs text-[#737373] truncate">
                                  <span className="font-medium">{key}:</span>{' '}
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </p>
                              ))}
                              {Object.keys(log.metadata).length > 2 && (
                                <p className="text-xs text-[#A3A3A3]">
                                  +{Object.keys(log.metadata).length - 2} more
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-[#737373]">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <p className="text-sm text-[#525252]">{formatDate(log.created_at)}</p>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {logs.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#E5E5E5] bg-[#FAFAFA]">
                <div className="text-sm text-[#525252]">
                  Showing {((logs.page - 1) * logs.pageSize) + 1} to {Math.min(logs.page * logs.pageSize, logs.total)} of {logs.total}
                </div>
                <div className="flex items-center gap-2">
                  {logs.page > 1 && (
                    <Link
                      href={`/admin/logs?page=${logs.page - 1}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#525252] hover:text-[#141414] bg-white border border-[#E5E5E5] rounded-lg hover:border-[#D4D4D4] transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Link>
                  )}
                  {logs.page < logs.totalPages && (
                    <Link
                      href={`/admin/logs?page=${logs.page + 1}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-[#525252] hover:text-[#141414] bg-white border border-[#E5E5E5] rounded-lg hover:border-[#D4D4D4] transition-colors"
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="bg-white border border-[#E5E5E5] p-16 rounded-lg">
          <div className="text-center">
            <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-6 rounded-lg">
              <ScrollText className="w-8 h-8 text-[#525252]" />
            </div>
            <h3 className="font-serif text-2xl text-[#141414] mb-3">No Audit Logs Yet</h3>
            <p className="text-[#525252] max-w-sm mx-auto">
              Admin actions will be recorded here as they occur.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
