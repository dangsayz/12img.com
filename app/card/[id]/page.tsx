import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { CardView } from './CardView'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getCard(id: string) {
  const { data: card, error } = await supabaseAdmin
    .from('demo_cards')
    .select('*')
    .eq('id', id)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (error || !card) return null

  // Increment view count (fire and forget)
  void supabaseAdmin.rpc('increment_demo_card_views', { card_id: id })

  return card
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const card = await getCard(id)
  
  if (!card) {
    return {
      title: 'Card Not Found | 12img',
    }
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/demo-cards/${card.storage_path}`
  const title = card.title || 'Beautiful Photo'
  const description = card.subtitle || 'Shared via 12img - Professional photo galleries for photographers'

  return {
    title: `${title} | 12img`,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

export default async function CardPage({ params }: PageProps) {
  const { id } = await params
  const card = await getCard(id)

  if (!card) {
    notFound()
  }

  const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/demo-cards/${card.storage_path}`

  return (
    <CardView
      card={{
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        photographerName: card.photographer_name,
        imageUrl,
        viewCount: card.view_count,
        createdAt: card.created_at,
      }}
    />
  )
}
