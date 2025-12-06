'use client'

import { useState, useTransition } from 'react'
import { AlertTriangle, Download, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
        // Create and download JSON file
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
        // Redirect to home after deletion
        window.location.href = '/'
      } else {
        alert(result.error || 'Failed to delete account')
        setShowDeleteConfirm(false)
        setDeleteConfirmText('')
      }
    })
  }

  return (
    <section className="mt-16 pt-8 border-t border-red-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-500" />
        <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
      </div>
      
      <div className="space-y-4">
        {/* Export Data */}
        <div className="flex items-center justify-between py-4 px-4 border border-gray-200 rounded-lg">
          <div>
            <p className="font-medium">Export your data</p>
            <p className="text-sm text-gray-500">
              Download all your account data as a JSON file
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Exporting...' : 'Export'}
          </Button>
        </div>

        {/* Delete Account */}
        <div className="border border-red-200 rounded-lg overflow-hidden">
          <div className="flex items-center justify-between py-4 px-4 bg-red-50">
            <div>
              <p className="font-medium text-red-900">Delete account</p>
              <p className="text-sm text-red-700">
                Permanently delete your account and all data. This cannot be undone.
              </p>
            </div>
            {!showDeleteConfirm && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 border-red-300 text-red-600 hover:bg-red-100 hover:text-red-700"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            )}
          </div>

          {showDeleteConfirm && (
            <div className="p-4 bg-red-50 border-t border-red-200">
              <p className="text-sm text-red-800 mb-3">
                This will permanently delete:
              </p>
              <ul className="text-sm text-red-700 list-disc list-inside mb-4 space-y-1">
                <li>All your galleries</li>
                <li>All your uploaded images</li>
                <li>Your account and settings</li>
              </ul>
              <p className="text-sm font-medium text-red-900 mb-2">
                Type <span className="font-mono bg-red-100 px-1 rounded">DELETE</span> to confirm:
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="flex-1 px-3 py-2 text-sm border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoComplete="off"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeleteConfirmText('')
                  }}
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== 'DELETE' || isPending}
                >
                  {isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Deleting...
                    </>
                  ) : (
                    'Delete Forever'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
