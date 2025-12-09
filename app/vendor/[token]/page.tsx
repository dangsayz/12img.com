import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVendorPortalData } from '@/server/actions/vendor.actions'
import { VendorPortalClient } from './VendorPortalClient'

interface PageProps {
  params: Promise<{ token: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params
  const data = await getVendorPortalData(token)
  
  if (!data) {
    return {
      title: 'Gallery Not Found | 12img',
    }
  }

  return {
    title: `${data.gallery.title} | Vendor Access | 12img`,
    description: `View and download photos from ${data.gallery.title}`,
    robots: {
      index: false,
      follow: false,
    },
  }
}

export default async function VendorPortalPage({ params }: PageProps) {
  const { token } = await params
  const data = await getVendorPortalData(token)

  if (!data) {
    notFound()
  }

  return <VendorPortalClient data={data} token={token} />
}
