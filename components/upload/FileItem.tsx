'use client'

import { motion } from 'framer-motion'
import { X, CheckCircle2, AlertCircle, Loader2, FileImage } from 'lucide-react'
import { UploadProgressBar } from './UploadProgressBar'

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

export interface FileItemState {
  id: string
  file: File
  previewUrl?: string  // Optional - lazy loaded for memory efficiency
  status: 'pending' | 'uploading' | 'completed' | 'error'
  progress: number
  error?: string
}

interface FileItemProps {
  item: FileItemState
  onRemove: (id: string) => void
}

export function FileItem({ item, onRemove }: FileItemProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="group relative bg-white rounded-xl border border-gray-100 p-3 hover:shadow-md transition-all duration-200 hover:border-gray-200"
    >
      <div className="flex items-center gap-4">
        {/* Thumbnail */}
        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
          {item.previewUrl ? (
            <img 
              src={item.previewUrl} 
              alt={item.file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <FileImage className="w-6 h-6" />
            </div>
          )}
          
          {/* Status Indicator Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            {item.status === 'completed' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="bg-emerald-500 rounded-full p-1 text-white"
              >
                <CheckCircle2 className="w-3 h-3" />
              </motion.div>
            )}
            {item.status === 'error' && (
              <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }}
                className="bg-red-500 rounded-full p-1 text-white"
              >
                <AlertCircle className="w-3 h-3" />
              </motion.div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-medium text-gray-900 truncate pr-2">
              {item.file.name}
            </h4>
            <button
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 opacity-0 group-hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{formatBytes(item.file.size)}</span>
              <span className={`font-medium ${
                item.status === 'error' ? 'text-red-600' :
                item.status === 'completed' ? 'text-emerald-600' :
                'text-gray-600'
              }`}>
                {item.status === 'pending' && 'Ready'}
                {item.status === 'uploading' && `${Math.round(item.progress)}%`}
                {item.status === 'completed' && 'Done'}
                {item.status === 'error' && 'Failed'}
              </span>
            </div>
            
            <UploadProgressBar progress={item.progress} status={item.status} />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
