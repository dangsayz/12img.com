'use client'

import { motion } from 'framer-motion'
import { PillTag } from '../shared/PillTag'

interface KanbanCardProps {
  id: string
  number: number
  title: string
  tags: string[]
  comments: number
  assignee?: string
  statusIcon?: React.ReactNode
}

export function KanbanCard({ id, number, title, tags, comments, assignee, statusIcon }: KanbanCardProps) {
  return (
    <motion.div
      layoutId={id}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: [0.23, 0.62, 0.35, 1] }}
      whileHover={{ y: -6, scale: 1.015 }}
      className="
        bg-white rounded-[24px] p-5
        shadow-ruanta-md hover:shadow-ruanta-float
        border border-white/50
        cursor-pointer
        group
      "
    >
      <div className="flex justify-between items-start mb-3">
        <span className="text-[10px] font-bold text-gray-400"># {number}</span>
        {statusIcon}
      </div>

      <h4 className="text-sm font-bold text-gray-900 leading-snug mb-4">
        {title}
      </h4>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2">
          {tags.map(tag => (
            <PillTag 
              key={tag} 
              label={tag} 
              variant={tag.toLowerCase() as any} 
            />
          ))}
          <div className="flex items-center gap-1 text-gray-400 ml-1">
            <span className="text-[10px] font-bold">💬 {comments}</span>
          </div>
        </div>

        {assignee && (
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white shadow-sm">
            <img src={assignee} alt="Assignee" />
          </div>
        )}
      </div>
    </motion.div>
  )
}
