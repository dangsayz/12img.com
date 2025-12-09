'use client'

import {
  Flower2,
  ClipboardList,
  Building2,
  Music,
  UtensilsCrossed,
  Cake,
  Armchair,
  Scissors,
  Video,
  ScrollText,
  Car,
  Camera,
  PenTool,
  Lightbulb,
  ImagePlus,
  Palette,
  Shirt,
  Gem,
  PartyPopper,
  MoreHorizontal,
  LucideIcon,
} from 'lucide-react'
import { VendorCategory } from '@/lib/vendors/types'

const ICON_MAP: Record<VendorCategory, LucideIcon> = {
  florist: Flower2,
  planner: ClipboardList,
  venue: Building2,
  dj: Music,
  caterer: UtensilsCrossed,
  bakery: Cake,
  rentals: Armchair,
  hair_makeup: Scissors,
  videographer: Video,
  officiant: ScrollText,
  transportation: Car,
  photographer: Camera,
  stationery: PenTool,
  lighting: Lightbulb,
  photo_booth: ImagePlus,
  decor: Palette,
  bridal: Shirt,
  jewelry: Gem,
  entertainment: PartyPopper,
  other: MoreHorizontal,
}

interface VendorCategoryIconProps {
  category: VendorCategory
  className?: string
  size?: number
}

export function VendorCategoryIcon({ category, className = '', size = 16 }: VendorCategoryIconProps) {
  const Icon = ICON_MAP[category] || MoreHorizontal
  return <Icon className={className} size={size} />
}
