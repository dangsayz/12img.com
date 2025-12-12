import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SimpleWizard } from '@/components/gallery/create/SimpleWizard'
import { getUserSettings } from '@/server/queries/user.queries'

export const metadata = {
  title: 'Create Gallery',
  description: 'Create a new photo gallery',
}

export default async function CreateGalleryPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // Fetch user's gallery default settings
  const settings = await getUserSettings(userId)

  return (
    <SimpleWizard 
      defaultSettings={{
        passwordEnabled: settings.defaultPasswordEnabled,
        downloadEnabled: settings.defaultDownloadEnabled,
        expiryDays: settings.defaultGalleryExpiryDays,
        watermarkEnabled: settings.defaultWatermarkEnabled,
      }}
    />
  )
}
