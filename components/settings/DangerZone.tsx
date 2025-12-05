'use client'

import { AlertTriangle, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DangerZone() {
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
              Download all your galleries and images as a ZIP file
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              // TODO: Implement data export
              alert('Data export coming soon!')
            }}
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>
    </section>
  )
}
