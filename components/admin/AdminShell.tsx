'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { UserButton } from '@clerk/nextjs'
import {
  LayoutDashboard,
  Users,
  Image,
  HardDrive,
  CreditCard,
  Mail,
  ScrollText,
  Settings,
  Flag,
  Sparkles,
  Crown,
  Shield,
  ChevronRight,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { RealtimeIndicator } from './RealtimeIndicator'

interface AdminShellProps {
  children: React.ReactNode
  adminEmail: string
  adminRole: string
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
    title: 'Audit Logs',
    href: '/admin/logs',
    icon: ScrollText,
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
    className: 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-lg shadow-violet-500/25',
  },
  support: {
    label: 'Support',
    icon: Sparkles,
    className: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/25',
  },
}

export function AdminShell({ children, adminEmail, adminRole }: AdminShellProps) {
  const pathname = usePathname()
  const roleConfig = ROLE_CONFIG[adminRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.support

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#18181B] text-white">
        <div className="flex items-center justify-between h-14 px-5">
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-3">
              {/* Custom Admin Icon */}
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-900 flex items-center justify-center shadow-lg shadow-black/20 border border-zinc-600/50">
                  <span className="text-white font-black text-sm tracking-tighter">12</span>
                </div>
                {/* Admin indicator dot */}
                <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-[#18181B] shadow-sm" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-white text-sm leading-tight">Admin</span>
                <span className="text-zinc-500 text-[10px] font-medium tracking-wide uppercase">Console</span>
              </div>
            </Link>
            
            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-zinc-700" />
            
            {/* Current section indicator */}
            <div className="hidden md:flex items-center gap-2">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && pathname.startsWith(item.href))
                if (!isActive) return null
                return (
                  <div key={item.href} className="flex items-center gap-2 text-sm">
                    <item.icon className="w-4 h-4 text-zinc-400" />
                    <span className="text-zinc-300">{item.title}</span>
                  </div>
                )
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Real-time indicator */}
            <RealtimeIndicator refreshInterval={30} />
            
            {/* Role badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full",
              roleConfig.className
            )}>
              <roleConfig.icon className="w-3.5 h-3.5" />
              {roleConfig.label}
            </div>
            
            {/* Back to app */}
            <Link 
              href="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Admin</span>
            </Link>
            
            {/* User button */}
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8 ring-2 ring-zinc-700"
                }
              }}
            />
          </div>
        </div>
      </header>
      
      <div className="flex">
        {/* Sidebar */}
        <aside className="sticky top-14 h-[calc(100vh-3.5rem)] w-56 bg-white border-r border-gray-200 overflow-y-auto">
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/admin' && pathname.startsWith(item.href))
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                    isActive 
                      ? "bg-gray-100 text-gray-900" 
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  {item.title}
                </Link>
              )
            })}
          </nav>
          
          {/* Admin info */}
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100 bg-gray-50">
            <p className="text-xs text-gray-500 truncate">{adminEmail}</p>
          </div>
        </aside>
        
        {/* Main content */}
        <main className="flex-1 p-6 min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
