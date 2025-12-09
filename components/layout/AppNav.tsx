'use client'

import { useState, useEffect } from 'react'
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
  UserPlus,
  LayoutDashboard
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
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch with Clerk components
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Format storage display
  const formatStorage = (bytes: number) => {
    if (bytes >= 1024 * 1024 * 1024) {
      const gb = bytes / (1024 * 1024 * 1024)
      return gb >= 10 ? `${Math.round(gb)}GB` : `${gb.toFixed(1)}GB`
    }
    const mb = bytes / (1024 * 1024)
    if (mb < 1) return '<1MB'
    return `${Math.round(mb)}MB`
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
            
            {/* Plan Badge + Storage Indicator - Desktop */}
            <div className="hidden lg:flex items-center gap-2 px-2 py-1">
              {/* Plan Badge - All users */}
              {userPlan === 'free' ? (
                <Link
                  href="/pricing"
                  className="flex items-center gap-1 px-2 py-0.5 bg-stone-100 hover:bg-stone-200 rounded-full transition-colors group"
                >
                  <span className="text-[10px] font-medium text-stone-500 uppercase tracking-wide">Free</span>
                  <span className="text-[10px] text-stone-400 group-hover:text-stone-600">→</span>
                </Link>
              ) : (
                <span className="px-2 py-0.5 bg-stone-100 rounded-full text-[10px] font-medium text-stone-600 uppercase tracking-wide">
                  {userPlan}
                </span>
              )}
              
              {/* Storage Bar */}
              <div className="flex items-center gap-1.5">
                <div className="w-16 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      storagePercent > 90 ? 'bg-red-500' : 
                      storagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.max(storagePercent, 1)}%` }}
                  />
                </div>
                <span className="text-xs text-stone-400 font-medium whitespace-nowrap">
                  {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
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
                      
                      {/* Divider */}
                      <div className="my-1 mx-2 border-t border-stone-100" />
                      
                      {/* Dashboard Link */}
                      <Link
                        href="/dashboard/clients"
                        onClick={() => setNewMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-stone-500 hover:bg-stone-50 hover:text-stone-700 transition-colors"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        <span className="text-sm">Dashboard</span>
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
                        
            {/* User Button - Desktop */}
            <div className="hidden md:block">
              {mounted ? (
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: 'w-7 h-7'
                    }
                  }}
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-stone-200 animate-pulse" />
              )}
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
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xl overflow-hidden max-h-[calc(100vh-6rem)] overflow-y-auto">
                {/* Account - At top so dropdown has room */}
                <div className="p-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {mounted ? (
                      <UserButton 
                        afterSignOutUrl="/"
                        appearance={{
                          elements: {
                            avatarBox: 'w-10 h-10',
                            userButtonPopoverCard: 'left-0 right-auto',
                          }
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-stone-200 animate-pulse" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium text-stone-900">Account</p>
                      <p className="text-xs text-stone-400 capitalize">{userPlan} Plan</p>
                    </div>
                  </div>
                </div>
                
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
                  
                  {/* Divider */}
                  <div className="my-2 mx-4 border-t border-stone-100" />
                  
                  {/* Dashboard Link */}
                  <Link
                    href="/dashboard/clients"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-500 hover:bg-stone-50 transition-all"
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </div>
                
                {/* Storage */}
                <div className="border-t border-stone-100 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-stone-500">Storage</span>
                    <span className="text-sm font-medium text-stone-700">
                      {formatStorage(storageUsed)} / {formatStorage(storageLimit)}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        storagePercent > 90 ? 'bg-red-500' : 
                        storagePercent > 70 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${storagePercent}%` }}
                    />
                  </div>
                  
                  {/* Free Plan Upgrade Banner */}
                  {userPlan === 'free' && (
                    <Link
                      href="/pricing"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-4 py-3 mt-4 bg-stone-100 rounded-xl hover:bg-stone-200 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-medium text-stone-900">Free Plan</p>
                        <p className="text-xs text-stone-500">Upgrade for more storage & features</p>
                      </div>
                      <span className="text-stone-400">→</span>
                    </Link>
                  )}
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
