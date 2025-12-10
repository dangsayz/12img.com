'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Calendar, Percent, DollarSign, Tag, Zap } from 'lucide-react'
import {
  createCampaign,
  updateCampaign,
} from '@/server/actions/promo.actions'
import {
  PromotionalCampaign,
  DiscountType,
  DiscountDuration,
  LandingPosition,
  CAMPAIGN_TEMPLATES,
} from '@/lib/promos/types'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  editingCampaign: PromotionalCampaign | null
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function CreateCampaignModal({
  isOpen,
  onClose,
  onSuccess,
  editingCampaign,
}: CreateCampaignModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [maxRedemptions, setMaxRedemptions] = useState<number | null>(null)
  const [targetPlans, setTargetPlans] = useState<string[]>(['essential', 'pro', 'studio', 'elite'])
  const [newUsersOnly, setNewUsersOnly] = useState(false)
  const [discountType, setDiscountType] = useState<DiscountType>('percent')
  const [discountValue, setDiscountValue] = useState(0)
  const [discountDuration, setDiscountDuration] = useState<DiscountDuration>('once')
  const [stripeCouponId, setStripeCouponId] = useState('')
  const [badgeText, setBadgeText] = useState('')
  const [bannerHeadline, setBannerHeadline] = useState('')
  const [bannerSubheadline, setBannerSubheadline] = useState('')
  const [bannerCta, setBannerCta] = useState('Claim Deal')
  const [bannerBgColor, setBannerBgColor] = useState('#141414')
  const [bannerTextColor, setBannerTextColor] = useState('#FFFFFF')
  const [showCountdown, setShowCountdown] = useState(true)
  const [showSpotsRemaining, setShowSpotsRemaining] = useState(false)
  const [showOnLanding, setShowOnLanding] = useState(true)
  const [showOnPricing, setShowOnPricing] = useState(true)
  const [landingPosition, setLandingPosition] = useState<LandingPosition>('floating')
  const [isFeatured, setIsFeatured] = useState(false)
  
  // Reset form when modal opens/closes or editing campaign changes
  useEffect(() => {
    if (editingCampaign) {
      setName(editingCampaign.name)
      setSlug(editingCampaign.slug)
      setDescription(editingCampaign.description || '')
      setStartsAt(editingCampaign.starts_at.slice(0, 16))
      setEndsAt(editingCampaign.ends_at.slice(0, 16))
      setMaxRedemptions(editingCampaign.max_redemptions)
      setTargetPlans(editingCampaign.target_plans)
      setNewUsersOnly(editingCampaign.new_users_only)
      setDiscountType(editingCampaign.discount_type)
      setDiscountValue(editingCampaign.discount_value)
      setDiscountDuration(editingCampaign.discount_duration)
      setStripeCouponId(editingCampaign.stripe_coupon_id || '')
      setBadgeText(editingCampaign.badge_text || '')
      setBannerHeadline(editingCampaign.banner_headline)
      setBannerSubheadline(editingCampaign.banner_subheadline || '')
      setBannerCta(editingCampaign.banner_cta)
      setBannerBgColor(editingCampaign.banner_bg_color)
      setBannerTextColor(editingCampaign.banner_text_color)
      setShowCountdown(editingCampaign.show_countdown)
      setShowSpotsRemaining(editingCampaign.show_spots_remaining)
      setShowOnLanding(editingCampaign.show_on_landing)
      setShowOnPricing(editingCampaign.show_on_pricing)
      setLandingPosition(editingCampaign.landing_position)
      setIsFeatured(editingCampaign.is_featured)
    } else if (isOpen) {
      // Reset to defaults for new campaign
      setName('')
      setSlug('')
      setDescription('')
      const now = new Date()
      const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
      setStartsAt(now.toISOString().slice(0, 16))
      setEndsAt(later.toISOString().slice(0, 16))
      setMaxRedemptions(null)
      setTargetPlans(['essential', 'pro', 'studio', 'elite'])
      setNewUsersOnly(false)
      setDiscountType('percent')
      setDiscountValue(0)
      setDiscountDuration('once')
      setStripeCouponId('')
      setBadgeText('')
      setBannerHeadline('')
      setBannerSubheadline('')
      setBannerCta('Claim Deal')
      setBannerBgColor('#141414')
      setBannerTextColor('#FFFFFF')
      setShowCountdown(true)
      setShowSpotsRemaining(false)
      setShowOnLanding(true)
      setShowOnPricing(true)
      setLandingPosition('floating')
      setIsFeatured(false)
      setSelectedTemplate(null)
    }
    setError(null)
  }, [isOpen, editingCampaign])
  
  // Auto-generate slug from name
  useEffect(() => {
    if (!editingCampaign && name) {
      setSlug(generateSlug(name))
    }
  }, [name, editingCampaign])
  
  const applyTemplate = (templateId: string) => {
    const template = CAMPAIGN_TEMPLATES.find(t => t.id === templateId)
    if (!template) return
    
    setSelectedTemplate(templateId)
    setName(template.name)
    setDescription(template.description)
    setDiscountType(template.discount_type)
    setDiscountValue(template.discount_value)
    setTargetPlans(template.target_plans)
    setBadgeText(template.badge_text)
    setBannerHeadline(template.banner_headline)
    setBannerSubheadline(template.banner_subheadline)
    
    if (template.suggested_max_redemptions) {
      setMaxRedemptions(template.suggested_max_redemptions)
      setShowSpotsRemaining(true)
      setShowCountdown(false)
    } else {
      setMaxRedemptions(null)
      setShowSpotsRemaining(false)
      setShowCountdown(true)
    }
    
    const now = new Date()
    const end = new Date(now.getTime() + template.suggested_duration_days * 24 * 60 * 60 * 1000)
    setStartsAt(now.toISOString().slice(0, 16))
    setEndsAt(end.toISOString().slice(0, 16))
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const campaignData = {
        slug,
        name,
        description: description || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: new Date(endsAt).toISOString(),
        max_redemptions: maxRedemptions,
        target_plans: targetPlans,
        new_users_only: newUsersOnly,
        discount_type: discountType,
        discount_value: discountValue,
        discount_duration: discountDuration,
        discount_months: null,
        stripe_coupon_id: stripeCouponId || null,
        stripe_price_ids: {},
        badge_text: badgeText || null,
        banner_headline: bannerHeadline,
        banner_subheadline: bannerSubheadline || null,
        banner_cta: bannerCta,
        banner_bg_color: bannerBgColor,
        banner_text_color: bannerTextColor,
        banner_accent_color: '#10B981',
        show_countdown: showCountdown,
        show_spots_remaining: showSpotsRemaining,
        show_original_price: true,
        show_on_landing: showOnLanding,
        show_on_pricing: showOnPricing,
        landing_position: landingPosition,
        is_active: true,
        is_featured: isFeatured,
        created_by: null,
      }
      
      if (editingCampaign) {
        const result = await updateCampaign(editingCampaign.id, campaignData)
        if (!result.success) {
          throw new Error(result.error || 'Failed to update campaign')
        }
      } else {
        const result = await createCampaign(campaignData)
        if (!result.success) {
          throw new Error(result.error || 'Failed to create campaign')
        }
      }
      
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }
  
  const togglePlan = (plan: string) => {
    setTargetPlans(prev =>
      prev.includes(plan)
        ? prev.filter(p => p !== plan)
        : [...prev, plan]
    )
  }
  
  if (!isOpen) return null
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto py-8"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="bg-white w-full max-w-2xl mx-4 my-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[#E5E5E5]">
            <h2 className="font-serif text-2xl text-[#141414]">
              {editingCampaign ? 'Edit Campaign' : 'Create Campaign'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#F5F5F7] rounded transition-colors"
            >
              <X className="w-5 h-5 text-[#737373]" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Templates */}
            {!editingCampaign && (
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Quick Start Template
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {CAMPAIGN_TEMPLATES.slice(0, 6).map(template => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => applyTemplate(template.id)}
                      className={`p-3 text-left border transition-colors ${
                        selectedTemplate === template.id
                          ? 'border-[#141414] bg-[#F5F5F7]'
                          : 'border-[#E5E5E5] hover:border-[#A3A3A3]'
                      }`}
                    >
                      <p className="text-sm font-medium text-[#141414]">{template.name}</p>
                      <p className="text-xs text-[#737373] mt-0.5">{template.badge_text}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                  placeholder="Black Friday 2025"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none font-mono text-sm"
                  placeholder="black-friday-2025"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                Description
              </label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                placeholder="50% off all annual plans"
              />
            </div>
            
            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Starts At
                </label>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={e => setStartsAt(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  <Calendar className="w-3 h-3 inline mr-1" />
                  Ends At
                </label>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={e => setEndsAt(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                />
              </div>
            </div>
            
            {/* Discount */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Discount Type
                </label>
                <select
                  value={discountType}
                  onChange={e => setDiscountType(e.target.value as DiscountType)}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                >
                  <option value="percent">Percent Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="price_override">Set Price</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  {discountType === 'percent' ? 'Percent' : 'Amount (cents)'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    required
                    min={0}
                    max={discountType === 'percent' ? 100 : undefined}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A3A3]">
                    {discountType === 'percent' ? '%' : '¢'}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Duration
                </label>
                <select
                  value={discountDuration}
                  onChange={e => setDiscountDuration(e.target.value as DiscountDuration)}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                >
                  <option value="once">First Payment</option>
                  <option value="forever">Forever</option>
                  <option value="repeating">X Months</option>
                </select>
              </div>
            </div>
            
            {/* Limits */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Max Redemptions (optional)
                </label>
                <input
                  type="number"
                  value={maxRedemptions || ''}
                  onChange={e => setMaxRedemptions(e.target.value ? Number(e.target.value) : null)}
                  min={1}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                  placeholder="Unlimited"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Stripe Coupon ID
                </label>
                <input
                  type="text"
                  value={stripeCouponId}
                  onChange={e => setStripeCouponId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none font-mono text-sm"
                  placeholder="FOUNDER100"
                />
              </div>
            </div>
            
            {/* Target Plans */}
            <div>
              <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                Target Plans
              </label>
              <div className="flex flex-wrap gap-2">
                {['essential', 'pro', 'studio', 'elite'].map(plan => (
                  <button
                    key={plan}
                    type="button"
                    onClick={() => togglePlan(plan)}
                    className={`px-3 py-1.5 text-sm font-medium capitalize border transition-colors ${
                      targetPlans.includes(plan)
                        ? 'border-[#141414] bg-[#141414] text-white'
                        : 'border-[#E5E5E5] text-[#525252] hover:border-[#A3A3A3]'
                    }`}
                  >
                    {plan}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Banner Display */}
            <div className="border-t border-[#E5E5E5] pt-6">
              <h3 className="text-sm font-medium text-[#141414] mb-4">Banner Display</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={badgeText}
                    onChange={e => setBadgeText(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                    placeholder="50% OFF"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                    CTA Button
                  </label>
                  <input
                    type="text"
                    value={bannerCta}
                    onChange={e => setBannerCta(e.target.value)}
                    className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                    placeholder="Claim Deal"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Headline
                </label>
                <input
                  type="text"
                  value={bannerHeadline}
                  onChange={e => setBannerHeadline(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                  placeholder="Black Friday: 50% off all plans"
                />
              </div>
              
              <div className="mt-4">
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Subheadline
                </label>
                <input
                  type="text"
                  value={bannerSubheadline}
                  onChange={e => setBannerSubheadline(e.target.value)}
                  className="w-full px-4 py-2.5 border border-[#E5E5E5] focus:border-[#141414] focus:outline-none"
                  placeholder="Biggest sale of the year. Ends Monday."
                />
              </div>
              
              {/* Preview */}
              <div className="mt-4">
                <label className="block text-[10px] font-semibold text-[#737373] uppercase tracking-wider mb-2">
                  Preview
                </label>
                <div
                  className="p-4 flex items-center justify-between"
                  style={{ backgroundColor: bannerBgColor, color: bannerTextColor }}
                >
                  <div className="flex items-center gap-3">
                    {badgeText && (
                      <span className="px-2 py-1 text-xs font-bold bg-white/20">
                        {badgeText}
                      </span>
                    )}
                    <div>
                      <p className="font-medium">{bannerHeadline || 'Your headline here'}</p>
                      {bannerSubheadline && (
                        <p className="text-sm opacity-80">{bannerSubheadline}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium bg-white text-[#141414]"
                  >
                    {bannerCta}
                  </button>
                </div>
              </div>
              
              {/* Display Options */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCountdown}
                    onChange={e => setShowCountdown(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#525252]">Show countdown timer</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showSpotsRemaining}
                    onChange={e => setShowSpotsRemaining(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#525252]">Show spots remaining</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnLanding}
                    onChange={e => setShowOnLanding(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#525252]">Show on landing page</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-[#525252]">Featured campaign</span>
                </label>
              </div>
            </div>
            
            {/* Error */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}
          </form>
          
          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[#E5E5E5] bg-[#FAFAFA]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-[#525252] hover:text-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2.5 text-sm font-medium bg-[#141414] text-white hover:bg-[#262626] disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : editingCampaign ? 'Update Campaign' : 'Create Campaign'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
