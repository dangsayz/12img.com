import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { validatePortalToken, getPortalData } from '@/server/actions/portal.actions'
import { PortalContract } from '@/components/portal/PortalContract'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getContractForClient(clientId: string, photographerId: string) {
  const { supabaseAdmin } = await import('@/lib/supabase/admin')
  
  const { data } = await supabaseAdmin
    .from('contracts')
    .select('*')
    .eq('client_id', clientId)
    .eq('photographer_id', photographerId)
    .in('status', ['sent', 'viewed', 'signed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return data
}

export default async function PortalContractPage({ params }: PageProps) {
  const { token } = await params
  const headersList = await headers()
  
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
  const userAgent = headersList.get('user-agent') || undefined

  // Validate token
  const context = await validatePortalToken(token, { logAccess: true, ip, userAgent })

  if (!context.isValid || !context.permissions.canViewContract) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-medium text-stone-900 mb-2">Access Denied</h1>
          <p className="text-stone-500 text-sm">
            You don't have permission to view this contract.
          </p>
        </div>
      </div>
    )
  }

  // Get portal data and contract
  const [portalResult, contract] = await Promise.all([
    getPortalData(token),
    getContractForClient(context.clientId!, context.photographerId!),
  ])

  if (!portalResult.success || !portalResult.data) {
    notFound()
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-medium text-stone-900 mb-2">No Contract Available</h1>
          <p className="text-stone-500 text-sm">
            There is no contract ready for you to view yet.
          </p>
        </div>
      </div>
    )
  }

  // Mark as viewed if currently 'sent'
  if (contract.status === 'sent') {
    const { markContractViewed } = await import('@/server/actions/contract.actions')
    await markContractViewed(contract.id, context.clientId!)
  }

  return (
    <PortalContract
      data={portalResult.data}
      contract={contract}
      token={token}
      canSign={context.permissions.canSignContract}
      clientIp={ip}
      clientUserAgent={userAgent}
    />
  )
}
