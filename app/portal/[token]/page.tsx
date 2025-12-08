import { redirect, notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { validatePortalToken, getPortalData } from '@/server/actions/portal.actions'
import { PortalHome } from '@/components/portal/PortalHome'

interface PageProps {
  params: Promise<{ token: string }>
}

export default async function PortalPage({ params }: PageProps) {
  const { token } = await params
  const headersList = await headers()
  
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || undefined
  const userAgent = headersList.get('user-agent') || undefined

  // Validate token
  const context = await validatePortalToken(token, { logAccess: true, ip, userAgent })

  if (!context.isValid) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-stone-900 mb-2">Link Expired or Invalid</h1>
          <p className="text-stone-500 text-sm">
            {context.errorMessage || 'This portal link is no longer valid. Please contact your photographer for a new link.'}
          </p>
        </div>
      </div>
    )
  }

  // Get portal data
  const result = await getPortalData(token)

  if (!result.success || !result.data) {
    notFound()
  }

  return <PortalHome data={result.data} token={token} />
}
