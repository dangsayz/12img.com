'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'
import { 
  Plus,
  Image as ImageIcon,
  Settings,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  CreditCard,
  Shield
} from 'lucide-react'

interface DashboardLayoutProps {
  children: React.ReactNode
  userPlan?: string
  businessName?: string | null
  isAdmin?: boolean
}

const navItems = [
  { 
    id: 'galleries', 
    label: 'Galleries', 
    href: '/', 
    icon: ImageIcon,
    description: 'Manage your collections'
  },
    { 
    id: 'settings', 
    label: 'Settings', 
    href: '/settings', 
    icon: Settings,
    description: 'Customize your experience'
  },
]

export function DashboardLayout({ children, userPlan = 'free', businessName, isAdmin = false }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white shadow-sm border border-stone-200"
      >
        <Menu className="w-5 h-5 text-stone-600" />
      </button>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-full w-72 bg-white border-r border-stone-200 z-50
        transform transition-transform duration-300 ease-out
        lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo & Close */}
          <div className="flex items-center justify-between p-6 border-b border-stone-100">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-stone-900 flex items-center justify-center">
                <span className="text-white text-sm font-semibold">12</span>
              </div>
              <div>
                <span className="font-semibold text-stone-900">12img</span>
                {businessName && (
                  <p className="text-xs text-stone-400 truncate max-w-[140px]">{businessName}</p>
                )}
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-stone-100 transition-colors"
            >
              <X className="w-5 h-5 text-stone-400" />
            </button>
          </div>

          {/* Create Button */}
          <div className="p-4">
            <Link href="/gallery/create">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-2 h-12 bg-stone-900 hover:bg-stone-800 text-white font-medium transition-colors shadow-lg shadow-stone-900/10"
              >
                <Plus className="w-5 h-5" />
                New Gallery
              </motion.button>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-2 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon
              
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    group flex items-center gap-3 px-3 py-2.5 transition-all
                    ${isActive 
                      ? 'bg-stone-100 text-stone-900' 
                      : 'text-stone-500 hover:bg-stone-50 hover:text-stone-700'
                    }
                  `}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-stone-700' : 'text-stone-400 group-hover:text-stone-500'}`} />
                  <span className="flex-1 font-medium">{item.label}</span>
                                    {isActive && (
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Upgrade Card */}
          {userPlan === 'free' && (
            <div className="mx-4 mb-4">
              <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 p-4 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -translate-y-1/2 translate-x-1/2" />
                <Sparkles className="w-6 h-6 mb-2 text-violet-200" />
                <h4 className="font-semibold mb-1">Unlock Pro</h4>
                <p className="text-xs text-violet-200 mb-3">
                  Get unlimited galleries, custom branding & more
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 px-3 py-1.5 transition-colors"
                >
                  Upgrade
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}

          {/* Bottom Links */}
          <div className="p-4 border-t border-stone-100 space-y-1">
            {/* Pricing */}
            <Link
              href="/pricing"
              className="flex items-center gap-3 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <CreditCard className="w-5 h-5" />
              <span className="font-medium">Pricing</span>
            </Link>
            
            {/* Help */}
            <Link
              href="/help"
              className="flex items-center gap-3 px-3 py-2 text-stone-500 hover:text-stone-700 hover:bg-stone-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span className="font-medium">Help & Support</span>
            </Link>
            
            {/* Admin Link - Only for admins */}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-3 px-3 py-2 text-violet-600 hover:text-violet-700 hover:bg-violet-50 transition-colors"
              >
                <Shield className="w-5 h-5" />
                <span className="font-medium">Admin</span>
              </Link>
            )}
          </div>
          
          {/* User Account - Clerk */}
          <div className="p-4 border-t border-stone-100">
            <div className="flex items-center gap-3 px-3 py-2">
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: 'w-8 h-8',
                  }
                }}
              />
              <span className="text-sm text-stone-600 font-medium">Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-72">
        <div className="min-h-screen">
          {children}
        </div>
      </main>
    </div>
  )
}
