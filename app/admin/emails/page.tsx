import { Mail } from 'lucide-react'

export default function AdminEmailsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Emails</h1>
        <p className="text-sm text-gray-500 mt-1">Send emails and view delivery logs</p>
      </div>
      
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Email composer, broadcast messaging, and delivery analytics coming soon.
          </p>
        </div>
      </div>
    </div>
  )
}
