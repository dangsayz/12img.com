'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion'
import {
  Bell,
  UserPlus,
  CreditCard,
  XCircle,
  TrendingUp,
  MessageCircle,
  Trophy,
  Lightbulb,
  Check,
  CheckCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'

// Simple relative time formatter
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  metadata: Record<string, unknown>
  isRead: boolean
  readAt: string | null
  createdAt: string
}

interface NotificationDropdownProps {
  notifications: Notification[]
  unreadCount: number
}

const TYPE_CONFIG: Record<string, {
  icon: typeof Bell
  color: string
  bgColor: string
  label: string
}> = {
  new_user: { icon: UserPlus, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'New signup' },
  new_subscription: { icon: CreditCard, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'Payment' },
  subscription_cancelled: { icon: XCircle, color: 'text-stone-400', bgColor: 'bg-stone-50', label: 'Cancelled' },
  subscription_upgraded: { icon: TrendingUp, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'Upgrade' },
  support_ticket: { icon: MessageCircle, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'Support' },
  contest_entry: { icon: Trophy, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'Contest' },
  feature_request: { icon: Lightbulb, color: 'text-stone-600', bgColor: 'bg-stone-100', label: 'Feature' },
}

// Elegant spring config
const springConfig = { stiffness: 400, damping: 30 }

export function NotificationDropdown({ notifications: initialNotifications, unreadCount: initialUnreadCount }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Animated badge scale
  const badgeScale = useSpring(1, springConfig)
  
  // Pulse animation when new notification arrives
  useEffect(() => {
    if (initialUnreadCount > unreadCount) {
      badgeScale.set(1.3)
      setTimeout(() => badgeScale.set(1), 150)
    }
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    // Only use mousedown - touchstart interferes with touch buttons inside the dropdown
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  const markAsRead = async (notificationId: string) => {
    setDismissing(notificationId)
    
    // Optimistic update with animation delay
    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    }, 200)
    
    try {
      await fetch('/api/admin/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      })
    } catch (error) {
      console.error('Failed to mark notification as read:', error)
    } finally {
      setTimeout(() => setDismissing(null), 300)
    }
  }

  const markAllAsRead = async () => {
    setMarkingAll(true)
    
    // Staggered optimistic update
    const unread = notifications.filter(n => !n.isRead)
    unread.forEach((_, i) => {
      setTimeout(() => {
        setNotifications(prev => {
          const updated = [...prev]
          const idx = updated.findIndex(n => n.id === unread[i].id)
          if (idx !== -1) updated[idx] = { ...updated[idx], isRead: true }
          return updated
        })
        setUnreadCount(prev => Math.max(0, prev - 1))
      }, i * 50)
    })
    
    try {
      await fetch('/api/admin/notifications/read-all', { method: 'POST' })
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    } finally {
      setTimeout(() => setMarkingAll(false), unread.length * 50 + 200)
    }
  }

  const unreadNotifications = notifications.filter(n => !n.isRead)

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button - Elegant minimal design */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        onTouchEnd={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className={cn(
          "relative p-2 md:p-2.5 transition-all duration-300 touch-manipulation",
          isOpen 
            ? "text-stone-900" 
            : "text-stone-400 hover:text-stone-900"
        )}
        title={unreadCount > 0 ? `${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="w-[18px] h-[18px]" strokeWidth={1.5} />
        
        {/* Elegant badge with spring animation */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              style={{ scale: badgeScale }}
              className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] flex items-center justify-center text-[9px] font-medium bg-stone-900 text-white rounded-full pointer-events-none"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown - Full screen on mobile, elegant panel on desktop */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setIsOpen(false)}
              onTouchEnd={(e) => {
                e.preventDefault()
                setIsOpen(false)
              }}
            />
            
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ 
                duration: 0.25, 
                ease: [0.22, 1, 0.36, 1]
              }}
              className={cn(
                "z-50 bg-white overflow-hidden",
                // Mobile: full width bottom sheet
                "fixed inset-x-0 bottom-0 rounded-t-2xl max-h-[70vh]",
                // Desktop: positioned dropdown
                "md:absolute md:right-0 md:top-full md:mt-3 md:w-[380px] md:rounded-xl md:max-h-[480px] md:inset-auto",
                "shadow-[0_0_0_1px_rgba(0,0,0,0.04),0_8px_40px_-8px_rgba(0,0,0,0.12)]"
              )}
            >
              {/* Drag handle - mobile only */}
              <div className="md:hidden flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-stone-200 rounded-full" />
              </div>
              
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-stone-900 tracking-tight">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-medium text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <motion.button
                    onClick={markAllAsRead}
                    disabled={markingAll}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-1.5 text-xs text-stone-500 hover:text-stone-900 transition-colors disabled:opacity-50"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Clear all</span>
                  </motion.button>
                )}
              </div>

              {/* Notifications List */}
              <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: 'calc(70vh - 80px)' }}>
                {unreadNotifications.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-5 py-12 text-center"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-stone-50 flex items-center justify-center">
                      <Bell className="w-5 h-5 text-stone-300" strokeWidth={1.5} />
                    </div>
                    <p className="text-sm text-stone-400 font-light">All caught up</p>
                  </motion.div>
                ) : (
                  <div className="py-2">
                    <AnimatePresence mode="popLayout">
                      {unreadNotifications.map((notification, index) => {
                        const config = TYPE_CONFIG[notification.type] || TYPE_CONFIG.new_user
                        const Icon = config.icon
                        const isDismissing = dismissing === notification.id
                        
                        return (
                          <motion.div
                            key={notification.id}
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ 
                              opacity: isDismissing ? 0 : 1, 
                              x: isDismissing ? 40 : 0,
                              height: isDismissing ? 0 : 'auto'
                            }}
                            exit={{ opacity: 0, x: 40, height: 0 }}
                            transition={{ 
                              duration: 0.3,
                              delay: index * 0.03,
                              ease: [0.22, 1, 0.36, 1]
                            }}
                            className="overflow-hidden"
                          >
                            <motion.div
                              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                              className="relative px-5 py-3.5 cursor-pointer group"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <div className="flex gap-3.5">
                                {/* Icon - minimal circle */}
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  className={cn(
                                    "flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors",
                                    config.bgColor
                                  )}
                                >
                                  <Icon className={cn("w-4 h-4", config.color)} strokeWidth={1.5} />
                                </motion.div>
                                
                                {/* Content */}
                                <div className="flex-1 min-w-0 pt-0.5">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-medium text-stone-900 leading-snug">
                                      {notification.title}
                                    </p>
                                    <span className="text-[10px] text-stone-400 whitespace-nowrap pt-0.5">
                                      {formatRelativeTime(notification.createdAt)}
                                    </span>
                                  </div>
                                  {notification.message && (
                                    <p className="text-xs text-stone-500 mt-0.5 line-clamp-2 leading-relaxed">
                                      {notification.message}
                                    </p>
                                  )}
                                  <span className="inline-block mt-1.5 text-[10px] text-stone-400 uppercase tracking-wider">
                                    {config.label}
                                  </span>
                                </div>
                                
                                {/* Dismiss indicator */}
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  whileHover={{ opacity: 1, scale: 1 }}
                                  className="flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <div className="w-6 h-6 rounded-full bg-stone-100 flex items-center justify-center">
                                    <Check className="w-3 h-3 text-stone-500" strokeWidth={2} />
                                  </div>
                                </motion.div>
                              </div>
                              
                              {/* Subtle unread indicator */}
                              <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-stone-900" />
                            </motion.div>
                          </motion.div>
                        )
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </div>

              {/* Elegant footer - tappable to dismiss */}
              <button 
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full border-t border-stone-100 px-5 py-4 bg-stone-50/50 hover:bg-stone-100 active:bg-stone-200 transition-colors cursor-pointer"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <span className="text-[11px] text-stone-500 text-center tracking-wide font-medium block">
                  Tap to dismiss
                </span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
