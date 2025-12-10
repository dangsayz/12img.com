'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Filter, ChevronDown } from 'lucide-react'

export function UsersFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [isPending, startTransition] = useTransition()
  
  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page') // Reset to page 1 on filter change
    startTransition(() => {
      router.push(`/admin/users?${params.toString()}`)
    })
  }
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilter('search', search || null)
  }
  
  const clearFilters = () => {
    setSearch('')
    startTransition(() => {
      router.push('/admin/users')
    })
  }
  
  const hasFilters = searchParams.toString().length > 0
  const activeFilterCount = [
    searchParams.get('search'),
    searchParams.get('plan'),
    searchParams.get('role'),
    searchParams.get('suspended'),
  ].filter(Boolean).length
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.1 }}
      className={`bg-white border border-[#E5E5E5] p-5 transition-opacity duration-200 ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex flex-wrap items-center gap-3">
        {/* Filter indicator */}
        <div className="flex items-center gap-2 pr-3 border-r border-[#E5E5E5]">
          <Filter className="w-4 h-4 text-[#737373]" />
          <span className="text-[10px] uppercase tracking-[0.15em] text-[#737373]">Filters</span>
          <AnimatePresence>
            {activeFilterCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="w-5 h-5 bg-[#141414] text-white text-[10px] flex items-center justify-center"
              >
                {activeFilterCount}
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] group-focus-within:text-[#141414] transition-colors" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email or ID..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#141414] transition-all duration-200"
            />
          </div>
        </form>
        
        {/* Plan filter */}
        <div className="relative">
          <select
            value={searchParams.get('plan') || ''}
            onChange={(e) => updateFilter('plan', e.target.value || null)}
            className="appearance-none px-4 pr-8 py-2.5 text-sm border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#141414] transition-all duration-200 cursor-pointer"
          >
            <option value="">All Plans</option>
            <option value="free">Free</option>
            <option value="starter">Starter</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
            <option value="elite">Elite</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
        </div>
        
        {/* Role filter */}
        <div className="relative">
          <select
            value={searchParams.get('role') || ''}
            onChange={(e) => updateFilter('role', e.target.value || null)}
            className="appearance-none px-4 pr-8 py-2.5 text-sm border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#141414] transition-all duration-200 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="user">User</option>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
        </div>
        
        {/* Status filter */}
        <div className="relative">
          <select
            value={searchParams.get('suspended') || ''}
            onChange={(e) => updateFilter('suspended', e.target.value || null)}
            className="appearance-none px-4 pr-8 py-2.5 text-sm border border-[#E5E5E5] bg-[#FAFAFA] focus:bg-white focus:outline-none focus:border-[#141414] transition-all duration-200 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="false">Active</option>
            <option value="true">Suspended</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
        </div>
        
        {/* Clear filters */}
        <AnimatePresence>
          {hasFilters && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2.5 text-[10px] uppercase tracking-[0.1em] text-[#525252] hover:text-white border border-[#E5E5E5] hover:border-[#141414] hover:bg-[#141414] transition-all duration-200"
            >
              <X className="w-3.5 h-3.5" />
              Clear All
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
