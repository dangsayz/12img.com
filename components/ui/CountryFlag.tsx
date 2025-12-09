'use client'

import { motion } from 'framer-motion'

/**
 * Elegant, minimal country flag component
 * Monochrome design with subtle details - world-class aesthetic
 */

interface CountryFlagProps {
  country: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animate?: boolean
}

// Size mappings
const SIZES = {
  sm: { width: 20, height: 14 },
  md: { width: 28, height: 20 },
  lg: { width: 36, height: 26 },
}

// Elegant monochrome flag designs - minimal, editorial aesthetic
// Each flag is a simplified, iconic representation
const FLAG_PATHS: Record<string, (w: number, h: number) => React.ReactNode> = {
  'United States': (w, h) => (
    <>
      {/* Stripes - simplified to 5 */}
      {[0, 1, 2, 3, 4].map(i => (
        <rect 
          key={i} 
          x={0} 
          y={i * (h / 5)} 
          width={w} 
          height={h / 5} 
          fill={i % 2 === 0 ? 'currentColor' : 'transparent'}
          opacity={i % 2 === 0 ? 0.15 : 0}
        />
      ))}
      {/* Canton */}
      <rect x={0} y={0} width={w * 0.4} height={h * 0.6} fill="currentColor" opacity={0.9} />
      {/* Single star - iconic */}
      <polygon 
        points={`${w * 0.2},${h * 0.15} ${w * 0.23},${h * 0.25} ${w * 0.33},${h * 0.25} ${w * 0.25},${h * 0.32} ${w * 0.28},${h * 0.42} ${w * 0.2},${h * 0.35} ${w * 0.12},${h * 0.42} ${w * 0.15},${h * 0.32} ${w * 0.07},${h * 0.25} ${w * 0.17},${h * 0.25}`}
        fill="white"
      />
    </>
  ),
  
  'United Kingdom': (w, h) => (
    <>
      {/* Background */}
      <rect width={w} height={h} fill="currentColor" opacity={0.1} />
      {/* Cross of St George */}
      <rect x={w * 0.42} y={0} width={w * 0.16} height={h} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="currentColor" opacity={0.9} />
      {/* Diagonal lines */}
      <line x1={0} y1={0} x2={w} y2={h} stroke="currentColor" strokeWidth={w * 0.06} opacity={0.5} />
      <line x1={w} y1={0} x2={0} y2={h} stroke="currentColor" strokeWidth={w * 0.06} opacity={0.5} />
    </>
  ),
  
  'Canada': (w, h) => (
    <>
      {/* Side bars */}
      <rect x={0} y={0} width={w * 0.25} height={h} fill="currentColor" opacity={0.9} />
      <rect x={w * 0.75} y={0} width={w * 0.25} height={h} fill="currentColor" opacity={0.9} />
      {/* Maple leaf - simplified */}
      <path 
        d={`M${w * 0.5},${h * 0.15} L${w * 0.55},${h * 0.35} L${w * 0.65},${h * 0.35} L${w * 0.55},${h * 0.5} L${w * 0.6},${h * 0.7} L${w * 0.5},${h * 0.6} L${w * 0.4},${h * 0.7} L${w * 0.45},${h * 0.5} L${w * 0.35},${h * 0.35} L${w * 0.45},${h * 0.35} Z`}
        fill="currentColor"
        opacity={0.9}
      />
    </>
  ),
  
  'Australia': (w, h) => (
    <>
      {/* Background */}
      <rect width={w} height={h} fill="currentColor" opacity={0.9} />
      {/* Union Jack canton - simplified */}
      <rect x={0} y={0} width={w * 0.5} height={h * 0.5} fill="white" />
      <rect x={w * 0.2} y={0} width={w * 0.1} height={h * 0.5} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h * 0.2} width={w * 0.5} height={h * 0.1} fill="currentColor" opacity={0.9} />
      {/* Southern Cross - simplified dots */}
      <circle cx={w * 0.75} cy={h * 0.25} r={w * 0.03} fill="white" />
      <circle cx={w * 0.85} cy={h * 0.5} r={w * 0.03} fill="white" />
      <circle cx={w * 0.75} cy={h * 0.75} r={w * 0.03} fill="white" />
      <circle cx={w * 0.6} cy={h * 0.6} r={w * 0.03} fill="white" />
    </>
  ),
  
  'Germany': (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h / 3} fill="currentColor" opacity={0.95} />
      <rect x={0} y={h / 3} width={w} height={h / 3} fill="currentColor" opacity={0.5} />
      <rect x={0} y={h * 2 / 3} width={w} height={h / 3} fill="currentColor" opacity={0.2} />
    </>
  ),
  
  'France': (w, h) => (
    <>
      <rect x={0} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.9} />
      <rect x={w / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.1} />
      <rect x={w * 2 / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.5} />
    </>
  ),
  
  'Spain': (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h * 0.25} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h * 0.25} width={w} height={h * 0.5} fill="currentColor" opacity={0.3} />
      <rect x={0} y={h * 0.75} width={w} height={h * 0.25} fill="currentColor" opacity={0.9} />
      {/* Coat of arms - simplified shield */}
      <rect x={w * 0.15} y={h * 0.35} width={w * 0.12} height={h * 0.3} rx={w * 0.02} fill="currentColor" opacity={0.7} />
    </>
  ),
  
  'Italy': (w, h) => (
    <>
      <rect x={0} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.4} />
      <rect x={w / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.1} />
      <rect x={w * 2 / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.6} />
    </>
  ),
  
  'Netherlands': (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h / 3} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h / 3} width={w} height={h / 3} fill="currentColor" opacity={0.1} />
      <rect x={0} y={h * 2 / 3} width={w} height={h / 3} fill="currentColor" opacity={0.7} />
    </>
  ),
  
  'Belgium': (w, h) => (
    <>
      <rect x={0} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.95} />
      <rect x={w / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.4} />
      <rect x={w * 2 / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.6} />
    </>
  ),
  
  'Sweden': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.8} />
      {/* Nordic cross */}
      <rect x={w * 0.28} y={0} width={w * 0.14} height={h} fill="currentColor" opacity={0.2} />
      <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="currentColor" opacity={0.2} />
    </>
  ),
  
  'Norway': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.9} />
      {/* Nordic cross - white outline */}
      <rect x={w * 0.26} y={0} width={w * 0.18} height={h} fill="white" />
      <rect x={0} y={h * 0.35} width={w} height={h * 0.3} fill="white" />
      {/* Inner cross */}
      <rect x={w * 0.3} y={0} width={w * 0.1} height={h} fill="currentColor" opacity={0.7} />
      <rect x={0} y={h * 0.4} width={w} height={h * 0.2} fill="currentColor" opacity={0.7} />
    </>
  ),
  
  'Denmark': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.9} />
      {/* Nordic cross */}
      <rect x={w * 0.28} y={0} width={w * 0.14} height={h} fill="white" />
      <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="white" />
    </>
  ),
  
  'Finland': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.1} />
      {/* Nordic cross */}
      <rect x={w * 0.28} y={0} width={w * 0.14} height={h} fill="currentColor" opacity={0.8} />
      <rect x={0} y={h * 0.38} width={w} height={h * 0.24} fill="currentColor" opacity={0.8} />
    </>
  ),
  
  'Ireland': (w, h) => (
    <>
      <rect x={0} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.5} />
      <rect x={w / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.1} />
      <rect x={w * 2 / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.4} />
    </>
  ),
  
  'Japan': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.05} />
      <circle cx={w / 2} cy={h / 2} r={h * 0.3} fill="currentColor" opacity={0.9} />
    </>
  ),
  
  'South Korea': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.05} />
      {/* Taeguk - simplified */}
      <circle cx={w / 2} cy={h / 2} r={h * 0.28} fill="currentColor" opacity={0.8} />
      <path 
        d={`M${w * 0.5},${h * 0.22} A${h * 0.14},${h * 0.14} 0 0,1 ${w * 0.5},${h * 0.5} A${h * 0.14},${h * 0.14} 0 0,0 ${w * 0.5},${h * 0.78}`}
        fill="currentColor"
        opacity={0.3}
      />
    </>
  ),
  
  'Brazil': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.5} />
      {/* Diamond */}
      <polygon 
        points={`${w * 0.5},${h * 0.1} ${w * 0.9},${h * 0.5} ${w * 0.5},${h * 0.9} ${w * 0.1},${h * 0.5}`}
        fill="currentColor"
        opacity={0.3}
      />
      {/* Circle */}
      <circle cx={w / 2} cy={h / 2} r={h * 0.22} fill="currentColor" opacity={0.9} />
    </>
  ),
  
  'Mexico': (w, h) => (
    <>
      <rect x={0} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.5} />
      <rect x={w / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.1} />
      <rect x={w * 2 / 3} y={0} width={w / 3} height={h} fill="currentColor" opacity={0.6} />
      {/* Eagle - simplified circle */}
      <circle cx={w / 2} cy={h / 2} r={h * 0.18} fill="currentColor" opacity={0.7} />
    </>
  ),
  
  'India': (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h / 3} fill="currentColor" opacity={0.7} />
      <rect x={0} y={h / 3} width={w} height={h / 3} fill="currentColor" opacity={0.1} />
      <rect x={0} y={h * 2 / 3} width={w} height={h / 3} fill="currentColor" opacity={0.5} />
      {/* Ashoka Chakra - simplified */}
      <circle cx={w / 2} cy={h / 2} r={h * 0.12} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.8} />
    </>
  ),
  
  'Singapore': (w, h) => (
    <>
      <rect x={0} y={0} width={w} height={h / 2} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h / 2} width={w} height={h / 2} fill="currentColor" opacity={0.1} />
      {/* Crescent and stars - simplified */}
      <circle cx={w * 0.2} cy={h * 0.25} r={h * 0.12} fill="white" />
      <circle cx={w * 0.24} cy={h * 0.25} r={h * 0.09} fill="currentColor" opacity={0.9} />
    </>
  ),
  
  'United Arab Emirates': (w, h) => (
    <>
      <rect x={0} y={0} width={w * 0.25} height={h} fill="currentColor" opacity={0.9} />
      <rect x={w * 0.25} y={0} width={w * 0.75} height={h / 3} fill="currentColor" opacity={0.5} />
      <rect x={w * 0.25} y={h / 3} width={w * 0.75} height={h / 3} fill="currentColor" opacity={0.1} />
      <rect x={w * 0.25} y={h * 2 / 3} width={w * 0.75} height={h / 3} fill="currentColor" opacity={0.95} />
    </>
  ),
  
  'New Zealand': (w, h) => (
    <>
      <rect width={w} height={h} fill="currentColor" opacity={0.9} />
      {/* Union Jack canton - simplified */}
      <rect x={0} y={0} width={w * 0.5} height={h * 0.5} fill="white" />
      <rect x={w * 0.2} y={0} width={w * 0.1} height={h * 0.5} fill="currentColor" opacity={0.9} />
      <rect x={0} y={h * 0.2} width={w * 0.5} height={h * 0.1} fill="currentColor" opacity={0.9} />
      {/* Southern Cross */}
      <circle cx={w * 0.7} cy={h * 0.3} r={w * 0.025} fill="white" />
      <circle cx={w * 0.85} cy={h * 0.5} r={w * 0.025} fill="white" />
      <circle cx={w * 0.75} cy={h * 0.7} r={w * 0.025} fill="white" />
      <circle cx={w * 0.65} cy={h * 0.55} r={w * 0.025} fill="white" />
    </>
  ),
  
  'South Africa': (w, h) => (
    <>
      {/* Y-shape flag */}
      <rect width={w} height={h} fill="currentColor" opacity={0.5} />
      <polygon points={`0,0 ${w * 0.4},${h * 0.5} 0,${h}`} fill="currentColor" opacity={0.9} />
      <rect x={0} y={0} width={w} height={h * 0.3} fill="currentColor" opacity={0.3} />
      <rect x={0} y={h * 0.7} width={w} height={h * 0.3} fill="currentColor" opacity={0.7} />
    </>
  ),
}

// Default flag for countries without custom design
const DefaultFlag = (w: number, h: number) => (
  <>
    <rect width={w} height={h} fill="currentColor" opacity={0.15} rx={1} />
    <circle cx={w / 2} cy={h / 2} r={h * 0.25} fill="currentColor" opacity={0.4} />
  </>
)

export function CountryFlag({ country, size = 'md', className = '', animate = true }: CountryFlagProps) {
  const { width, height } = SIZES[size]
  const FlagContent = FLAG_PATHS[country] || DefaultFlag
  
  const content = (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      className="text-stone-800 rounded-[2px] overflow-hidden shadow-sm ring-1 ring-stone-200/50"
      style={{ 
        filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.05))',
      }}
    >
      {FlagContent(width, height)}
      {/* Subtle inner border for polish */}
      <rect 
        x={0.5} 
        y={0.5} 
        width={width - 1} 
        height={height - 1} 
        fill="none" 
        stroke="currentColor" 
        strokeWidth={0.5}
        opacity={0.1}
        rx={1}
      />
    </svg>
  )
  
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] as const }}
        className={`inline-flex items-center justify-center ${className}`}
        title={country}
      >
        {content}
      </motion.div>
    )
  }
  
  return (
    <div className={`inline-flex items-center justify-center ${className}`} title={country}>
      {content}
    </div>
  )
}

// Export helper to check if we have a custom flag
export function hasCustomFlag(country: string | null | undefined): boolean {
  if (!country) return false
  return country in FLAG_PATHS
}
