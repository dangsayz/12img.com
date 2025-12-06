import { redirect } from 'next/navigation'

// Redirect to the new upload flow
export default function CreateGalleryPage() {
  redirect('/upload')
}
