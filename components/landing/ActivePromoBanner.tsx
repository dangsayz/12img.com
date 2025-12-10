'use client'

import { useState, useEffect } from 'react'
import { PromoBanner } from './PromoBanner'
import { PromotionalCampaign } from '@/lib/promos/types'

interface ActivePromoBannerProps {
  position?: 'top' | 'floating'
}

export function ActivePromoBanner({ position = 'floating' }: ActivePromoBannerProps) {
  const [campaign, setCampaign] = useState<PromotionalCampaign | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    async function fetchCampaign() {
      try {
        const res = await fetch('/api/promo/active')
        const data = await res.json()
        setCampaign(data.campaign)
      } catch (error) {
        console.error('Error fetching active campaign:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchCampaign()
  }, [])
  
  if (loading || !campaign) return null
  
  // Check if campaign should show on landing
  if (!campaign.show_on_landing) return null
  
  // Use the campaign's landing position if not overridden
  const displayPosition = position === 'top' ? 'top' : (campaign.landing_position === 'floating' ? 'floating' : 'top')
  
  return <PromoBanner campaign={campaign} position={displayPosition} />
}
