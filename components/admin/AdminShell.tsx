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
    className: 'border border-[#141414] bg-[#141414] text-white',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'border border-[#141414] bg-[#141414] text-white',
  },
  support: {
    label: 'Support',
    icon: Sparkles,
    className: 'border border-[#E5E5E5] bg-white text-[#141414]',
  },
}

export function AdminShell({ children, adminEmail, adminRole }: AdminShellProps) {
  const pathname = usePathname()
  const roleConfig = ROLE_CONFIG[adminRole as keyof typeof ROLE_CONFIG] || ROLE_CONFIG.support

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      {/* Header - Editorial Style */}
      <header className="sticky top-0 z-50 bg-[#F5F5F7]/95 backdrop-blur-sm border-b border-[#E5E5E5]">
        <div className="flex items-center justify-between h-[72px] px-6">
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#141414] flex items-center justify-center text-white font-bold text-xs tracking-tighter">
                12
              </div>
              <span className="font-serif text-xl font-medium tracking-tight">admin</span>
            </Link>
            
            {/* Divider */}
            <div className="hidden md:block w-px h-5 bg-[#E5E5E5]" />
            
            {/* Current section indicator */}
            <div className="hidden md:flex items-center gap-2">
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
          
          <div className="flex items-center gap-4">
            {/* Real-time indicator */}
            <RealtimeIndicator refreshInterval={30} />
            
            {/* Role badge */}
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium uppercase tracking-wider",
              roleConfig.className
            )}>
              <roleConfig.icon className="w-3.5 h-3.5" />
              {roleConfig.label}
            </div>
            
            {/* Back to app */}
            <Link 
              href="/"
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#141414] border border-[#E5E5E5] bg-white hover:bg-[#F5F5F7] transition-colors"
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
      
      <div className="flex">
        {/* Sidebar - Editorial Style */}
        <aside className="sticky top-[72px] h-[calc(100vh-72px)] w-60 bg-white border-r border-[#E5E5E5] overflow-y-auto">
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
        <main className="flex-1 p-8 min-h-[calc(100vh-72px)]">
          {children}
        </main>
      </div>
    </div>
  )
}
