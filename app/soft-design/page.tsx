import { SoftLayout } from '@/components/soft-ui/SoftLayout'
import { SoftHeader } from '@/components/soft-ui/SoftHeader'
import { SoftStats } from '@/components/soft-ui/SoftStats'
import { SoftGalleryBoard } from '@/components/soft-ui/SoftGalleryBoard'

export default function SoftDesignPage() {
  return (
    <SoftLayout>
      <SoftHeader />
      
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* Sidebar Stats */}
        <aside className="hidden md:block w-[320px] flex-shrink-0 h-full">
          <SoftStats />
        </aside>

        {/* Main Board */}
        <main className="flex-1 h-full overflow-hidden bg-soft-surface/50 rounded-[32px] p-6 border border-white/50 shadow-neumorphic-sm backdrop-blur-sm">
          <SoftGalleryBoard />
        </main>
      </div>
    </SoftLayout>
  )
}
