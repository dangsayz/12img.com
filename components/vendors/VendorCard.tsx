'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Instagram, 
  Globe, 
  Mail, 
  Phone,
  Archive
} from 'lucide-react'
import {
  Vendor,
  VENDOR_CATEGORIES,
  getVendorInitials,
  getInstagramUrl,
} from '@/lib/vendors/types'
import { VendorCategoryIcon } from './VendorCategoryIcon'

interface VendorCardProps {
  vendor: Vendor
  onEdit: (vendor: Vendor) => void
  onArchive: (vendorId: string) => void
  onDelete: (vendorId: string) => void
}

export function VendorCard({ vendor, onEdit, onArchive, onDelete }: VendorCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const category = VENDOR_CATEGORIES[vendor.category]
  const initials = getVendorInitials(vendor.business_name)
  const instagramUrl = getInstagramUrl(vendor.instagram_handle)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white border border-stone-200 rounded-xl p-5 hover:border-stone-300 hover:shadow-sm transition-all"
    >
      {/* Menu Button */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-full mt-1 w-36 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden z-10"
          >
            <button
              onClick={() => {
                onEdit(vendor)
                setMenuOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => {
                onArchive(vendor.id)
                setMenuOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-stone-700 hover:bg-stone-50 flex items-center gap-2"
            >
              <Archive className="w-3.5 h-3.5" />
              Archive
            </button>
            <button
              onClick={() => {
                onDelete(vendor.id)
                setMenuOpen(false)
              }}
              className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </motion.div>
        )}
      </div>

      {/* Avatar */}
      <div className="flex items-start gap-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-medium ${category.bgColor} ${category.color}`}
          style={vendor.color ? { backgroundColor: vendor.color + '20', color: vendor.color } : undefined}
        >
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-stone-900 truncate pr-8">
            {vendor.business_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs ${category.bgColor} ${category.color}`}>
              <VendorCategoryIcon category={vendor.category} size={12} />
              <span>{category.label}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Contact Links */}
      <div className="mt-4 flex flex-wrap gap-2">
        {vendor.instagram_handle && (
          <a
            href={instagramUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Instagram className="w-3 h-3" />
            @{vendor.instagram_handle.replace('@', '')}
          </a>
        )}
        {vendor.email && (
          <a
            href={`mailto:${vendor.email}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Mail className="w-3 h-3" />
            Email
          </a>
        )}
        {vendor.website && (
          <a
            href={vendor.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Globe className="w-3 h-3" />
            Website
          </a>
        )}
        {vendor.phone && (
          <a
            href={`tel:${vendor.phone}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            <Phone className="w-3 h-3" />
            Call
          </a>
        )}
      </div>

      {/* Notes Preview */}
      {vendor.notes && (
        <p className="mt-3 text-xs text-stone-400 line-clamp-2">
          {vendor.notes}
        </p>
      )}
    </motion.div>
  )
}
