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
  const [expandedGroups, setExpandedGroups] = useState<Set<FeatureGroupId>>(
    new Set(FEATURE_GROUPS.map(g => g.id))
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
      {/* Billing Toggle - Minimal */}
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
                    {billingPeriod === 'annual' && plan.monthlyPrice > 0 && (
                      <div className="text-xs text-[#525252] mt-1">
                        ${plan.annualPrice}/year
                      </div>
                    )}
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

  return (
    <div className={`bg-white border rounded-xl overflow-hidden ${
      plan.isPopular ? 'border-[#141414] ring-1 ring-[#141414]' : 'border-[#E5E5E5]'
    }`}>
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div>
            {currentPlan === plan.id ? (
              <span className="text-[10px] uppercase tracking-wider text-emerald-600 font-medium">
                Your Plan
              </span>
            ) : plan.isPopular && (
              <span className="text-[10px] uppercase tracking-wider text-[#525252]">
                Popular
              </span>
            )}
            <h3 className="font-serif text-xl text-[#141414] mt-1">{plan.name}</h3>
          </div>
          <div className="text-right">
            <span className="font-serif text-3xl text-[#141414]">${price}</span>
            <span className="text-sm text-[#525252]">/mo</span>
            {billingPeriod === 'annual' && plan.monthlyPrice > 0 && (
              <div className="text-xs text-[#525252]">${plan.annualPrice}/yr</div>
            )}
          </div>
        </div>

        {/* Key info */}
        <div className="mt-4 flex items-center gap-4 text-sm text-[#525252]">
          <span>{plan.storageGB >= 1000 ? `${plan.storageGB / 1000}TB` : `${plan.storageGB}GB`} storage</span>
          <span>•</span>
          <span>{plan.galleryLimit === 'unlimited' ? 'Unlimited' : plan.galleryLimit} galleries</span>
        </div>

        {/* CTA Button */}
        <div className="mt-5">
          {buttonState === 'current' ? (
            <div className="w-full px-4 py-3 text-sm font-medium text-[#525252] text-center border border-[#E5E5E5] rounded-lg">
              Current Plan
            </div>
          ) : (
            <PricingButton
              planId={plan.id}
              className={`w-full px-4 py-3 text-sm font-semibold transition-all rounded-lg ${
                plan.isPopular
                  ? 'bg-[#141414] text-white active:bg-black'
                  : 'bg-white text-[#141414] border border-[#141414] active:bg-[#F5F5F7]'
              }`}
            >
              {buttonText}
            </PricingButton>
          )}
        </div>
      </div>

      {/* Expandable Features */}
      {showAllFeatures && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full px-5 py-3 flex items-center justify-between border-t border-[#E5E5E5] bg-[#F5F5F7] text-sm"
          >
            <span className="text-[#525252]">View features</span>
            <svg
              className={`w-4 h-4 text-[#525252] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isExpanded && (
            <div className="border-t border-[#E5E5E5]">
              {FEATURE_GROUPS.map((group) => {
                const groupFeatures = FEATURE_ROWS.filter(f => f.group === group.id)
                const isGroupExpanded = expandedGroups.has(group.id)

                return (
                  <div key={group.id}>
                    <button
                      onClick={() => onToggleGroup(group.id)}
                      className="w-full px-5 py-3 flex items-center gap-2 text-left bg-[#F5F5F7]/50 border-b border-[#E5E5E5]/50"
                    >
                      <svg
                        className={`w-3 h-3 text-[#525252] transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="text-sm font-medium text-[#141414]">{group.label}</span>
                      <span className="text-[10px] text-[#525252]">({groupFeatures.length})</span>
                    </button>

                    {isGroupExpanded && (
                      <div className="divide-y divide-[#E5E5E5]/50">
                        {groupFeatures.map((feature) => (
                          <div key={feature.id} className="px-5 py-3 flex items-center justify-between">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="text-sm text-[#141414]">{feature.label}</div>
                              {feature.description && (
                                <div className="text-xs text-[#525252] mt-0.5">{feature.description}</div>
                              )}
                            </div>
                            <FeatureCell
                              value={feature.availability[plan.id]}
                              isPopularPlan={plan.isPopular}
                            />
                          </div>
                        ))}
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
