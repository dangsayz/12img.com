'use client'

import { Plus } from 'lucide-react'
import { KanbanCard } from './KanbanCard'

interface KanbanColumnProps {
  title: string
  count: number
  icon: React.ReactNode
  items: any[]
}

export function KanbanColumn({ title, count, icon, items }: KanbanColumnProps) {
  return (
    <div className="flex-shrink-0 w-[320px] flex flex-col gap-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-bold text-gray-900">{title}</h3>
          <span className="text-xs font-bold text-gray-400">{count}</span>
        </div>
        <button className="p-1 rounded-md hover:bg-gray-200 transition-colors">
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <KanbanCard key={item.id} {...item} />
        ))}
      </div>
    </div>
  )
}
