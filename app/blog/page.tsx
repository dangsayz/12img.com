import { StaticPageLayout } from '@/components/layout/StaticPageLayout'
import Link from 'next/link'

export const metadata = {
  title: 'Photography Blog | 12img',
  description: 'Tips, guides, and insights for wedding photographers.',
}

const posts = [
  {
    title: 'How to Price Your Wedding Photography',
    excerpt: 'A practical guide to setting rates that reflect your value and attract the right clients.',
    date: 'Coming soon',
    slug: '#',
  },
  {
    title: '10 Tips for Faster Photo Culling',
    excerpt: 'Streamline your workflow and deliver galleries faster without sacrificing quality.',
    date: 'Coming soon',
    slug: '#',
  },
  {
    title: 'The Art of the Client Gallery Experience',
    excerpt: 'How presentation affects perceived value and client satisfaction.',
    date: 'Coming soon',
    slug: '#',
  },
]

export default function BlogPage() {
  return (
    <StaticPageLayout
      title="Photography Blog"
      subtitle="Tips and insights for wedding photographers."
    >
      <div className="space-y-8">
        <p className="text-[#78716C] leading-relaxed">
          We're working on helpful content for photographers. Check back soon for articles on 
          workflow, business, and making the most of your gallery delivery.
        </p>

        <section>
          <h2 className="text-xl font-semibold text-[#1C1917] mb-6">Upcoming Articles</h2>
          <div className="space-y-6">
            {posts.map((post, i) => (
              <div key={i} className="border-b border-[#E8E4DC] pb-6">
                <p className="text-xs text-[#78716C] mb-2">{post.date}</p>
                <h3 className="font-medium text-[#1C1917] mb-2">{post.title}</h3>
                <p className="text-[#78716C] text-sm">{post.excerpt}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="pt-4">
          <p className="text-[#78716C] text-sm">
            Want to be notified when we publish?{' '}
            <Link href="/sign-up" className="text-amber-600 hover:underline">
              Create a free account
            </Link>{' '}
            and we'll let you know.
          </p>
        </section>
      </div>
    </StaticPageLayout>
  )
}
