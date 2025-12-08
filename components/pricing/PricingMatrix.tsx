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

      {/* Matrix Table - Editorial Style */}
      <div className="w-full overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
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
                        <div className="w-full px-4 py-2.5 text-sm font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 cursor-default">
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

      {/* Mobile hint */}
      <div className="mt-8 text-center md:hidden">
        <p className="text-xs text-[#525252] tracking-wide">
          Swipe to compare →
        </p>
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
