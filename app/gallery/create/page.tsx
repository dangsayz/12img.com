import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { SimpleWizard } from '@/components/gallery/create/SimpleWizard'

export const metadata = {
  title: 'Create Gallery',
  description: 'Create a new photo gallery',
}

export default async function CreateGalleryPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return <SimpleWizard />
}
