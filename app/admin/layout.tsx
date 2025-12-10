import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/server/admin/guards'
import { AdminShell } from '@/components/admin/AdminShell'
import { getUnreadNotificationCount } from '@/server/admin/notifications'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await getAuthenticatedAdmin()
  
  if (!admin) {
    redirect('/')
  }

  // Get unread notification count for badge
  const unreadNotifications = await getUnreadNotificationCount()
  
  return (
    <AdminShell 
      adminEmail={admin.dbUser.email}
      adminRole={admin.role}
      unreadNotifications={unreadNotifications}
    >
      {children}
    </AdminShell>
  )
}
