'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Search, Filter, ArrowRight, Image as ImageIcon } from 'lucide-react'
import { VendorCard } from './VendorCard'
import { AddVendorModal } from './AddVendorModal'
import {
  Vendor,
  VendorCategory,
  CreateVendorInput,
  UpdateVendorInput,
  VendorLimitsWithUsage,
  VENDOR_CATEGORY_OPTIONS,
} from '@/lib/vendors/types'
import {
  getVendors,
  createVendor,
  updateVendor,
  archiveVendor,
  deleteVendor,
  getVendorLimits,
} from '@/server/actions/vendor.actions'

interface VendorSectionProps {
  initialVendors?: Vendor[]
  initialLimits?: VendorLimitsWithUsage
}

export function VendorSection({ initialVendors, initialLimits }: VendorSectionProps) {
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors || [])
  const [limits, setLimits] = useState<VendorLimitsWithUsage | null>(initialLimits || null)
  const [loading, setLoading] = useState(!initialVendors)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<VendorCategory | 'all'>('all')

  useEffect(() => {
    if (!initialVendors) {
      loadVendors()
    }
    if (!initialLimits) {
      loadLimits()
    }
  }, [initialVendors, initialLimits])

  const loadVendors = async () => {
    try {
      const data = await getVendors()
      setVendors(data)
    } catch (error) {
      console.error('Failed to load vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLimits = async () => {
    try {
      const data = await getVendorLimits()
      setLimits(data)
    } catch (error) {
      console.error('Failed to load limits:', error)
    }
  }

  const handleSave = async (data: CreateVendorInput | UpdateVendorInput) => {
    if (editingVendor) {
      const updated = await updateVendor(editingVendor.id, data as UpdateVendorInput)
      setVendors(vendors.map(v => v.id === updated.id ? updated : v))
    } else {
      const created = await createVendor(data as CreateVendorInput)
      setVendors([...vendors, created])
    }
    setEditingVendor(null)
    loadLimits()
  }

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setModalOpen(true)
  }

  const handleArchive = async (vendorId: string) => {
    if (!confirm('Archive this vendor? They will be hidden from your list.')) return
    await archiveVendor(vendorId)
    setVendors(vendors.filter(v => v.id !== vendorId))
    loadLimits()
  }

  const handleDelete = async (vendorId: string) => {
    if (!confirm('Delete this vendor permanently? This cannot be undone.')) return
    await deleteVendor(vendorId)
    setVendors(vendors.filter(v => v.id !== vendorId))
    loadLimits()
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingVendor(null)
  }

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesSearch = vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.instagram_handle?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || vendor.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Limit info
  const limitReached = limits && !limits.canAddVendor
  const limitText = limits?.limits.maxVendors === 'unlimited' 
    ? 'Unlimited vendors' 
    : `${limits?.usage.vendorCount || 0}/${limits?.limits.maxVendors || 0} vendors`

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xs uppercase tracking-[0.2em] text-stone-400">Vendor Network</h2>
          {limits && (
            <p className="text-xs text-stone-400 mt-1">{limitText}</p>
          )}
        </div>
        <button
          onClick={() => setModalOpen(true)}
          disabled={limitReached || false}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vendor
        </button>
      </div>

      {/* Search & Filter */}
      {vendors.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search vendors..."
              className="w-full pl-10 pr-4 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as VendorCategory | 'all')}
              className="pl-10 pr-8 py-2.5 border border-stone-200 rounded-lg text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent bg-white appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              {VENDOR_CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="bg-stone-50 border border-stone-100 rounded-xl p-12 text-center">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-stone-900 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-400 mt-4">Loading vendors...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && vendors.length === 0 && (
        <div className="bg-stone-50 border border-stone-100 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-stone-400" />
          </div>
          <h3 className="text-lg font-medium text-stone-900 mb-2">
            Build Your Vendor Network
          </h3>
          <p className="text-sm text-stone-500 max-w-sm mx-auto mb-6">
            Add florists, planners, venues, and other vendors you work with. 
            Share galleries with them to grow your referrals.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            disabled={limitReached || false}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Your First Vendor
          </button>
        </div>
      )}

      {/* Next Steps Hint - Show when vendors exist */}
      {!loading && vendors.length > 0 && vendors.length <= 3 && (
        <div className="mb-6 p-4 bg-stone-50 border border-stone-100 rounded-xl">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-stone-900 flex items-center justify-center shrink-0">
              <ImageIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-stone-900 mb-1">Next: Share a gallery</p>
              <p className="text-xs text-stone-500 leading-relaxed">
                Go to <span className="font-medium">Galleries</span>, open any gallery, and click the <span className="font-medium">Share with Vendors</span> button to give them access.
              </p>
            </div>
            <a 
              href="/dashboard"
              className="shrink-0 flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white text-xs font-medium rounded-lg hover:bg-stone-800 transition-colors"
            >
              Go to Galleries
              <ArrowRight className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Vendor Grid */}
      {!loading && filteredVendors.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredVendors.map((vendor) => (
              <VendorCard
                key={vendor.id}
                vendor={vendor}
                onEdit={handleEdit}
                onArchive={handleArchive}
                onDelete={handleDelete}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* No Results */}
      {!loading && vendors.length > 0 && filteredVendors.length === 0 && (
        <div className="bg-stone-50 border border-stone-100 rounded-xl p-8 text-center">
          <p className="text-sm text-stone-500">
            No vendors match your search.
          </p>
        </div>
      )}

      {/* Limit Warning */}
      {limitReached && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-800">
            You&apos;ve reached your vendor limit. 
            <a href="/pricing" className="font-medium underline ml-1">Upgrade your plan</a> to add more vendors.
          </p>
        </div>
      )}

      {/* Modal */}
      <AddVendorModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        vendor={editingVendor}
      />
    </section>
  )
}
