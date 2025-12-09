import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Link from 'next/link'
import Image from 'next/image'

const BUCKET = 'quick-share'

interface Props {
  params: Promise<{ id: string }>
}

// Check if the image exists in storage
async function getImageUrl(id: string): Promise<string | null> {
  // Try common extensions
  const extensions = ['jpg', 'png', 'webp', 'gif']
  
  for (const ext of extensions) {
    const fileName = `${id}.${ext}`
    const { data } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(fileName)
    
    // Verify the file exists by checking if we can get its metadata
    const { data: fileData, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .list('', { search: fileName })
    
    if (!error && fileData && fileData.length > 0) {
      return data.publicUrl
    }
  }
  
  return null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const imageUrl = await getImageUrl(id)
  
  if (!imageUrl) {
    return { title: 'Image Not Found' }
  }

  return {
    title: 'Shared Image',
    description: 'made by 12img',
    openGraph: {
      title: 'Shared Image',
      description: 'made by 12img',
      images: [{ url: imageUrl, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Shared Image',
      description: 'made by 12img',
      images: [imageUrl],
    },
  }
}

export default async function SharedImagePage({ params }: Props) {
  const { id } = await params
  const imageUrl = await getImageUrl(id)

  if (!imageUrl) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col">
      {/* Image Container */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="relative max-w-5xl w-full">
          <img
            src={imageUrl}
            alt="Shared image"
            className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      </div>

      {/* Branded Footer */}
      <footer className="py-6 px-4 border-t border-white/10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-neutral-900 font-bold text-sm">12</span>
              </div>
              <span className="text-white/80 group-hover:text-white transition-colors">
                12img.com
              </span>
            </Link>
            <span className="text-white/40 text-sm">
              Free image sharing
            </span>
          </div>

          <Link
            href="/share"
            className="px-5 py-2.5 bg-white text-neutral-900 rounded-full font-medium text-sm hover:bg-white/90 transition-colors"
          >
            Upload your own →
          </Link>
        </div>
      </footer>
    </div>
  )
}
