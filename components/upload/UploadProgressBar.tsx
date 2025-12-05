'use client'

import { motion } from 'framer-motion'

interface UploadProgressBarProps {
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
}

export function UploadProgressBar({ progress, status }: UploadProgressBarProps) {
  const getColor = () => {
    switch (status) {
      case 'error': return 'bg-red-500'
      case 'completed': return 'bg-emerald-500'
      default: return 'bg-indigo-600'
    }
  }

  return (
    <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
      <motion.div
        className={`h-full rounded-full ${getColor()}`}
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      />
    </div>
  )
}
