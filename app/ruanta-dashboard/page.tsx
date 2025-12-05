import { TopNav } from '@/components/ruanta/navigation/TopNav'
import { StatisticPanel } from '@/components/ruanta/sidebar/StatisticPanel'
import { KanbanBoard } from '@/components/ruanta/board/KanbanBoard'

export default function RuantaDashboardPage() {
  return (
    <div className="min-h-screen bg-ruanta-bg p-6 font-sans text-gray-900 overflow-hidden relative">
      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none z-0 mix-blend-overlay" 
           style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} 
      />
      
      {/* Ambient Light Spill */}
      <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-white/40 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-[1600px] mx-auto h-[calc(100vh-3rem)] flex flex-col gap-6">
        <TopNav />
        
        <div className="flex-1 flex gap-6 overflow-hidden">
          {/* Sidebar */}
          <aside className="hidden md:block w-[340px] flex-shrink-0 h-full">
            <StatisticPanel />
          </aside>

          {/* Main Content */}
          <main className="flex-1 h-full overflow-hidden">
            <KanbanBoard />
          </main>
        </div>
      </div>
    </div>
  )
}
