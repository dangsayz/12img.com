import { Suspense } from 'react'
import { 
  getSettingsByCategory, 
  getMaintenanceStatus, 
  getHealthChecks,
  getSystemStats,
} from '@/server/admin/settings'
import { SettingsContentV2 as SettingsContent } from './SettingsContentV2'

export default async function AdminSettingsPage() {
  const [settings, maintenance, health, stats] = await Promise.all([
    getSettingsByCategory(),
    getMaintenanceStatus(),
    getHealthChecks(),
    getSystemStats(),
  ])
  
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="font-serif text-2xl lg:text-4xl text-[#141414]">Settings</h1>
        <p className="text-[#525252] text-sm lg:text-base mt-1 lg:mt-2">
          System configuration, maintenance mode, and health monitoring
        </p>
      </div>
      
      <Suspense fallback={<div className="animate-pulse bg-stone-100 h-96" />}>
        <SettingsContent 
          settings={settings}
          maintenance={maintenance}
          health={health}
          stats={stats}
        />
      </Suspense>
    </div>
  )
}
