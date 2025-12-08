'use client'

import { useState, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, ChevronUp, Check, Loader2, AlertCircle, Clock } from 'lucide-react'
import { FileItem, FileItemState } from './FileItem'

interface FileStagingListProps {
  files: FileItemState[]
  onRemove: (id: string) => void
}

// Threshold for switching to summary view
const SUMMARY_THRESHOLD = 20

export function FileStagingList({ files, onRemove }: FileStagingListProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [visibleCount, setVisibleCount] = useState(50)

  // useMemo must be called before any conditional returns (React hooks rule)
  const stats = useMemo(() => ({
    total: files.length,
    completed: files.filter(f => f.status === 'completed').length,
    uploading: files.filter(f => f.status === 'uploading').length,
    pending: files.filter(f => f.status === 'pending').length,
    error: files.filter(f => f.status === 'error').length,
  }), [files])

  // Early return AFTER all hooks
  if (files.length === 0) return null

  const progress = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0
  const useSummaryView = files.length >= SUMMARY_THRESHOLD

  // For large uploads, show summary by default
  if (useSummaryView && !showDetails) {
    return (
      <div className="space-y-4">
        {/* Summary Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-serif text-stone-900">
            Uploading {stats.total.toLocaleString()} photos
          </h3>
          <button
            onClick={() => setShowDetails(true)}
            className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
          >
            Show details
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-3 bg-stone-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between text-xs text-stone-500">
            <span>{progress}% complete</span>
            <span>{stats.completed.toLocaleString()} of {stats.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-3">
          {stats.completed > 0 && (
            <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-900">{stats.completed.toLocaleString()}</p>
                <p className="text-xs text-emerald-600">Completed</p>
              </div>
            </div>
          )}
          
          {stats.uploading > 0 && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">{stats.uploading}</p>
                <p className="text-xs text-blue-600">Uploading</p>
              </div>
            </div>
          )}
          
          {stats.pending > 0 && (
            <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-stone-300 flex items-center justify-center">
                <Clock className="w-4 h-4 text-stone-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">{stats.pending.toLocaleString()}</p>
                <p className="text-xs text-stone-500">Pending</p>
              </div>
            </div>
          )}
          
          {stats.error > 0 && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-900">{stats.error}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
            </div>
          )}
        </div>

        {/* Currently Uploading Preview */}
        {stats.uploading > 0 && (
          <div className="pt-2">
            <p className="text-xs text-stone-400 mb-2">Currently uploading:</p>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {files
                .filter(f => f.status === 'uploading')
                .slice(0, 5)
                .map(file => (
                  <div key={file.id} className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-stone-100">
                    {file.previewUrl && (
                      <img src={file.previewUrl} alt="" className="w-full h-full object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="text-[10px] text-white font-medium">{Math.round(file.progress)}%</div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Detailed view (for small uploads or when expanded)
  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-300px)] min-h-[200px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-base font-serif text-stone-900">
          Selected Files
          <span className="ml-2 text-stone-400 font-sans text-sm">
            {files.length.toLocaleString()}
          </span>
        </h3>
        <div className="flex items-center gap-3">
          <span className="text-xs text-stone-500">
            {stats.completed.toLocaleString()} uploaded
          </span>
          {useSummaryView && (
            <button
              onClick={() => setShowDetails(false)}
              className="text-xs text-stone-500 hover:text-stone-700 flex items-center gap-1"
            >
              Collapse
              <ChevronUp className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <motion.div layout className="space-y-3 pb-4">
          <AnimatePresence mode="popLayout">
            {files.slice(0, visibleCount).map((file) => (
              <FileItem
                key={file.id}
                item={file}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
          
          {/* Load More Button */}
          {files.length > visibleCount && (
            <button
              onClick={() => setVisibleCount(prev => prev + 50)}
              className="w-full py-3 text-sm text-stone-500 hover:text-stone-700 hover:bg-stone-50 rounded-lg transition-colors"
            >
              Show {Math.min(50, files.length - visibleCount)} more ({files.length - visibleCount} remaining)
            </button>
          )}
        </motion.div>
      </div>
    </div>
  )
}
