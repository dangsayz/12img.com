import { auth } from '@clerk/nextjs/server'
import { UserProfile } from '@clerk/nextjs'
import { Header } from '@/components/layout/Header'
import { getUserWithUsage } from '@/server/queries/user.queries'

export default async function AccountPage() {
  const { userId } = await auth()
  const userData = userId ? await getUserWithUsage(userId) : null
  
  return (
    <>
      <Header 
        userPlan={userData?.plan || 'free'}
        galleryCount={userData?.usage.galleryCount || 0}
        imageCount={userData?.usage.imageCount || 0}
        storageUsed={userData?.usage.totalBytes || 0}
        isAuthenticated={!!userId}
        userRole={userData?.role}
      />
      <main className="container mx-auto px-4 pt-28 pb-16">
        <UserProfile 
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'shadow-none',
            }
          }}
        />
      </main>
    </>
  )
}
