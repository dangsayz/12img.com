'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { UserButton } from '@clerk/nextjs'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Image,
  HardDrive,
  CreditCard,
  Mail,
  Settings,
  Flag,
  HeadphonesIcon,
  Crown,
  Shield,
  ExternalLink,
  MessageCircle,
  Menu,
  X,
  Trophy,
  Lightbulb,
  Bell,
  Tag,
} from 'lucide-react'
import { RealtimeIndicator } from './RealtimeIndicator'

interface AdminShellProps {
  children: React.ReactNode
  adminEmail: string
  adminRole: string
  unreadNotifications?: number
}

const NAV_ITEMS = [
  {
    title: 'Overview',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    title: 'Users',
    href: '/admin/users',
    icon: Users,
  },
  {
    title: 'Galleries',
    href: '/admin/galleries',
    icon: Image,
  },
  {
    title: 'Storage',
    href: '/admin/storage',
    icon: HardDrive,
  },
  {
    title: 'Billing',
    href: '/admin/billing',
    icon: CreditCard,
  },
  {
    title: 'Emails',
    href: '/admin/emails',
    icon: Mail,
  },
  {
    title: 'Support',
    href: '/admin/support',
    icon: MessageCircle,
  },
  {
    title: 'Contests',
    href: '/admin/contests',
    icon: Trophy,
  },
  {
    title: 'Feature Requests',
    href: '/admin/feature-requests',
    icon: Lightbulb,
  },
  {
    title: 'Promos',
    href: '/admin/promos',
    icon: Tag,
  },
  {
    title: 'Feature Flags',
    href: '/admin/flags',
    icon: Flag,
  },
  {
    title: 'Settings',
    href: '/admin/settings',
    icon: Settings,
  },
]

const ROLE_CONFIG = {
  super_admin: {
    label: 'Super Admin',
    icon: Crown,
    className: 'border border-[#141414] bg-[#141414] text-white',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'border border-[#141414] bg-[#141414] text-white',
  },
  support: {
    label: 'Support',
    icon: HeadphonesIcon,
    className: 'border border-[#E5E5E5] bg-white text-[#141414]',
  },
}

export function AdminShell({ children, adminEmail, adminRole, unreadNotifications = 0 }: AdminShellProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const roleConfig = ROLE_CONFIG[adminRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.support

  // Close mobile menu when route changes
  const handleNavClick = () => {
    setMobileMenuOpen(false)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header - Editorial Style */}
      <header className="sticky top-0 z-50 bg-[#F5F5F7]/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between h-14 md:h-[72px] px-4 md:px-6">
          <div className="flex items-center gap-4 md:gap-8">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-2 text-[#525252] hover:text-[#141414] hover:bg-[#E5E5E5] rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-7 h-7 md:w-8 md:h-8 bg-[#141414] flex items-center justify-center text-white font-bold text-[10px] md:text-xs tracking-tighter">
                12
              </div>
              <span className="font-serif text-lg md:text-xl font-medium tracking-tight">admin</span>
            </Link>
            
            {/* Divider */}
            <div className="hidden lg:block w-px h-5 bg-[#E5E5E5]" />
            
            {/* Current section indicator */}
            <div className="hidden lg:flex items-center gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                if (!isActive) return null
                return (
                  <div key={item.href} className="flex items-center gap-2 text-sm">
                    <item.icon className="w-4 h-4 text-[#525252]" />
                    <span className="text-[#141414] font-medium">{item.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {/* Notifications bell */}
            <Link
              href="/admin/users"
              className="relative p-1.5 text-[#525252] hover:text-[#141414] border border-[#E5E5E5] hover:border-[#141414] transition-colors"
              title="New signups"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold bg-red-500 text-white rounded-full">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>

            {/* Manual refresh */}
            <div className="hidden sm:block">
              <RealtimeIndicator />
            </div>
            
            {/* Role badge - compact on mobile */}
            <div className={cn(
              "hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider",
              roleConfig.className
            )}>
              <roleConfig.icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{roleConfig.label}</span>
            </div>
            
            {/* Back to app */}
            <Link 
              href="/"
              className="flex items-center gap-1.5 px-3 md:px-4 py-2 text-sm font-medium text-[#141414] border border-[#E5E5E5] bg-white hover:bg-[#F5F5F7] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </Link>
            
            {/* User button */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-[#E5E5E5]"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            />
            
            {/* Slide-out menu */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-14 left-0 bottom-0 w-64 bg-white border-r border-[#E5E5E5] z-50 lg:hidden overflow-y-auto"
            >
              <nav className="p-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href || 
                    (item.href !== '/admin' && pathname.startsWith(item.href))
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 text-sm transition-colors rounded-lg",
                        isActive 
                          ? "bg-[#141414] text-white font-medium" 
                          : "text-[#525252] hover:bg-[#F5F5F7] hover:text-[#141414]"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.title}
                    </Link>
                  )
                })}
              </nav>
              
              {/* Admin info */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E5E5E5] bg-[#F5F5F7]">
                <p className="text-xs text-[#525252] truncate">{adminEmail}</p>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      <div className="flex">
        {/* Sidebar - Desktop only */}
        <aside className="hidden lg:block sticky top-[72px] h-[calc(100vh-72px)] w-60 bg-white border-r border-[#E5E5E5] overflow-y-auto">
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    isActive 
                      ? "bg-[#141414] text-white font-medium" 
                      : "text-[#525252] hover:bg-[#F5F5F7] hover:text-[#141414]"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
          
          {/* Admin info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#E5E5E5] bg-[#F5F5F7]">
            <p className="text-xs text-[#525252] truncate">{adminEmail}</p>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-h-[calc(100vh-56px)] lg:min-h-[calc(100vh-72px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
