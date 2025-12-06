import { redirect } from 'next/navigation'
import { getAuthenticatedAdmin } from '@/server/admin/guards'
import { AdminShell } from '@/components/admin/AdminShell'

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
  
  return (
    <AdminShell 
      adminEmail={admin.dbUser.email}
      adminRole={admin.role}
    >
      {children}
    </AdminShell>
  )
}
