import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'
  const currentDate = new Date()
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/profiles`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/guides`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contest`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Dynamic pages - Public photographer profiles
  let profilePages: MetadataRoute.Sitemap = []
  let galleryPages: MetadataRoute.Sitemap = []
  
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Fetch public profiles
    const { data: profiles } = await supabase
      .from('users')
      .select('profile_slug, updated_at')
      .in('visibility_mode', ['PUBLIC', 'PUBLIC_LOCKED'])
      .not('profile_slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(1000)
    
    if (profiles) {
      profilePages = profiles.map((profile) => ({
        url: `${baseUrl}/profile/${profile.profile_slug}`,
        lastModified: profile.updated_at ? new Date(profile.updated_at) : currentDate,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
    }
    
    // Fetch public galleries for sitemap (SEO boost)
    const { data: galleries } = await supabase
      .from('galleries')
      .select('slug, updated_at')
      .eq('is_public', true)
      .not('slug', 'is', null)
      .order('updated_at', { ascending: false })
      .limit(2000)
    
    if (galleries) {
      galleryPages = galleries.map((gallery) => ({
        url: `${baseUrl}/view-reel/${gallery.slug}`,
        lastModified: gallery.updated_at ? new Date(gallery.updated_at) : currentDate,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      }))
    }
  } catch (error) {
    console.error('Error fetching data for sitemap:', error)
  }

  return [...staticPages, ...profilePages, ...galleryPages]
}
