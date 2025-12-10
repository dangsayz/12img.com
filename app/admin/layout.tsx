import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/server/admin/guards'
import { AdminShell } from '@/components/admin/AdminShell'
import { getUnreadNotificationCount, getAdminNotifications } from '@/server/admin/notifications'

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

  // Get notifications for dropdown
  const [unreadNotifications, notifications] = await Promise.all([
    getUnreadNotificationCount(),
    getAdminNotifications(20),
  ])
  
  return (
    <AdminShell 
      adminEmail={admin.dbUser.email}
      adminRole={admin.role}
      unreadNotifications={unreadNotifications}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  )
}
