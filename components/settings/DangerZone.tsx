'use client'

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { deleteAccount, exportAccountData } from '@/server/actions/settings.actions'

export function DangerZone() {
  const [isPending, startTransition] = useTransition()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      const result = await exportAccountData()
      if (result.success && result.data) {
        const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `12img-export-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        alert(result.error || 'Failed to export data')
      }
    } catch (error) {
      alert('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = () => {
    if (deleteConfirmText !== 'DELETE') return

    startTransition(async () => {
      const result = await deleteAccount()
      if (result.success) {
        window.location.href = '/'
      } else {
        alert(result.error || 'Failed to delete account')
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      }
    })
  }

  return (
    <section className="mt-16 pt-8 border-t border-stone-200">
      <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400 mb-6">Danger Zone</h2>
      
      <div className="space-y-4">
        {/* Export Data */}
        <div className="flex items-center justify-between p-5 bg-stone-50 border border-stone-100">
          <div>
            <p className="text-sm font-medium text-stone-900">Export your data</p>
            <p className="text-sm text-stone-500 mt-0.5">Download all your data as JSON</p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-4 py-2 text-sm text-stone-600 border border-stone-200 hover:border-stone-400 hover:text-stone-900 disabled:opacity-50 transition-colors"
          >
            {exporting ? 'Exporting...' : 'Export'}
          </button>
        </div>

        {/* Delete Account */}
        <div className="border border-red-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 bg-red-50">
            <div>
              <p className="text-sm font-medium text-red-900">Delete account</p>
              <p className="text-sm text-red-700 mt-0.5">Permanently delete your account and all data</p>
            </div>
            {!showDeleteConfirm && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-sm text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
              >
                Delete
              </button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="p-5 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-800 mb-4">
                This will permanently delete all galleries, images, and account data.
              </p>
              <p className="text-sm text-red-900 mb-2">
                Type <span className="font-mono bg-red-100 px-1">DELETE</span> to confirm:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 px-3 py-2 text-sm border border-red-200 bg-white focus:outline-none focus:border-red-400"
                  autoComplete="off"
                />
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isPending}
                  className="px-4 py-2 text-sm text-stone-600 border border-stone-200 hover:border-stone-400 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isPending}
                  className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isPending ? 'Deleting...' : 'Delete Forever'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
