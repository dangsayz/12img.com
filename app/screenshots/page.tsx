'use client'

import { useState } from 'react'
import { AutomationsSection } from './sections/AutomationsSection'
import { ContractsSection } from './sections/ContractsSection'
import { EmailTrackingSection } from './sections/EmailTrackingSection'
import { MilestoneSection } from './sections/MilestoneSection'
import { MessagingSection } from './sections/MessagingSection'

type SectionId = 'automations' | 'contracts' | 'email-tracking' | 'milestones' | 'messaging'

const SECTIONS = [
  { id: 'automations' as const, name: 'Automations', desc: 'Emails that send themselves' },
  { id: 'contracts' as const, name: 'Contracts', desc: 'Smart contracts with e-signatures' },
  { id: 'email-tracking' as const, name: 'Email Tracking', desc: 'Know when clients view & download' },
  { id: 'milestones' as const, name: 'Milestones', desc: 'Track every project milestone' },
  { id: 'messaging' as const, name: 'Messaging', desc: 'Real-time client messaging' },
]

export default function ScreenshotsPage() {
  const [active, setActive] = useState<SectionId>('automations')

  return (
    <div className="min-h-screen bg-stone-100">
      <div className="bg-white border-b border-stone-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-stone-900">Landing Page Screenshots</h1>
          <p className="text-sm text-stone-500">Instagram-ready (1080×1350) - Right-click → Inspect → Capture node screenshot</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid lg:grid-cols-[280px,1fr] gap-8">
        <div className="space-y-2">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s.id)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                active === s.id ? 'bg-stone-900 text-white' : 'bg-white hover:bg-stone-50'
              }`}
            >
              <p className="font-medium text-sm">{s.name}</p>
              <p className={`text-xs ${active === s.id ? 'text-stone-300' : 'text-stone-400'}`}>{s.desc}</p>
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <div className="w-full max-w-[540px] overflow-hidden rounded-2xl shadow-2xl bg-white">
            <div 
              id="screenshot-container"
              className="w-[1080px] h-[1350px] origin-top-left"
              style={{ transform: 'scale(0.5)', marginBottom: '-675px' }}
            >
              {active === 'automations' && <AutomationsSection />}
              {active === 'contracts' && <ContractsSection />}
              {active === 'email-tracking' && <EmailTrackingSection />}
              {active === 'milestones' && <MilestoneSection />}
              {active === 'messaging' && <MessagingSection />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
