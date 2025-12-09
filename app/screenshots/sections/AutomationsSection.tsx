'use client'

import { Check, Mail } from 'lucide-react'

export function AutomationsSection() {
  return (
    <div className="w-[1080px] h-[1350px] bg-white flex flex-col items-center justify-center p-20">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-4 mb-10">
          <div className="h-px w-16 bg-stone-300" />
          <span className="text-[14px] font-medium uppercase tracking-[0.3em] text-stone-400">Automations</span>
          <div className="h-px w-16 bg-stone-300" />
        </div>
        
        <h2 className="font-serif text-[72px] text-stone-900 leading-[1.1] tracking-[-0.02em] mb-10">
          Emails that send<br />
          <span className="italic font-light">themselves.</span>
        </h2>
        
        <p className="text-stone-500 text-[24px] leading-relaxed max-w-[700px] mx-auto font-light">
          Set it once. Your clients get the right email at the right time, automatically.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative w-full max-w-[900px] mb-16">
        <div className="absolute top-[40px] left-0 right-0 h-[2px] bg-stone-200" />
        
        <div className="relative flex justify-between items-start px-8">
          {[
            { days: '-30', label: 'Planning', sublabel: 'Questionnaire', done: true },
            { days: '-14', label: 'What to', sublabel: 'Wear', done: true },
            { days: '-7', label: 'Timeline', sublabel: 'Reminder', done: true },
            { days: '-2', label: 'Final', sublabel: 'Check-in', current: true },
            { days: '+1', label: 'Thank', sublabel: 'You', future: true },
          ].map((item, i) => (
            <div key={i} className="flex flex-col items-center text-center">
              <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center ${
                item.done 
                  ? 'bg-stone-100 border-2 border-stone-200' 
                  : item.current 
                    ? 'bg-stone-900 shadow-2xl' 
                    : 'bg-white border-2 border-stone-200'
              }`}>
                {item.done ? (
                  <Check className="w-8 h-8 text-stone-400" />
                ) : item.current ? (
                  <Mail className="w-8 h-8 text-white" />
                ) : (
                  <Mail className="w-8 h-8 text-stone-300" />
                )}
              </div>
              
              <div className={`mt-5 px-5 py-2 rounded-full text-[14px] font-medium ${
                item.current ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500'
              }`}>
                {item.days}d
              </div>
              
              <div className="mt-4">
                <p className={`text-[18px] font-medium ${
                  item.done ? 'text-stone-400' : item.current ? 'text-stone-900' : 'text-stone-400'
                }`}>{item.label}</p>
                <p className={`text-[14px] ${
                  item.done ? 'text-stone-300' : item.current ? 'text-stone-500' : 'text-stone-300'
                }`}>{item.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Status */}
      <div className="inline-flex items-center gap-4 px-8 py-4 bg-stone-50 rounded-full border border-stone-100">
        <div className="w-3 h-3 rounded-full bg-stone-900 animate-pulse" />
        <span className="text-[18px] text-stone-600">Next email sends in <span className="font-medium text-stone-900">2 days</span></span>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-4 gap-px bg-stone-200 border border-stone-200 mt-16 w-full max-w-[900px]">
        {[
          { title: 'Event-based', desc: 'Triggers relative to event date' },
          { title: 'Smart templates', desc: 'Merge fields for personalization' },
          { title: 'Custom timing', desc: 'Set exactly when emails send' },
          { title: 'Preview first', desc: 'See what clients receive' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-8">
            <p className="text-stone-900 font-medium text-[16px] mb-1">{item.title}</p>
            <p className="text-stone-400 text-[13px]">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-16 flex items-center gap-16">
        <div className="text-center">
          <p className="text-[64px] font-extralight text-stone-900">5</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Automated</p>
        </div>
        <div className="w-px h-20 bg-stone-200" />
        <div className="text-center">
          <p className="text-[64px] font-extralight text-stone-900">0</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Manual</p>
        </div>
        <div className="w-px h-20 bg-stone-200" />
        <div className="text-center">
          <p className="text-[64px] font-extralight text-stone-900">∞</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">Hours saved</p>
        </div>
      </div>
    </div>
  )
}
