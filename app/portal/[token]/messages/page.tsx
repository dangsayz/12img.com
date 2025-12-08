import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { validatePortalToken, getPortalData } from '@/server/actions/portal.actions'
import { getClientMessages, markClientMessagesRead } from '@/server/actions/message.actions'
import { PortalMessages } from '@/components/portal/PortalMessages'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PortalMessagesPage({ params }: PageProps) {
  const { token } = await params
  const headersList = await headers()
  
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
  const userAgent = headersList.get('user-agent') || undefined

  // Validate token
  const context = await validatePortalToken(token, { logAccess: true, ip, userAgent })

  if (!context.isValid || !context.permissions.canMessage) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-medium text-stone-900 mb-2">Access Denied</h1>
          <p className="text-stone-500 text-sm">
            You don't have permission to access messages.
          </p>
        </div>
      </div>
    )
  }

  // Get portal data and messages
  const [portalResult, messagesResult] = await Promise.all([
    getPortalData(token),
    getClientMessages(context.clientId!, context.photographerId!),
  ])

  if (!portalResult.success || !portalResult.data) {
    notFound()
  }

  // Mark messages as read
  await markClientMessagesRead(context.clientId!, context.photographerId!)

  return (
    <PortalMessages
      data={portalResult.data}
      messages={messagesResult.data || []}
      token={token}
    />
  )
}
