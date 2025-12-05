'use client'

import { Plus } from 'lucide-react'

export function TeamBlock() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ruanta-text-primary">Team</h3>
        <button className="p-1 rounded-full hover:bg-gray-100 transition-colors">
          <Plus className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      <div className="
        bg-ruanta-bg rounded-ruanta-md p-4 
        flex items-center justify-between
        border border-ruanta-border
      ">
        <div className="flex -space-x-3 pl-1">
          {[1,2,3].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-ruanta-bg shadow-sm overflow-hidden bg-gray-200 relative z-10 hover:z-20 transition-all hover:scale-110">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i+20}`} alt="Member" />
            </div>
          ))}
          <div className="w-8 h-8 rounded-full border-2 border-ruanta-bg bg-white flex items-center justify-center text-[10px] font-bold text-gray-400 relative z-0">
            +7
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-ruanta-accent-green/20 text-lime-800 text-xs font-bold flex items-center gap-1">
          ↗ 87%
        </div>
      </div>
    </div>
  )
}
