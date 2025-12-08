'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { UserButton } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Menu, 
  X, 
  Image as ImageIcon,
  Settings,
  CreditCard,
  HelpCircle,
  ChevronRight,
  Users,
  ChevronDown,
  FolderPlus,
  UserPlus
} from 'lucide-react'

export type UserRole = 'user' | 'support' | 'admin' | 'super_admin'

interface AppNavProps {
  userPlan?: string
  storageUsed?: number
  storageLimit?: number
  isAdmin?: boolean
}

const navItems = [
  { href: '/', label: 'Galleries', icon: ImageIcon },
  { href: '/profiles', label: 'Profiles', icon: Users },
  { href: '/pricing', label: 'Pricing', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function AppNav({ 
  userPlan = 'free',
  storageUsed = 0,
  storageLimit = 2 * 1024 * 1024 * 1024, // 2GB default
  isAdmin = false
}: AppNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  
  // Format storage display
  const formatStorage = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)}GB`
    }
    return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  }
  
  const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100)
  
  return (
    <>
      {/* Desktop Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3 pointer-events-none">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          
          {/* Left: Logo + Nav Links */}
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-1.5 px-2 py-1">
              <div className="w-7 h-7 rounded-full bg-stone-900 flex items-center justify-center">
                <span className="text-white font-bold text-[10px] tracking-tight">12</span>
              </div>
              <span className="text-sm font-bold text-stone-900 hidden sm:block">img</span>
            </Link>
            
            {/* Divider */}
            <div className="w-px h-5 bg-stone-200 mx-1 hidden md:block" />
            
            {/* Nav Links - Desktop */}
            <div className="hidden md:flex items-center">
              {navItems.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      px-3 py-1.5 rounded-full text-sm font-medium transition-all
                      ${isActive 
                        ? 'bg-stone-100 text-stone-900' 
                        : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                      }
                    `}
                  >
                    {item.label}
                  </Link>
                )
              })}
              
              {/* Help */}
              <Link
                href="/help"
                className="p-2 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-50 transition-all"
                title="Help"
              >
                <HelpCircle className="w-4 h-4" />
              </Link>
            </div>
          </div>
          
          {/* Right: Actions */}
          <div className="flex items-center gap-2 bg-white/95 backdrop-blur-xl border border-stone-200/60 rounded-full px-2 py-1.5 shadow-sm shadow-stone-900/5 pointer-events-auto">
            
            {/* Storage Indicator - Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-2 py-1">
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      storagePercent > 90 ? 'bg-red-500' : 
                      storagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${storagePercent}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 font-medium">
                  {formatStorage(storageUsed)}
                </span>
              </div>
            </div>
            
            {/* New Button with Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNewMenuOpen(!newMenuOpen)}
                onBlur={() => setTimeout(() => setNewMenuOpen(false), 150)}
                className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Create</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${newMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              <AnimatePresence>
                {newMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-stone-200 shadow-lg shadow-stone-900/10 overflow-hidden z-50"
                  >
                    <div className="p-1">
                      <Link
                        href="/gallery/create"
                        onClick={() => setNewMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                          <FolderPlus className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">New Gallery</p>
                          <p className="text-xs text-stone-400">Upload photos</p>
                        </div>
                      </Link>
                      
                      <Link
                        href="/dashboard/clients?new=true"
                        onClick={() => setNewMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-stone-700 hover:bg-stone-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">New Contract</p>
                          <p className="text-xs text-stone-400">Add client & send contract</p>
                        </div>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
                        
            {/* User Button - Desktop */}
            <div className="hidden md:block">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-7 h-7'
                  }
                }}
              />
            </div>
            
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-full hover:bg-stone-100 transition-colors"
            >
              {mobileOpen ? (
                <X className="w-5 h-5 text-stone-600" />
              ) : (
                <Menu className="w-5 h-5 text-stone-600" />
              )}
            </button>
          </div>
        </div>
      </nav>
      
      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="fixed top-20 left-4 right-4 z-50 md:hidden"
            >
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden">
                {/* Nav Links */}
                <div className="p-2">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href
                    const Icon = item.icon
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={`
                          flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                          ${isActive 
                            ? 'bg-stone-100 text-stone-900' 
                            : 'text-stone-600 hover:bg-stone-50'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.label}</span>
                        {isActive && <ChevronRight className="w-4 h-4 ml-auto text-stone-400" />}
                      </Link>
                    )
                  })}
                  
                  <Link
                    href="/help"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    <HelpCircle className="w-5 h-5" />
                    <span className="font-medium">Help</span>
                  </Link>
                  
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-100 transition-all"
                    >
                      <span className="text-sm">⌘</span>
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
                </div>
                
                {/* Quick Create Actions */}
                <div className="border-t border-stone-100 p-2">
                  <p className="px-4 py-2 text-xs font-medium text-stone-400 uppercase tracking-wider">Quick Create</p>
                  <Link
                    href="/gallery/create"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-blue-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <FolderPlus className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <span className="font-medium text-stone-900">New Gallery</span>
                      <p className="text-xs text-stone-400">Upload photos for clients</p>
                    </div>
                  </Link>
                  <Link
                    href="/dashboard/clients?new=true"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-emerald-50 transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <UserPlus className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <span className="font-medium text-stone-900">New Contract</span>
                      <p className="text-xs text-stone-400">Add client & send contract</p>
                    </div>
                  </Link>
                </div>
                
                {/* Storage + Account */}
                <div className="border-t border-stone-100 p-4">
                  {/* Storage Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-stone-500">Storage</span>
                    <span className="text-sm font-medium text-stone-700">
                      {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden mb-4">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        storagePercent > 90 ? 'bg-red-500' : 
                        storagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                  
                  {/* User */}
                  <div className="flex items-center gap-3">
                    <UserButton 
                      afterSignOutUrl="/"
                      appearance={{
                        elements: {
                          avatarBox: 'w-9 h-9'
                        }
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-stone-900">Account</p>
                      <p className="text-xs text-stone-400 capitalize">{userPlan} plan</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Floating Admin Indicator - Bottom Left */}
      {isAdmin && (
        <Link
          href="/admin"
          className="fixed bottom-6 left-6 z-50 group"
          title="Admin Panel"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-8 h-8 rounded-full bg-stone-900/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-black/10 border border-stone-700/50 transition-all duration-300 group-hover:bg-stone-800 group-hover:scale-105"
          >
            <span className="text-[9px] font-bold text-stone-400 group-hover:text-white transition-colors">
              ⌘
            </span>
          </motion.div>
        </Link>
      )}
    </>
  )
}
