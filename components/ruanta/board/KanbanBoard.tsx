'use client'

import { Plus, MoreHorizontal, LayoutGrid, List } from 'lucide-react'
import { KanbanColumn } from './KanbanColumn'
import { FeaturedFloatingCard } from './FeaturedFloatingCard'
import { GlassCard } from '../shared/GlassCard'
import { motion } from 'framer-motion'

const mockData = {
  backlog: [
    { id: '86', number: 86, title: 'Optimize tweets for improved engagement and readability.', tags: ['UX'], comments: 3, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { id: '83', number: 83, title: 'Refine notification system.', tags: ['UI'], comments: 3, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
    { id: '67', number: 67, title: 'Updates for UI Elements!', tags: ['Design system'], comments: 0, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
  ],
  inProgress: [
    { id: '8', number: 8, title: 'Conduct usability testing on new conversation features.', tags: ['Testing'], comments: 6, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
    { id: '53', number: 53, title: 'Optimize tweets for improved engagement and readability.', tags: ['UX'], comments: 3, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' },
  ],
  test: [
    { id: '25', number: 25, title: 'Improving the visuals of the payment plan comparison table.', tags: ['UI'], comments: 7, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
    { id: '69', number: 69, title: 'Posting feature usability testing.', tags: ['Testing'], comments: 6, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
    { id: '27', number: 27, title: 'Improving the search logic on the creators page!', tags: ['UX'], comments: 0, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' },
    { id: '23', number: 23, title: 'Buttons & Inputs UI updates. Colors fix.', tags: ['Design system'], comments: 0, assignee: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9' },
  ]
}

export function KanbanBoard() {
  return (
    <GlassCard className="w-full h-full flex flex-col gap-6 relative overflow-hidden" noPadding>
      {/* Header Strip */}
      <div className="p-6 pb-0 flex items-center justify-between">
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-ruanta-text-primary">Spectrum</h2>
          
          <div className="flex items-center gap-4">
             <div className="flex p-1 bg-gray-100 rounded-full">
                <button className="px-4 py-1.5 bg-black text-white rounded-full text-xs font-bold shadow-sm">Design</button>
                <button className="px-4 py-1.5 text-gray-500 text-xs font-bold hover:text-gray-900">Engineering</button>
             </div>
             <button className="text-xs font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600">
               <Plus className="w-3 h-3" /> Add space
             </button>
          </div>
        </div>

        <div className="flex flex-col items-end gap-4">
           <MoreHorizontal className="w-5 h-5 text-gray-400" />
           <div className="flex gap-2 text-gray-400">
             <LayoutGrid className="w-5 h-5 text-gray-900" />
             <List className="w-5 h-5" />
           </div>
        </div>
      </div>

      {/* Columns Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6 pt-2 relative">
        <div className="flex gap-8 min-w-max">
          <KanbanColumn 
            title="Backlog" 
            count={38} 
            icon={<div className="w-4 h-4 rounded-full bg-lime-400 flex items-center justify-center text-[8px]">●</div>}
            items={mockData.backlog} 
          />
          <KanbanColumn 
            title="In Progress" 
            count={3} 
            icon={<div className="w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center text-[8px]">●</div>}
            items={mockData.inProgress} 
          />
          <KanbanColumn 
            title="Test" 
            count={16} 
            icon={<div className="w-4 h-4 rounded-full bg-purple-400 flex items-center justify-center text-[8px]">●</div>}
            items={mockData.test} 
          />
        </div>

        {/* Floating Feature Card - Positioned Absolute over the board */}
        <FeaturedFloatingCard />
      </div>
    </GlassCard>
  )
}
