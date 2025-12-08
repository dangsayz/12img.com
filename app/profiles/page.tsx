import { Metadata } from 'next'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { getPublicProfiles } from '@/server/actions/profile.actions'
import { PublicHeader } from '@/components/profile/PublicHeader'
import { ProfileCard } from '@/components/profile/ProfileCard'

export const metadata: Metadata = {
  title: 'Photographer Profiles',
  description: 'Discover talented photographers and their beautiful galleries on 12img.',
}

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function ProfilesPage() {
  const { profiles, total } = await getPublicProfiles(50, 0)

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <PublicHeader />
      
      <main className="pt-24 pb-16 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Editorial Header */}
          <div className="mb-16 pt-8">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="h-px w-12 bg-stone-300" />
              <span className="text-[10px] uppercase tracking-[0.3em] text-stone-400 font-medium">
                Directory
              </span>
              <div className="h-px w-12 bg-stone-300" />
            </div>
            
            <h1 className="text-center font-serif text-4xl sm:text-5xl md:text-6xl text-stone-900 tracking-tight mb-6">
              Photographers
            </h1>
            
            <p className="text-center text-stone-400 text-sm max-w-md mx-auto leading-relaxed">
              Creatives who&apos;ve chosen to share their vision with the world
            </p>
            
            {total > 0 && (
              <div className="flex items-center justify-center mt-8">
                <span className="text-xs text-stone-300 tracking-widest uppercase">
                  {total} {total === 1 ? 'Artist' : 'Artists'}
                </span>
              </div>
            )}
          </div>

          {/* Profiles Grid - Tall Vertical Cards */}
          {profiles.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {profiles.map((profile) => (
                <ProfileCard key={profile.id} profile={profile} />
              ))}
            </div>
          ) : (
            <div className="text-center py-24">
              <div className="mb-8">
                <Camera className="w-12 h-12 mx-auto text-stone-300" strokeWidth={1} />
              </div>
              <h3 className="font-serif text-2xl text-stone-800 mb-3">
                The stage awaits
              </h3>
              <p className="text-stone-400 text-sm max-w-xs mx-auto mb-10 leading-relaxed">
                Be among the first to share your creative vision with the world.
              </p>
              <Link
                href="/sign-up"
                className="inline-block px-8 py-3 bg-stone-900 text-white text-sm tracking-wide hover:bg-stone-800 transition-colors"
              >
                Join the Directory
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
