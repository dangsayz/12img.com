'use client'

export function UpgradeCard() {
  return (
    <div className="mt-auto relative overflow-hidden rounded-ruanta-lg bg-ruanta-bg p-6 border border-white/50">
      <div className="relative z-10">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          Upgrade to <span className="text-yellow-500">Pro</span>
        </h3>
        <p className="text-xs text-gray-500 mb-6 leading-relaxed font-medium">
          Get 1 month free and unlock all Pro features to manage your team more efficient.
        </p>
        <button className="
          px-6 py-3 rounded-[14px]
          bg-ruanta-accent-charcoal text-white font-bold text-xs
          shadow-lg hover:shadow-xl hover:scale-[1.02]
          transition-all duration-300
        ">
          Upgrade now!
        </button>
      </div>
      {/* Ambient Glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-yellow-100/80 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
    </div>
  )
}
