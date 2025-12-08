'use client'

import { Check, Minus, Info } from 'lucide-react'
import type { FeatureValue } from '@/lib/config/pricing-v2'

interface FeatureCellProps {
  value: FeatureValue
  isPopularPlan?: boolean
}

export function FeatureCell({ value, isPopularPlan = false }: FeatureCellProps) {
  // Editorial color palette - minimal, monochromatic
  const baseTextClass = 'text-[#141414]'
  const mutedTextClass = 'text-[#525252]'
  const checkClass = 'text-[#141414]'
  const minusClass = 'text-[#D4D4D4]'

  switch (value.status) {
    case 'included':
      return value.note ? (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`font-medium ${baseTextClass}`}>{value.note}</span>
          {value.tooltip && (
            <span className={`text-[10px] ${mutedTextClass}`}>{value.tooltip}</span>
          )}
        </div>
      ) : (
        <Check className={`w-4 h-4 mx-auto ${checkClass}`} strokeWidth={1.5} />
      )

    case 'excluded':
      return <Minus className={`w-4 h-4 mx-auto ${minusClass}`} strokeWidth={1.5} />

    case 'comingSoon':
      return (
        <span className="text-[10px] uppercase tracking-wider text-[#525252]">
          Soon
        </span>
      )

    case 'premium':
      return (
        <span className={`inline-flex items-center gap-1 text-sm ${baseTextClass}`}>
          Premium
          {value.tooltip && (
            <span className="group relative">
              <Info className={`w-3.5 h-3.5 ${mutedTextClass} cursor-help`} strokeWidth={1.5} />
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-[#141414] text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50">
                {value.tooltip}
              </span>
            </span>
          )}
        </span>
      )

    case 'addon':
      return (
        <span className={`text-sm ${mutedTextClass}`}>
          {value.note || 'Add-on'}
        </span>
      )

    case 'limited':
      return (
        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-sm ${mutedTextClass}`}>{value.note}</span>
          {value.tooltip && (
            <span className={`text-[10px] ${mutedTextClass}`}>{value.tooltip}</span>
          )}
        </div>
      )

    default:
      return null
  }
}
