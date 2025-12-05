import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getUserWithUsage } from '@/server/queries/user.queries'
import { getPlan } from '@/lib/config/pricing'
import { Header } from '@/components/layout/Header'
import { CreateGalleryForm } from './CreateGalleryForm'

export const dynamic = 'force-dynamic'

export default async function CreateGalleryPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  const userData = await getUserWithUsage(userId)
  const plan = getPlan(userData?.plan || 'free')
  
  const galleryLimit = plan?.limits.galleries === 'unlimited' 
    ? Infinity 
    : (plan?.limits.galleries || 3)
  
  const currentCount = userData?.usage.galleryCount || 0
  const isAtLimit = currentCount >= galleryLimit

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header 
        userPlan={userData?.plan || 'free'}
        galleryCount={currentCount}
        imageCount={userData?.usage.imageCount || 0}
      />
      
      <CreateGalleryForm 
        isAtLimit={isAtLimit}
        currentCount={currentCount}
        galleryLimit={galleryLimit === Infinity ? 'unlimited' : galleryLimit}
        planName={plan?.name || 'Free'}
      />
    </div>
  )
}
