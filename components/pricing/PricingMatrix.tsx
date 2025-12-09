'use client'

import { useState } from 'react'
import { FeatureCell } from './FeatureCell'
import { PricingButton } from '@/components/billing/PricingButton'
import {
  PLAN_TIERS,
  PLAN_ORDER,
  FEATURE_GROUPS,
  FEATURE_ROWS,
  type PlanTier,
  type FeatureGroupId,
} from '@/lib/config/pricing-v2'

interface PricingMatrixProps {
  showAllFeatures?: boolean
  className?: string
  currentPlan?: PlanTier | null
}

export function PricingMatrix({ showAllFeatures = true, className = '', currentPlan = null }: PricingMatrixProps) {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly')
  // On mobile, start with groups collapsed for less overwhelm
  // On desktop, start expanded for full comparison view
  const [expandedGroups, setExpandedGroups] = useState<Set<FeatureGroupId>>(
    typeof window !== 'undefined' && window.innerWidth < 768 
      ? new Set<FeatureGroupId>() 
      : new Set(FEATURE_GROUPS.map(g => g.id))
  )

  const toggleGroup = (groupId: FeatureGroupId) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupId)) {
        next.delete(groupId)
      } else {
        next.add(groupId)
      }
      return next
    })
  }

  const getPrice = (planId: PlanTier) => {
    const plan = PLAN_TIERS[planId]
    return billingPeriod === 'monthly' ? plan.monthlyPrice : plan.annualMonthly
  }

  const plans = PLAN_ORDER.map(id => PLAN_TIERS[id])

  // Helper to determine button state based on current plan
  const getButtonState = (planId: PlanTier): 'current' | 'upgrade' | 'downgrade' | 'signup' => {
    if (!currentPlan) return 'signup'
    if (planId === currentPlan) return 'current'
    const currentIndex = PLAN_ORDER.indexOf(currentPlan)
    const targetIndex = PLAN_ORDER.indexOf(planId)
    return targetIndex > currentIndex ? 'upgrade' : 'downgrade'
  }

  const getButtonText = (plan: typeof plans[number]) => {
    const state = getButtonState(plan.id)
    switch (state) {
      case 'current': return 'Current Plan'
      case 'upgrade': return `Upgrade to ${plan.name}`
      case 'downgrade': return `Downgrade to ${plan.name}`
      default: return plan.monthlyPrice === 0 ? 'Start Free' : `Get ${plan.name}`
    }
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Billing Toggle - Hidden until annual plans are available */}
      {/* TODO: Uncomment when annual billing is ready
      <div className="flex justify-center mb-12">
        <div className="inline-flex items-center gap-1 p-1 bg-gray-100">
          <button
            onClick={() => setBillingPeriod('monthly')}
            className={`transition-all ${
              billingPeriod === 'monthly'
                ? 'text-[#141414] border-b border-[#141414]'
                : 'text-[#525252] hover:text-[#141414]'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingPeriod('annual')}
            className={`transition-all flex items-center gap-2 ${
              billingPeriod === 'annual'
                ? 'text-[#141414] border-b border-[#141414]'
                : 'text-[#525252] hover:text-[#141414]'
            }`}
          >
            Annual
            <span className="text-[10px] uppercase tracking-wider text-[#525252] font-medium">Save 17%</span>
          </button>
        </div>
      </div>
      */}

      {/* Mobile: Stacked Cards */}
      <div className="md:hidden space-y-4">
        {plans.map((plan) => (
          <MobilePlanCard
            key={plan.id}
            plan={plan}
            price={getPrice(plan.id)}
            billingPeriod={billingPeriod}
            buttonState={getButtonState(plan.id)}
            buttonText={getButtonText(plan)}
            currentPlan={currentPlan}
            showAllFeatures={showAllFeatures}
            expandedGroups={expandedGroups}
            onToggleGroup={toggleGroup}
          />
        ))}
      </div>

      {/* Desktop: Matrix Table */}
      <div className="hidden md:block w-full overflow-x-auto">
        <div className="min-w-[800px]">
          <table className="w-full border-collapse">
            {/* Header */}
            <thead>
              <tr className="border-b border-[#E5E5E5]">
                {/* Feature column header */}
                <th className="sticky left-0 z-20 bg-[#F5F5F7] min-w-[200px] p-6 text-left align-bottom">
                  <span className="text-xs uppercase tracking-wider text-[#525252]">Compare plans</span>
                </th>
                
                {/* Plan headers */}
                {plans.map((plan) => (
                  <th
                    key={plan.id}
                    className="min-w-[140px] p-6 text-center align-bottom bg-[#F5F5F7] relative"
                  >
                    {/* Current plan or popular indicator */}
                    {currentPlan === plan.id ? (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-emerald-600 font-medium">
                          Your Plan
                        </span>
                      </div>
                    ) : plan.isPopular && (
                      <div className="absolute top-3 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] uppercase tracking-[0.2em] text-[#525252]">
                          Popular
                        </span>
                      </div>
                    )}
                    
                    <div className="font-serif text-lg text-[#141414]">
                      {plan.name}
                    </div>
                    <div className="mt-3">
                      <span className="font-serif text-4xl text-[#141414]">
                        ${getPrice(plan.id)}
                      </span>
                      <span className="text-sm text-[#525252] ml-0.5">
                        /mo
                      </span>
                    </div>
                    {/* Annual price - hidden until annual billing ready
                    {billingPeriod === 'annual' && plan.monthlyPrice > 0 && (
                      <div className="text-xs text-[#525252] mt-1">
                        ${plan.annualPrice}/year
                      </div>
                    )}
                    */}
                    <div className="mt-5">
                      {getButtonState(plan.id) === 'current' ? (
                        <div className="w-full px-4 py-2.5 text-sm font-medium text-[#525252] cursor-default">
                          Current Plan
                        </div>
                      ) : (
                        <PricingButton
                          planId={plan.id}
                          className={`w-full px-4 py-2.5 text-sm font-semibold transition-all border ${
                            plan.isPopular
                              ? 'bg-[#141414] text-white border-[#141414] hover:bg-black'
                              : 'bg-transparent text-[#141414] border-[#141414] hover:bg-[#141414] hover:text-white'
                          }`}
                        >
                          {getButtonText(plan)}
                        </PricingButton>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {showAllFeatures ? (
                // Full feature matrix with groups
                FEATURE_GROUPS.map((group) => {
                  const groupFeatures = FEATURE_ROWS.filter(f => f.group === group.id)
                  const isExpanded = expandedGroups.has(group.id)

                  return (
                    <FeatureGroupSection
                      key={group.id}
                      group={group}
                      features={groupFeatures}
                      plans={plans}
                      isExpanded={isExpanded}
                      onToggle={() => toggleGroup(group.id)}
                    />
                  )
                })
              ) : (
                // Simplified view - just storage rows
                FEATURE_ROWS
                  .filter(f => f.group === 'storage')
                  .map((feature, idx) => (
                    <FeatureRowComponent
                      key={feature.id}
                      feature={feature}
                      plans={plans}
                      isLast={idx === FEATURE_ROWS.filter(f => f.group === 'storage').length - 1}
                    />
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// ─── Feature Group Section ───
interface FeatureGroupSectionProps {
  group: { id: FeatureGroupId; label: string }
  features: typeof FEATURE_ROWS
  plans: typeof PLAN_ORDER extends (infer T)[] ? (typeof PLAN_TIERS)[T & PlanTier][] : never
  isExpanded: boolean
  onToggle: () => void
}

function FeatureGroupSection({ group, features, plans, isExpanded, onToggle }: FeatureGroupSectionProps) {
  return (
    <>
      {/* Group Header */}
      <tr>
        <td
          colSpan={plans.length + 1}
          className="border-t border-[#E5E5E5] bg-[#F5F5F7]"
        >
          <button
            onClick={onToggle}
            className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-[#EBEBED] transition-colors"
          >
            <svg
              className={`w-3 h-3 text-[#525252] transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="font-serif text-[#141414]">{group.label}</span>
            <span className="text-[10px] uppercase tracking-wider text-[#525252]">
              {features.length}
            </span>
          </button>
        </td>
      </tr>

      {/* Feature Rows */}
      {isExpanded && features.map((feature, idx) => (
        <FeatureRowComponent
          key={feature.id}
          feature={feature}
          plans={plans}
          isLast={idx === features.length - 1}
        />
      ))}
    </>
  )
}

// ─── Feature Row Component ───
interface FeatureRowComponentProps {
  feature: typeof FEATURE_ROWS[number]
  plans: { id: PlanTier; isPopular?: boolean }[]
  isLast?: boolean
}

function FeatureRowComponent({ feature, plans, isLast }: FeatureRowComponentProps) {
  return (
    <tr className={`${isLast ? '' : 'border-b border-[#E5E5E5]/50'} bg-white`}>
      {/* Feature label */}
      <td className="sticky left-0 z-10 bg-white p-6 min-w-[200px]">
        <div className="text-sm text-[#141414]">{feature.label}</div>
        {feature.description && (
          <div className="text-xs text-[#525252] mt-0.5">{feature.description}</div>
        )}
      </td>

      {/* Plan cells */}
      {plans.map((plan) => (
        <td
          key={plan.id}
          className={`p-6 text-center min-w-[140px] ${
            plan.isPopular ? 'bg-[#F5F5F7]/50' : ''
          }`}
        >
          <FeatureCell
            value={feature.availability[plan.id]}
            isPopularPlan={plan.isPopular}
          />
        </td>
      ))}
    </tr>
  )
}

// ─── Mobile Plan Card ───
// World-class mobile UX with:
// - 56px minimum touch targets (Apple HIG)
// - Progressive disclosure
// - Subtle color accents (sage for included, warm sand for sections)
// - Generous spacing for thumb-friendly navigation

interface MobilePlanCardProps {
  plan: typeof PLAN_TIERS[PlanTier]
  price: number
  billingPeriod: 'monthly' | 'annual'
  buttonState: 'current' | 'upgrade' | 'downgrade' | 'signup'
  buttonText: string
  currentPlan: PlanTier | null
  showAllFeatures: boolean
  expandedGroups: Set<FeatureGroupId>
  onToggleGroup: (groupId: FeatureGroupId) => void
}

// Subtle color palette additions
const MOBILE_COLORS = {
  sage: '#E8F5E9',      // Soft sage for "included" indicators
  sageText: '#2E7D32',  // Darker sage for text
  sand: '#FAF8F5',      // Warm sand for section backgrounds
  sandBorder: '#EDE8E3', // Warm border
}

function MobilePlanCard({
  plan,
  price,
  billingPeriod,
  buttonState,
  buttonText,
  currentPlan,
  showAllFeatures,
  expandedGroups,
  onToggleGroup,
}: MobilePlanCardProps) {
  const [isExpanded, setIsExpanded] = useState(plan.isPopular || currentPlan === plan.id)

  // Count included features for this plan
  const includedCount = FEATURE_ROWS.filter(f => {
    const val = f.availability[plan.id]
    return val.status === 'included' || val.status === 'limited'
  }).length

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm ${
      plan.isPopular ? 'border-[#141414] ring-1 ring-[#141414]' : 'border-stone-200'
    }`}>
      {/* Card Header - More breathing room */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            {currentPlan === plan.id ? (
              <span 
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider font-medium mb-2"
                style={{ backgroundColor: MOBILE_COLORS.sage, color: MOBILE_COLORS.sageText }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                Your Plan
              </span>
            ) : plan.isPopular && (
              <span className="inline-block px-2.5 py-1 rounded-full text-[11px] uppercase tracking-wider text-stone-600 bg-stone-100 mb-2">
                Popular
              </span>
            )}
            <h3 className="font-serif text-2xl text-[#141414]">{plan.name}</h3>
          </div>
          <div className="text-right">
            <span className="font-serif text-4xl text-[#141414]">${price}</span>
            <span className="text-base text-stone-400">/mo</span>
          </div>
        </div>

        {/* Key info - Pill style for better scannability */}
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-700">
            {plan.storageGB >= 1000 ? `${plan.storageGB / 1000}TB` : `${plan.storageGB}GB`} storage
          </span>
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm bg-stone-100 text-stone-700">
            {plan.galleryLimit === 'unlimited' ? 'Unlimited' : plan.galleryLimit} galleries
          </span>
        </div>

        {/* CTA Button - Larger touch target (56px) */}
        <div className="mt-6">
          {buttonState === 'current' ? (
            <div className="w-full h-14 flex items-center justify-center text-sm font-medium text-stone-400 border border-stone-200 rounded-xl">
              Current Plan
            </div>
          ) : (
            <PricingButton
              planId={plan.id}
              className={`w-full h-14 flex items-center justify-center text-sm font-semibold transition-all rounded-xl active:scale-[0.98] ${
                plan.isPopular
                  ? 'bg-[#141414] text-white active:bg-black'
                  : 'bg-white text-[#141414] border border-[#141414] active:bg-stone-50'
              }`}
            >
              {buttonText}
            </PricingButton>
          )}
        </div>
      </div>

      {/* Expandable Features - Redesigned for mobile */}
      {showAllFeatures && (
        <>
          {/* Main toggle - 56px touch target */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full h-14 px-6 flex items-center justify-between border-t border-stone-100 bg-stone-50/50 active:bg-stone-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-stone-700">View features</span>
              <span 
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: MOBILE_COLORS.sage, color: MOBILE_COLORS.sageText }}
              >
                {includedCount} included
              </span>
            </div>
            <svg
              className={`w-5 h-5 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <div className="border-t border-stone-100">
              {FEATURE_GROUPS.map((group) => {
                const groupFeatures = FEATURE_ROWS.filter(f => f.group === group.id)
                const isGroupExpanded = expandedGroups.has(group.id)
                
                // Count included in this group for this plan
                const groupIncluded = groupFeatures.filter(f => {
                  const val = f.availability[plan.id]
                  return val.status === 'included' || val.status === 'limited'
                }).length

                return (
                  <div key={group.id}>
                    {/* Group header - 56px touch target with warm sand background */}
                    <button
                      onClick={() => onToggleGroup(group.id)}
                      className="w-full min-h-[56px] px-6 py-4 flex items-center justify-between text-left transition-colors active:bg-stone-100"
                      style={{ backgroundColor: isGroupExpanded ? MOBILE_COLORS.sand : 'transparent' }}
                    >
                      <div className="flex items-center gap-3">
                        <svg
                          className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isGroupExpanded ? 'rotate-90' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-sm font-medium text-stone-800">{group.label}</span>
                      </div>
                      <span className="text-xs text-stone-400">
                        {groupIncluded}/{groupFeatures.length}
                      </span>
                    </button>

                    {isGroupExpanded && (
                      <div 
                        className="border-t"
                        style={{ borderColor: MOBILE_COLORS.sandBorder, backgroundColor: MOBILE_COLORS.sand }}
                      >
                        {groupFeatures.map((feature, idx) => {
                          const featureValue = feature.availability[plan.id]
                          const isIncluded = featureValue.status === 'included' || featureValue.status === 'limited'
                          
                          return (
                            <div 
                              key={feature.id} 
                              className={`px-6 py-4 flex items-start justify-between gap-4 ${
                                idx !== groupFeatures.length - 1 ? 'border-b' : ''
                              }`}
                              style={{ borderColor: MOBILE_COLORS.sandBorder }}
                            >
                              <div className="flex-1 min-w-0">
                                <div className={`text-[15px] leading-tight ${isIncluded ? 'text-stone-800' : 'text-stone-400'}`}>
                                  {feature.label}
                                </div>
                                {feature.description && (
                                  <div className="text-[13px] text-stone-400 mt-1 leading-snug">
                                    {feature.description}
                                  </div>
                                )}
                              </div>
                              <div className="flex-shrink-0 pt-0.5">
                                <MobileFeatureValue value={featureValue} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Mobile-optimized Feature Value Display ───
function MobileFeatureValue({ value }: { value: typeof FEATURE_ROWS[number]['availability'][PlanTier] }) {
  switch (value.status) {
    case 'included':
      return value.note ? (
        <div className="text-right">
          <span className="text-sm font-medium text-stone-800">{value.note}</span>
          {value.tooltip && (
            <div className="text-[11px] text-stone-400 mt-0.5">{value.tooltip}</div>
          )}
        </div>
      ) : (
        <div 
          className="w-6 h-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: MOBILE_COLORS.sage }}
        >
          <svg className="w-3.5 h-3.5" style={{ color: MOBILE_COLORS.sageText }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      )

    case 'excluded':
      return (
        <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
          <svg className="w-3 h-3 text-stone-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </div>
      )

    case 'comingSoon':
      return (
        <span className="px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium bg-stone-100 text-stone-400">
          Soon
        </span>
      )

    case 'limited':
      return (
        <div className="text-right">
          <span className="text-sm text-stone-600">{value.note}</span>
          {value.tooltip && (
            <div className="text-[11px] text-stone-400 mt-0.5 max-w-[120px]">{value.tooltip}</div>
          )}
        </div>
      )

    default:
      return null
  }
}

// ─── Compact Pricing Cards (for landing page hero) ───
export function PricingCardsCompact() {
  const plans = PLAN_ORDER.map(id => PLAN_TIERS[id])

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`px-4 py-2 text-sm font-medium transition-all ${
            plan.isPopular
              ? 'bg-[#141414] text-white'
              : 'bg-[#F5F5F7]'
          }`}
        >
          {plan.isPopular && (
            <div className="absolute -top-2 left-1/2 -translate-x-1/2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 bg-amber-400 text-[#141414] text-[10px] font-bold uppercase tracking-wider whitespace-nowrap`}>
                Popular
              </span>
            </div>
          )}
          <div className={`font-serif text-sm ${plan.isPopular ? 'text-white' : 'text-[#141414]'}`}>
            {plan.name}
          </div>
          <div className="mt-2">
            <span className={`font-serif text-2xl ${plan.isPopular ? 'text-white' : 'text-[#141414]'}`}>
              ${plan.monthlyPrice}
            </span>
            <span className={`text-xs ${plan.isPopular ? 'text-white/60' : 'text-[#525252]'}`}>/mo</span>
          </div>
          <div className={`text-xs mt-1 ${plan.isPopular ? 'text-white/60' : 'text-[#525252]'}`}>
            {plan.storageGB >= 1000 ? `${plan.storageGB / 1000}TB` : `${plan.storageGB}GB`} storage
          </div>
        </div>
      ))}
    </div>
  )
}
