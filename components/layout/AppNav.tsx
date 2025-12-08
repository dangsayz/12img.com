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
  Shield,
  ChevronRight,
  Users,
  UserCircle,
  FileSignature
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
            
            {/* Divider */}
            <div className="w-px h-5 bg-stone-200 hidden lg:block" />
            
            {/* Clients Link */}
            <Link 
              href="/dashboard/clients"
              className={`
                p-2 rounded-full transition-colors
                ${pathname.startsWith('/dashboard/clients')
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }
              `}
              title="Clients"
            >
              <UserCircle className="w-4 h-4" />
            </Link>
            
            {/* Contracts/Portal Link */}
            <Link 
              href="/dashboard/clients"
              className={`
                p-2 rounded-full transition-colors
                ${pathname.includes('/contracts') || pathname.includes('/portal')
                  ? 'bg-stone-100 text-stone-900'
                  : 'text-stone-500 hover:text-stone-900 hover:bg-stone-50'
                }
              `}
              title="Contracts & Portal"
            >
              <FileSignature className="w-4 h-4" />
            </Link>
            
            {/* New Gallery Button */}
            <Link 
              href="/gallery/create"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-sm font-medium rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </Link>
            
            {/* Admin Link */}
            {isAdmin && (
              <Link
                href="/admin"
                className="p-2 rounded-full text-amber-600 hover:bg-amber-50 transition-all hidden md:flex"
                title="Admin"
              >
                <Shield className="w-4 h-4" />
              </Link>
            )}
            
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
                  
                  {/* Clients */}
                  <Link
                    href="/dashboard/clients"
                    onClick={() => setMobileOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                      ${pathname.startsWith('/dashboard/clients')
                        ? 'bg-stone-100 text-stone-900' 
                        : 'text-stone-600 hover:bg-stone-50'
                      }
                    `}
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">Clients</span>
                    {pathname.startsWith('/dashboard/clients') && <ChevronRight className="w-4 h-4 ml-auto text-stone-400" />}
                  </Link>
                  
                  {/* Contracts & Portal */}
                  <Link
                    href="/dashboard/clients"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-stone-600 hover:bg-stone-50 transition-all"
                  >
                    <FileSignature className="w-5 h-5" />
                    <span className="font-medium">Contracts & Portal</span>
                  </Link>
                  
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
                      className="flex items-center gap-3 px-4 py-3 rounded-xl text-amber-600 hover:bg-amber-50 transition-all"
                    >
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Admin</span>
                    </Link>
                  )}
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
    </>
  )
}
