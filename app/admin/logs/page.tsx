import { ScrollText } from 'lucide-react'

export default function AdminLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">View all admin actions and system events</p>
      </div>
      
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <ScrollText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Audit log viewer with filters, search, and export functionality coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
