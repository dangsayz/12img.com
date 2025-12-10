'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Flag,
  ToggleLeft,
  ToggleRight,
  Plus,
  Pencil,
  Trash2,
  X,
  Loader2,
  Users,
  Percent,
  Calendar,
  CreditCard,
  Zap,
  AlertTriangle,
  Check,
  ChevronDown,
} from 'lucide-react'
import type { FeatureFlag, FlagType, FlagCategory } from '@/server/admin/flags'

interface Props {
  flags: FeatureFlag[]
  stats: {
    total: number
    enabled: number
    disabled: number
    byCategory: Record<string, number>
    byType: Record<string, number>
  }
}

const FLAG_TYPE_CONFIG: Record<FlagType, { icon: React.ElementType; label: string; color: string }> = {
  boolean: { icon: ToggleLeft, label: 'Boolean', color: 'text-[#525252]' },
  percentage: { icon: Percent, label: 'Percentage', color: 'text-[#525252]' },
  plan_based: { icon: CreditCard, label: 'Plan Based', color: 'text-[#525252]' },
  user_list: { icon: Users, label: 'User List', color: 'text-[#525252]' },
  date_range: { icon: Calendar, label: 'Date Range', color: 'text-[#525252]' },
}

const CATEGORY_CONFIG: Record<FlagCategory, { label: string; description: string }> = {
  general: { label: 'General', description: 'Core platform features' },
  ui: { label: 'UI', description: 'User interface features' },
  billing: { label: 'Billing', description: 'Payment and subscription features' },
  experimental: { label: 'Experimental', description: 'Features in testing' },
}

function StatCard({ title, value, subtitle }: { title: string; value: number; subtitle?: string }) {
  return (
    <div className="bg-white border border-[#E5E5E5] p-4 hover:border-[#141414] transition-colors">
      <p className="text-xs text-[#525252] uppercase tracking-wider">{title}</p>
      <p className="text-2xl font-serif text-[#141414] mt-1">{value}</p>
      {subtitle && <p className="text-xs text-[#737373] mt-1">{subtitle}</p>}
    </div>
  )
}

export function FlagsContent({ flags, stats }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null)
  const [togglingFlags, setTogglingFlags] = useState<Set<string>>(new Set())
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['general', 'ui', 'billing', 'experimental'])
  )
  
  // Group flags by category
  const flagsByCategory = flags.reduce((acc, flag) => {
    const category = flag.category as FlagCategory
    if (!acc[category]) acc[category] = []
    acc[category].push(flag)
    return acc
  }, {} as Record<FlagCategory, FeatureFlag[]>)
  
  const toggleFlag = async (flag: FeatureFlag) => {
    setTogglingFlags(prev => new Set(prev).add(flag.id))
    
    try {
      const response = await fetch('/api/admin/flags/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flagKey: flag.key,
          enabled: !flag.isEnabled,
        }),
      })
      
      if (response.ok) {
        startTransition(() => {
          router.refresh()
        })
      }
    } catch (error) {
      console.error('Toggle error:', error)
    } finally {
      setTogglingFlags(prev => {
        const next = new Set(prev)
        next.delete(flag.id)
        return next
      })
    }
  }
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }
  
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard title="Total Flags" value={stats.total} />
        <StatCard title="Enabled" value={stats.enabled} />
        <StatCard title="Disabled" value={stats.disabled} />
        <StatCard 
          title="Experimental" 
          value={stats.byCategory.experimental || 0} 
          subtitle="In testing"
        />
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#525252]">
          {flags.length} feature flags configured
        </p>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Flag
        </button>
      </div>
      
      {/* Flags by Category */}
      <div className="space-y-4">
        {(Object.keys(CATEGORY_CONFIG) as FlagCategory[]).map((category) => {
          const categoryFlags = flagsByCategory[category] || []
          const config = CATEGORY_CONFIG[category]
          const isExpanded = expandedCategories.has(category)
          
          return (
            <div key={category} className="bg-white border border-[#E5E5E5]">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-[#141414]">{config.label}</h3>
                  <span className="px-2 py-0.5 text-xs bg-[#F5F5F7] text-[#525252]">
                    {categoryFlags.length}
                  </span>
                  <span className="text-xs text-[#737373] hidden sm:inline">
                    {config.description}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-[#525252] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Flags List */}
              <AnimatePresence>
                {isExpanded && categoryFlags.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                      {categoryFlags.map((flag) => {
                        const typeConfig = FLAG_TYPE_CONFIG[flag.flagType]
                        const TypeIcon = typeConfig.icon
                        const isToggling = togglingFlags.has(flag.id)
                        
                        return (
                          <div
                            key={flag.id}
                            className={`px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors ${
                              flag.isKillswitch ? 'bg-red-50/30' : ''
                            }`}
                          >
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                              {/* Toggle */}
                              <button
                                onClick={() => toggleFlag(flag)}
                                disabled={isToggling}
                                className="flex-shrink-0"
                              >
                                {isToggling ? (
                                  <Loader2 className="w-6 h-6 animate-spin text-[#525252]" />
                                ) : flag.isEnabled ? (
                                  <ToggleRight className="w-6 h-6 text-emerald-600" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-[#A3A3A3]" />
                                )}
                              </button>
                              
                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-[#141414] truncate">
                                    {flag.name}
                                  </p>
                                  {flag.isKillswitch && (
                                    <span className="px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-red-100 text-red-700">
                                      Killswitch
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <code className="text-xs text-[#737373] bg-[#F5F5F7] px-1.5 py-0.5">
                                    {flag.key}
                                  </code>
                                  <span className="text-xs text-[#A3A3A3]">·</span>
                                  <span className="inline-flex items-center gap-1 text-xs text-[#737373]">
                                    <TypeIcon className="w-3 h-3" />
                                    {typeConfig.label}
                                  </span>
                                  {flag.flagType === 'percentage' && (
                                    <>
                                      <span className="text-xs text-[#A3A3A3]">·</span>
                                      <span className="text-xs text-[#737373]">
                                        {flag.rolloutPercentage}%
                                      </span>
                                    </>
                                  )}
                                  {flag.flagType === 'plan_based' && flag.targetPlans.length > 0 && (
                                    <>
                                      <span className="text-xs text-[#A3A3A3]">·</span>
                                      <span className="text-xs text-[#737373]">
                                        {flag.targetPlans.join(', ')}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex items-center gap-1 ml-4">
                              <button
                                onClick={() => setEditingFlag(flag)}
                                className="p-2 hover:bg-[#E5E5E5] transition-colors"
                                title="Edit flag"
                              >
                                <Pencil className="w-4 h-4 text-[#525252]" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Empty State */}
              {isExpanded && categoryFlags.length === 0 && (
                <div className="px-4 py-8 text-center border-t border-[#E5E5E5]">
                  <p className="text-sm text-[#737373]">No flags in this category</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateFlagModal onClose={() => setShowCreateModal(false)} />
        )}
      </AnimatePresence>
      
      {/* Edit Modal */}
      <AnimatePresence>
        {editingFlag && (
          <EditFlagModal flag={editingFlag} onClose={() => setEditingFlag(null)} />
        )}
      </AnimatePresence>
      
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
        </div>
      )}
    </div>
  )
}

// Create Flag Modal
function CreateFlagModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    key: '',
    name: '',
    description: '',
    flagType: 'boolean' as FlagType,
    category: 'general' as FlagCategory,
    rolloutPercentage: 0,
    targetPlans: [] as string[],
    isKillswitch: false,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Create error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#141414]">Create Feature Flag</h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] transition-colors">
            <X className="w-5 h-5 text-[#525252]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">Key</label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_') })}
              placeholder="my_feature_flag"
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
              required
            />
            <p className="text-xs text-[#737373] mt-1">Lowercase with underscores only</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Feature Flag"
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What does this flag control?"
              rows={2}
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">Type</label>
              <select
                value={formData.flagType}
                onChange={(e) => setFormData({ ...formData, flagType: e.target.value as FlagType })}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
              >
                <option value="boolean">Boolean (On/Off)</option>
                <option value="percentage">Percentage Rollout</option>
                <option value="plan_based">Plan Based</option>
                <option value="user_list">User List</option>
                <option value="date_range">Date Range</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FlagCategory })}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
              >
                <option value="general">General</option>
                <option value="ui">UI</option>
                <option value="billing">Billing</option>
                <option value="experimental">Experimental</option>
              </select>
            </div>
          </div>
          
          {formData.flagType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">
                Rollout Percentage: {formData.rolloutPercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          
          {formData.flagType === 'plan_based' && (
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">Target Plans</label>
              <div className="flex flex-wrap gap-2">
                {['free', 'essential', 'pro', 'studio', 'elite'].map((plan) => (
                  <label key={plan} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.targetPlans.includes(plan)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetPlans: [...formData.targetPlans, plan] })
                        } else {
                          setFormData({ ...formData, targetPlans: formData.targetPlans.filter(p => p !== plan) })
                        }
                      }}
                      className="rounded border-[#E5E5E5]"
                    />
                    <span className="text-sm capitalize">{plan}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isKillswitch}
                onChange={(e) => setFormData({ ...formData, isKillswitch: e.target.checked })}
                className="rounded border-[#E5E5E5]"
              />
              <span className="text-sm text-[#141414]">Mark as killswitch</span>
            </label>
            <p className="text-xs text-[#737373] mt-1 ml-6">
              Killswitches are highlighted for quick access during emergencies
            </p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.key || !formData.name}
              className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Create Flag'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Edit Flag Modal (simplified version)
function EditFlagModal({ flag, onClose }: { flag: FeatureFlag; onClose: () => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [formData, setFormData] = useState({
    name: flag.name,
    description: flag.description || '',
    flagType: flag.flagType,
    category: flag.category,
    rolloutPercentage: flag.rolloutPercentage,
    targetPlans: flag.targetPlans,
    isKillswitch: flag.isKillswitch,
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/admin/flags/${flag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Update error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this flag?')) return
    
    setIsDeleting(true)
    
    try {
      const response = await fetch(`/api/admin/flags/${flag.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-[#141414]">Edit Flag</h2>
            <code className="text-xs text-[#737373] bg-[#F5F5F7] px-1.5 py-0.5 mt-1 inline-block">
              {flag.key}
            </code>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] transition-colors">
            <X className="w-5 h-5 text-[#525252]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] resize-none"
            />
          </div>
          
          {formData.flagType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">
                Rollout Percentage: {formData.rolloutPercentage}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={formData.rolloutPercentage}
                onChange={(e) => setFormData({ ...formData, rolloutPercentage: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>
          )}
          
          {formData.flagType === 'plan_based' && (
            <div>
              <label className="block text-sm font-medium text-[#141414] mb-1">Target Plans</label>
              <div className="flex flex-wrap gap-2">
                {['free', 'essential', 'pro', 'studio', 'elite'].map((plan) => (
                  <label key={plan} className="inline-flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.targetPlans.includes(plan)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData({ ...formData, targetPlans: [...formData.targetPlans, plan] })
                        } else {
                          setFormData({ ...formData, targetPlans: formData.targetPlans.filter(p => p !== plan) })
                        }
                      }}
                      className="rounded border-[#E5E5E5]"
                    />
                    <span className="text-sm capitalize">{plan}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Flag'}
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
