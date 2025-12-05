'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileUp, Plus } from 'lucide-react'

interface DropOverlayProps {
  isVisible: boolean
}

export function DropOverlay({ isVisible }: DropOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 z-50 flex items-center justify-center bg-indigo-50/90 backdrop-blur-sm border-2 border-indigo-500 border-dashed rounded-3xl m-4"
        >
          <div className="text-center space-y-4">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="w-20 h-20 mx-auto bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600"
            >
              <Upload className="w-10 h-10" />
            </motion.div>
            <div>
              <h3 className="text-2xl font-bold text-indigo-900">Drop files to upload</h3>
              <p className="text-indigo-600 mt-2 font-medium">Instantly add images to this gallery</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
