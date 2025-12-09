import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://12img.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/sign-in/',
          '/sign-up/',
          '/account/',
          '/settings/',
          '/gallery/',       // User's private gallery management
          '/upload/',
          '/admin/',         // Admin panel
          '/dashboard/',     // User dashboard
          '/portal/',        // Client portal (private tokens)
          '/view-reel/*/download',   // Download endpoints
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],     // Block AI crawlers if desired
      },
      {
        userAgent: 'ChatGPT-User',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
