'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { FileItem, FileItemState } from './FileItem'

interface FileStagingListProps {
  files: FileItemState[]
  onRemove: (id: string) => void
}

export function FileStagingList({ files, onRemove }: FileStagingListProps) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-300px)] min-h-[200px]">
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-sm font-semibold text-gray-900">
          Selected Files
          <span className="ml-2 text-gray-400 font-normal">
            {files.length}
          </span>
        </h3>
        <span className="text-xs text-gray-500">
          {files.filter(f => f.status === 'completed').length} uploaded
        </span>
      </div>

      <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent">
        <motion.div layout className="space-y-3 pb-4">
          <AnimatePresence mode="popLayout">
            {files.map((file) => (
              <FileItem
                key={file.id}
                item={file}
                onRemove={onRemove}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  )
}
