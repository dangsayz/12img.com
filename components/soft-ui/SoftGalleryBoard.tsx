'use client'

import { motion } from 'framer-motion'
import { Plus, MoreHorizontal, LayoutGrid, List } from 'lucide-react'
import { SoftCard } from './SoftCard'
import { cn } from '@/lib/utils/cn'

const columns = [
  {
    id: 'weddings',
    title: 'Weddings',
    count: 38,
    color: 'bg-soft-lime',
    cards: [
      { title: 'Mark & Olivia', subtitle: 'Sunset Cliffs Ceremony', tag: 'Edit', tagColor: 'purple' },
      { title: 'Sarah & Tom', subtitle: 'Downtown Industrial Loft', tag: 'Select', tagColor: 'blue' },
    ]
  },
  {
    id: 'portraits',
    title: 'Portraits',
    count: 12,
    color: 'bg-yellow-400',
    cards: [
      { title: 'Senior Session', subtitle: 'Golden Hour Beach', tag: 'Deliver', tagColor: 'orange' },
    ]
  },
  {
    id: 'events',
    title: 'Events',
    count: 16,
    color: 'bg-purple-400',
    cards: [
      { title: 'Tech Conference', subtitle: 'Keynote & Mixer', tag: 'Upload', tagColor: 'blue' },
      { title: 'Gala Dinner', subtitle: 'Fundraiser 2024', tag: 'Edit', tagColor: 'purple' },
    ]
  }
] as const

export function SoftGalleryBoard() {
  return (
    <div className="w-full h-full flex flex-col gap-8">
      {/* Board Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-3xl font-bold text-gray-900">Galleries</h2>
          <div className="flex items-center gap-2 bg-white rounded-full p-1 shadow-neumorphic-sm">
             <button className="px-4 py-1.5 rounded-full bg-gray-900 text-white text-sm font-medium shadow-md">
               Active
             </button>
             <button className="px-4 py-1.5 rounded-full text-gray-500 text-sm font-medium hover:bg-gray-50">
               Archived
             </button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Plus className="w-4 h-4" />
            Add Space
          </button>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <LayoutGrid className="w-5 h-5 cursor-pointer hover:text-gray-900" />
          <List className="w-5 h-5 cursor-pointer hover:text-gray-900" />
          <MoreHorizontal className="w-5 h-5 cursor-pointer hover:text-gray-900" />
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto pb-8">
        <div className="flex gap-6 min-w-max">
          {columns.map((col, i) => (
            <div key={col.id} className="w-[340px] flex flex-col gap-4">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2 rounded-full", col.color)} />
                  <h3 className="font-bold text-gray-900">{col.title}</h3>
                  <span className="text-gray-400 font-medium text-sm">{col.count}</span>
                </div>
                <button className="p-1 hover:bg-gray-200 rounded-md transition-colors">
                  <Plus className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-4">
                {col.cards.map((card, cardIndex) => (
                  <SoftCard
                    key={card.title}
                    title={card.title}
                    subtitle={card.subtitle}
                    tag={card.tag}
                    tagColor={card.tagColor}
                    delay={i * 0.1 + cardIndex * 0.1}
                    className={cardIndex === 0 && col.id === 'weddings' ? 'rotate-1 hover:rotate-0 z-10' : ''}
                    image={cardIndex === 0 ? `/images/showcase/modern-wedding-gallery-0${i+1}.jpg` : undefined}
                  >
                    <div className="flex items-center gap-2 mt-2">
                      <div className="w-6 h-6 rounded-full bg-gray-200 border border-white" />
                      <span className="text-xs text-gray-400 font-medium">2d ago</span>
                    </div>
                  </SoftCard>
                ))}
              </div>
            </div>
          ))}
          
          {/* Add Column Placeholder */}
          <div className="w-[340px] h-32 border-2 border-dashed border-gray-200 rounded-[24px] flex items-center justify-center text-gray-400 font-medium cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-all">
            + Add Status
          </div>
        </div>
      </div>
    </div>
  )
}
