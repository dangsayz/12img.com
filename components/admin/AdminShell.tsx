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
  Shield,
  ChevronRight,
} from 'lucide-react'

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

export function AdminShell({ children, adminEmail, adminRole }: AdminShellProps) {
  const pathname = usePathname()
  
  // Generate breadcrumbs from path
  const pathSegments = pathname.split('/').filter(Boolean)
  const breadcrumbs = pathSegments.map((segment, index) => ({
    label: segment.charAt(0).toUpperCase() + segment.slice(1),
    href: '/' + pathSegments.slice(0, index + 1).join('/'),
    isLast: index === pathSegments.length - 1,
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-4">
            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-gray-900">12img Admin</span>
            </Link>
            
            {/* Breadcrumbs */}
            <nav className="hidden md:flex items-center gap-1 text-sm">
              {breadcrumbs.map((crumb, i) => (
                <div key={crumb.href} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="w-4 h-4 text-gray-400" />}
                  {crumb.isLast ? (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  ) : (
                    <Link 
                      href={crumb.href}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </div>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Role badge */}
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              adminRole === 'super_admin' && "bg-red-100 text-red-700",
              adminRole === 'admin' && "bg-amber-100 text-amber-700",
              adminRole === 'support' && "bg-blue-100 text-blue-700",
            )}>
              {adminRole.replace('_', ' ')}
            </span>
            
            {/* Back to app */}
            <Link 
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Back to App →
            </Link>
            
            {/* User button */}
            <UserButton afterSignOutUrl="/" />
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
