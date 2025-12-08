
import React from 'react'
import { EditorialSpread } from '@/lib/editorial/types'
import { Spread } from './Spread'
import { cn } from '@/lib/utils/cn'

interface Props {
  spreads: EditorialSpread[]
  onSpreadClick: (id: string) => void
}

export function SpreadOverview({ spreads, onSpreadClick }: Props) {
  // Filter out the title spread for the index
  const contentSpreads = spreads.filter(s => s.pageNumber && s.pageNumber > 0)

  return (
    <div className="w-full bg-[#FAFAFA] pt-24 pb-32 px-6 md:px-12 border-t border-neutral-100">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="flex justify-between items-baseline mb-16 md:mb-24">
          <h2 className="text-sm font-medium tracking-widest uppercase text-neutral-400">
            Editorial Index
          </h2>
          <span className="text-sm font-serif italic text-neutral-400">
            {contentSpreads.length} Spreads
          </span>
        </div>

        {/* Masonry Grid of Mini Spreads */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 md:gap-8">
          {contentSpreads.map((spread) => (
            <div
              key={spread.id}
              role="button"
              tabIndex={0}
              onClick={() => onSpreadClick(spread.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSpreadClick(spread.id)
                }
              }}
              className="group flex flex-col gap-3 text-left w-full focus:outline-none cursor-pointer"
            >
              {/* Thumbnail Container - Using scale transform for fidelity */}
              <div 
                className={cn(
                  "relative w-full aspect-[4/3] overflow-hidden bg-white shadow-sm transition-all duration-500 ease-out",
                  "group-hover:shadow-xl group-hover:-translate-y-2 ring-1 ring-neutral-900/5 group-hover:ring-neutral-900/10"
                )}
              >
                {/* Scaled Content Wrapper */}
                <div className="absolute inset-0 w-[400%] h-[400%] origin-top-left transform scale-25 pointer-events-none select-none">
                  {/* We force the spread to be 'desktop' mode by mocking viewport */}
                  <div className="w-full h-full grid grid-cols-12 gap-5 p-12">
                     <Spread spread={{...spread, height: 1200}} debug={false} />
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-neutral-900/0 group-hover:bg-neutral-900/5 transition-colors duration-300" />
              </div>

              {/* Meta */}
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] tracking-widest text-neutral-400 font-medium group-hover:text-neutral-900 transition-colors">
                  {spread.pageNumber?.toString().padStart(2, '0')}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-neutral-300 group-hover:text-neutral-500 transition-colors">
                  {spread.template.replace('-', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
