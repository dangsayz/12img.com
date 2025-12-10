'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronRight,
  Save,
  Shield,
  Mail,
  HardDrive,
  CreditCard,
  Globe,
  Pencil,
  X,
  Search,
  Zap,
  Database,
  Bell,
  Key,
  Activity,
  Server,
  FileText,
  Link,
  Image,
  BarChart3,
  Lock,
  Eye,
  Copy,
  ExternalLink,
  Code,
  Webhook,
  Gauge,
  Trash2,
  Download,
  Upload,
  Users,
  Palette,
  Type,
} from 'lucide-react'
import type { 
  SystemSetting, 
  MaintenanceWindow, 
  HealthCheck,
  SettingCategory,
} from '@/server/admin/settings'

interface Props {
  settings: Record<SettingCategory, SystemSetting[]>
  maintenance: MaintenanceWindow | null
  health: HealthCheck[]
  stats: {
    settingsCount: number
    maintenanceActive: boolean
    healthyServices: number
    totalServices: number
  }
}

// Extended control panels beyond basic settings
const CONTROL_PANELS = [
  {
    id: 'seo',
    icon: Search,
    label: 'SEO & Meta',
    description: 'Search engine optimization, meta tags, social sharing',
    color: 'text-[#525252]',
  },
  {
    id: 'performance',
    icon: Zap,
    label: 'Performance',
    description: 'Caching, CDN, image optimization, compression',
    color: 'text-[#525252]',
  },
  {
    id: 'integrations',
    icon: Webhook,
    label: 'Integrations',
    description: 'Third-party services, webhooks, API keys',
    color: 'text-[#525252]',
  },
  {
    id: 'notifications',
    icon: Bell,
    label: 'Notifications',
    description: 'Admin alerts, thresholds, email notifications',
    color: 'text-[#525252]',
  },
  {
    id: 'branding',
    icon: Palette,
    label: 'Branding',
    description: 'Logo, colors, email templates, white-label',
    color: 'text-[#525252]',
  },
  {
    id: 'data',
    icon: Database,
    label: 'Data & Backup',
    description: 'Export data, cleanup, retention policies',
    color: 'text-[#525252]',
  },
]

const CATEGORY_CONFIG: Record<SettingCategory, { icon: React.ElementType; label: string; description: string }> = {
  general: { icon: Globe, label: 'General', description: 'Core platform settings' },
  email: { icon: Mail, label: 'Email', description: 'Email configuration' },
  storage: { icon: HardDrive, label: 'Storage', description: 'File storage settings' },
  billing: { icon: CreditCard, label: 'Billing', description: 'Payment settings' },
  security: { icon: Shield, label: 'Security', description: 'Security configuration' },
}

const HEALTH_STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  healthy: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  degraded: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
  down: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
  unknown: { icon: Clock, color: 'text-[#525252]', bg: 'bg-[#F5F5F7]' },
}

export function SettingsContentV2({ settings, maintenance, health, stats }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeSection, setActiveSection] = useState<string>('overview')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['general']))
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)
  const [activePanel, setActivePanel] = useState<string | null>(null)
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }
  
  const runHealthChecks = async () => {
    setIsRunningHealthCheck(true)
    try {
      await fetch('/api/admin/health/check', { method: 'POST' })
      startTransition(() => router.refresh())
    } catch (error) {
      // Silent fail
    } finally {
      setIsRunningHealthCheck(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Maintenance Alert Banner */}
      {maintenance && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 flex items-center justify-between ${
            maintenance.severity === 'critical' 
              ? 'bg-red-600 text-white' 
              : maintenance.severity === 'warning'
              ? 'bg-amber-500 text-white'
              : 'bg-[#141414] text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <p className="font-medium">{maintenance.title}</p>
              <p className="text-sm opacity-80">{maintenance.message}</p>
            </div>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-4 py-2 bg-white/20 hover:bg-white/30 text-sm font-medium transition-colors"
          >
            End Maintenance
          </button>
        </motion.div>
      )}
      
      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* System Status with refresh button */}
        <div className={`border p-4 ${
          stats.healthyServices === stats.totalServices 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-amber-50 border-amber-200 text-amber-700'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-wider opacity-70">System Status</p>
            <button
              onClick={runHealthChecks}
              disabled={isRunningHealthCheck}
              className={`p-1 rounded transition-colors ${
                stats.healthyServices === stats.totalServices 
                  ? 'hover:bg-emerald-100 text-emerald-600' 
                  : 'hover:bg-amber-100 text-amber-600'
              } disabled:opacity-50`}
              title="Refresh health checks"
            >
              {isRunningHealthCheck ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-xl font-serif mt-1">
            {stats.healthyServices === stats.totalServices ? 'Operational' : 'Degraded'}
          </p>
        </div>
        <QuickStatCard 
          label="Maintenance" 
          value={stats.maintenanceActive ? 'Active' : 'Off'}
          status={stats.maintenanceActive ? 'warning' : 'neutral'}
        />
        <QuickStatCard 
          label="Services" 
          value={`${stats.healthyServices}/${stats.totalServices}`}
          status="neutral"
        />
        <QuickStatCard 
          label="Settings" 
          value={String(stats.settingsCount)}
          status="neutral"
        />
      </div>
      
      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Navigation */}
        <div className="lg:col-span-1 space-y-4">
          {/* Quick Actions */}
          <div className="bg-white border border-[#E5E5E5] p-4">
            <h3 className="text-xs font-medium text-[#525252] uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <button
                onClick={() => setShowMaintenanceModal(true)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                  maintenance ? 'bg-amber-50 text-amber-700' : 'hover:bg-[#F5F5F7]'
                }`}
              >
                <AlertTriangle className="w-4 h-4" />
                {maintenance ? 'End Maintenance Mode' : 'Enable Maintenance Mode'}
              </button>
              <button
                onClick={runHealthChecks}
                disabled={isRunningHealthCheck}
                className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
              >
                {isRunningHealthCheck ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Run Health Checks
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-left text-sm hover:bg-[#F5F5F7] transition-colors">
                <Download className="w-4 h-4" />
                Export All Settings
              </button>
            </div>
          </div>
          
          {/* Control Panels */}
          <div className="bg-white border border-[#E5E5E5]">
            <div className="p-4 border-b border-[#E5E5E5]">
              <h3 className="text-xs font-medium text-[#525252] uppercase tracking-wider">Control Panels</h3>
            </div>
            <div className="divide-y divide-[#E5E5E5]">
              {CONTROL_PANELS.map((panel) => {
                const Icon = panel.icon
                const isActive = activePanel === panel.id
                return (
                  <button
                    key={panel.id}
                    onClick={() => setActivePanel(isActive ? null : panel.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-[#141414] text-white' : 'hover:bg-[#F5F5F7]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{panel.label}</p>
                      <p className={`text-xs truncate ${isActive ? 'text-white/70' : 'text-[#737373]'}`}>
                        {panel.description}
                      </p>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                  </button>
                )
              })}
            </div>
          </div>
          
          {/* System Health */}
          <div className="bg-white border border-[#E5E5E5]">
            <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
              <h3 className="text-xs font-medium text-[#525252] uppercase tracking-wider">System Health</h3>
              <button
                onClick={runHealthChecks}
                disabled={isRunningHealthCheck}
                className="p-1 hover:bg-[#F5F5F7] transition-colors"
              >
                <RefreshCw className={`w-3 h-3 text-[#737373] ${isRunningHealthCheck ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {health.map((check) => {
                const config = HEALTH_STATUS_CONFIG[check.status] || HEALTH_STATUS_CONFIG.unknown
                const StatusIcon = config.icon
                return (
                  <div key={check.service} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                      <span className="text-sm capitalize">{check.service}</span>
                    </div>
                    {check.responseTimeMs && (
                      <span className="text-xs text-[#A3A3A3]">{check.responseTimeMs}ms</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        
        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Panel Content */}
          <AnimatePresence mode="wait">
            {activePanel ? (
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <ControlPanelContent panelId={activePanel} onClose={() => setActivePanel(null)} />
              </motion.div>
            ) : (
              <motion.div
                key="settings"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                {/* Settings Categories */}
                {(Object.keys(CATEGORY_CONFIG) as SettingCategory[]).map((category) => {
                  const categorySettings = settings[category] || []
                  const config = CATEGORY_CONFIG[category]
                  const Icon = config.icon
                  const isExpanded = expandedCategories.has(category)
                  
                  return (
                    <div key={category} className="bg-white border border-[#E5E5E5]">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 border border-[#E5E5E5]">
                            <Icon className="w-4 h-4 text-[#525252]" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-[#141414]">{config.label}</h3>
                            <p className="text-xs text-[#737373]">{config.description}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 text-xs bg-[#F5F5F7] text-[#525252]">
                            {categorySettings.length}
                          </span>
                          <ChevronDown className={`w-4 h-4 text-[#525252] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </div>
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && categorySettings.length > 0 && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-[#E5E5E5] divide-y divide-[#E5E5E5]">
                              {categorySettings.map((setting) => (
                                <SettingRow 
                                  key={setting.id} 
                                  setting={setting} 
                                  onEdit={() => setEditingSetting(setting)}
                                />
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Edit Setting Modal */}
      <AnimatePresence>
        {editingSetting && (
          <EditSettingModal 
            setting={editingSetting} 
            onClose={() => setEditingSetting(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Maintenance Modal */}
      <AnimatePresence>
        {showMaintenanceModal && (
          <MaintenanceModal 
            isActive={!!maintenance}
            onClose={() => setShowMaintenanceModal(false)} 
          />
        )}
      </AnimatePresence>
      
      {/* Loading Overlay */}
      {isPending && (
        <div className="fixed inset-0 bg-white/50 z-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
        </div>
      )}
    </div>
  )
}

// Quick Stat Card
function QuickStatCard({ label, value, status }: { label: string; value: string; status: 'success' | 'warning' | 'error' | 'neutral' }) {
  const statusStyles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    warning: 'bg-amber-50 border-amber-200 text-amber-700',
    error: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-white border-[#E5E5E5] text-[#141414]',
  }
  
  return (
    <div className={`border p-4 ${statusStyles[status]}`}>
      <p className="text-xs uppercase tracking-wider opacity-70">{label}</p>
      <p className="text-xl font-serif mt-1">{value}</p>
    </div>
  )
}

// Setting Row
function SettingRow({ setting, onEdit }: { setting: SystemSetting; onEdit: () => void }) {
  return (
    <div className="px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[#141414]">{setting.name}</p>
        {setting.description && (
          <p className="text-xs text-[#737373] mt-0.5">{setting.description}</p>
        )}
        <code className="text-xs text-[#A3A3A3] bg-[#F5F5F7] px-1.5 py-0.5 mt-1 inline-block">
          {setting.key}
        </code>
      </div>
      <div className="flex items-center gap-3 ml-4">
        <div className="text-right">
          {setting.isSensitive ? (
            <span className="text-sm text-[#A3A3A3]">••••••••</span>
          ) : (
            <span className="text-sm text-[#141414] font-mono">
              {formatValue(setting.value, setting.valueType)}
            </span>
          )}
        </div>
        {!setting.isReadonly && (
          <button
            onClick={onEdit}
            className="p-2 hover:bg-[#E5E5E5] transition-colors"
          >
            <Pencil className="w-4 h-4 text-[#525252]" />
          </button>
        )}
      </div>
    </div>
  )
}

function formatValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return '—'
  if (type === 'boolean') return value ? 'true' : 'false'
  if (type === 'array') return Array.isArray(value) ? value.join(', ') : String(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

// Control Panel Content
function ControlPanelContent({ panelId, onClose }: { panelId: string; onClose: () => void }) {
  const panels: Record<string, React.ReactNode> = {
    seo: <SEOPanel />,
    performance: <PerformancePanel />,
    integrations: <IntegrationsPanel />,
    notifications: <NotificationsPanel />,
    branding: <BrandingPanel />,
    data: <DataPanel />,
  }
  
  const panelConfig = CONTROL_PANELS.find(p => p.id === panelId)
  if (!panelConfig) return null
  
  const Icon = panelConfig.icon
  
  return (
    <div className="bg-white border border-[#E5E5E5]">
      <div className="p-4 border-b border-[#E5E5E5] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#141414]">
            <Icon className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-medium text-[#141414]">{panelConfig.label}</h2>
            <p className="text-xs text-[#737373]">{panelConfig.description}</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] transition-colors">
          <X className="w-4 h-4 text-[#525252]" />
        </button>
      </div>
      <div className="p-6">
        {panels[panelId] || <ComingSoonPanel />}
      </div>
    </div>
  )
}

// SEO Panel
function SEOPanel() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState({
    siteTitle: '12img - Professional Photo Galleries',
    metaDescription: 'Create stunning photo galleries for your clients. Professional delivery, beautiful presentation.',
    defaultOgImage: 'https://12img.com/og-default.jpg',
    twitterHandle: '@12img',
    facebookAppId: '',
    allowIndexing: true,
    generateSitemap: true,
    includeProfilesInSitemap: false,
  })
  
  const handleSave = async () => {
    setIsSaving(true)
    try {
      await fetch('/api/admin/platform/seo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
    } catch (e) {
      // Silent fail
    } finally {
      setIsSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Default Meta Tags</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Site Title</label>
            <input 
              type="text" 
              value={settings.siteTitle}
              onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Meta Description</label>
            <textarea 
              value={settings.metaDescription}
              onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414] resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Default OG Image URL</label>
            <input 
              type="text" 
              value={settings.defaultOgImage}
              onChange={(e) => setSettings({ ...settings, defaultOgImage: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Robots & Indexing</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={settings.allowIndexing}
              onChange={(e) => setSettings({ ...settings, allowIndexing: e.target.checked })}
              className="rounded border-[#E5E5E5]" 
            />
            <span className="text-sm">Allow search engine indexing</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={settings.generateSitemap}
              onChange={(e) => setSettings({ ...settings, generateSitemap: e.target.checked })}
              className="rounded border-[#E5E5E5]" 
            />
            <span className="text-sm">Generate sitemap automatically</span>
          </label>
          <label className="flex items-center gap-2">
            <input 
              type="checkbox" 
              checked={settings.includeProfilesInSitemap}
              onChange={(e) => setSettings({ ...settings, includeProfilesInSitemap: e.target.checked })}
              className="rounded border-[#E5E5E5]" 
            />
            <span className="text-sm">Include user profiles in sitemap</span>
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Social Sharing</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Twitter Handle</label>
            <input 
              type="text" 
              value={settings.twitterHandle}
              onChange={(e) => setSettings({ ...settings, twitterHandle: e.target.value })}
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Facebook App ID</label>
            <input 
              type="text" 
              value={settings.facebookAppId}
              onChange={(e) => setSettings({ ...settings, facebookAppId: e.target.value })}
              placeholder="Optional"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>
      </div>
      
      <button 
        onClick={handleSave}
        disabled={isSaving}
        className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save SEO Settings
      </button>
    </div>
  )
}

// Performance Panel
function PerformancePanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Image Optimization</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Compression Quality (1-100)</label>
            <input 
              type="range" 
              min="1" 
              max="100" 
              defaultValue="85"
              className="w-full"
            />
            <div className="flex justify-between text-xs text-[#A3A3A3]">
              <span>Smaller files</span>
              <span>85%</span>
              <span>Higher quality</span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Max Dimension (px)</label>
            <select className="w-full px-3 py-2 border border-[#E5E5E5] text-sm bg-white">
              <option>2048</option>
              <option selected>4096</option>
              <option>6000</option>
              <option>Original (no limit)</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" defaultChecked className="rounded border-[#E5E5E5]" />
            <span className="text-sm">Enable WebP conversion</span>
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Caching</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Signed URL TTL</label>
            <select className="w-full px-3 py-2 border border-[#E5E5E5] text-sm bg-white">
              <option>1 hour</option>
              <option>6 hours</option>
              <option selected>24 hours</option>
              <option>7 days</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Browser Cache TTL</label>
            <select className="w-full px-3 py-2 border border-[#E5E5E5] text-sm bg-white">
              <option>1 day</option>
              <option selected>7 days</option>
              <option>30 days</option>
              <option>1 year (immutable)</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-[#F5F5F7] border border-[#E5E5E5]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Clear All Caches</span>
          <button className="px-3 py-1 text-xs border border-[#E5E5E5] hover:bg-white transition-colors">
            Clear Now
          </button>
        </div>
        <p className="text-xs text-[#737373]">This will invalidate all cached images and signed URLs.</p>
      </div>
      
      <button className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors">
        Save Performance Settings
      </button>
    </div>
  )
}

// Integrations Panel
function IntegrationsPanel() {
  const integrations = [
    { name: 'Stripe', status: 'connected', icon: CreditCard },
    { name: 'Resend', status: 'connected', icon: Mail },
    { name: 'Clerk', status: 'connected', icon: Users },
    { name: 'Supabase', status: 'connected', icon: Database },
    { name: 'Google Analytics', status: 'not_configured', icon: BarChart3 },
    { name: 'Plausible', status: 'not_configured', icon: Activity },
  ]
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Connected Services</h3>
        <div className="space-y-2">
          {integrations.map((int) => {
            const Icon = int.icon
            return (
              <div key={int.name} className="flex items-center justify-between p-3 border border-[#E5E5E5]">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-[#525252]" />
                  <span className="text-sm">{int.name}</span>
                </div>
                {int.status === 'connected' ? (
                  <span className="px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700">Connected</span>
                ) : (
                  <button className="px-2 py-0.5 text-xs border border-[#E5E5E5] hover:bg-[#F5F5F7]">
                    Configure
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Webhooks</h3>
        <p className="text-xs text-[#737373] mb-3">Send events to external services when actions occur.</p>
        <button className="px-3 py-2 text-sm border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors">
          + Add Webhook Endpoint
        </button>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">API Keys</h3>
        <p className="text-xs text-[#737373] mb-3">Manage API keys for programmatic access.</p>
        <div className="p-3 border border-[#E5E5E5] bg-[#F5F5F7]">
          <p className="text-xs text-[#525252]">No API keys created yet.</p>
        </div>
      </div>
    </div>
  )
}

// Notifications Panel
function NotificationsPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Admin Alerts</h3>
        <div className="space-y-2">
          <label className="flex items-center justify-between p-3 border border-[#E5E5E5]">
            <span className="text-sm">New user signups</span>
            <input type="checkbox" defaultChecked className="rounded border-[#E5E5E5]" />
          </label>
          <label className="flex items-center justify-between p-3 border border-[#E5E5E5]">
            <span className="text-sm">New subscription</span>
            <input type="checkbox" defaultChecked className="rounded border-[#E5E5E5]" />
          </label>
          <label className="flex items-center justify-between p-3 border border-[#E5E5E5]">
            <span className="text-sm">Subscription cancelled</span>
            <input type="checkbox" defaultChecked className="rounded border-[#E5E5E5]" />
          </label>
          <label className="flex items-center justify-between p-3 border border-[#E5E5E5]">
            <span className="text-sm">Support message received</span>
            <input type="checkbox" defaultChecked className="rounded border-[#E5E5E5]" />
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Alert Thresholds</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Storage warning at (%)</label>
            <input 
              type="number" 
              defaultValue="80"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Critical storage alert at (%)</label>
            <input 
              type="number" 
              defaultValue="95"
              className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
            />
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Notification Email</h3>
        <input 
          type="email" 
          defaultValue="admin@12img.com"
          className="w-full px-3 py-2 border border-[#E5E5E5] text-sm focus:outline-none focus:border-[#141414]"
        />
      </div>
      
      <button className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors">
        Save Notification Settings
      </button>
    </div>
  )
}

// Branding Panel
function BrandingPanel() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Logo</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center bg-[#F5F5F7]">
            <Type className="w-8 h-8 text-[#525252]" />
          </div>
          <button className="px-3 py-2 text-sm border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors">
            Upload Logo
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Brand Colors</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Primary Color</label>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#141414" className="w-8 h-8 border-0" />
              <input 
                type="text" 
                defaultValue="#141414"
                className="flex-1 px-3 py-2 border border-[#E5E5E5] text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Accent Color</label>
            <div className="flex items-center gap-2">
              <input type="color" defaultValue="#525252" className="w-8 h-8 border-0" />
              <input 
                type="text" 
                defaultValue="#525252"
                className="flex-1 px-3 py-2 border border-[#E5E5E5] text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Email Templates</h3>
        <div className="space-y-2">
          {['Gallery Invite', 'Archive Ready', 'Welcome Email', 'Password Reset'].map((template) => (
            <div key={template} className="flex items-center justify-between p-3 border border-[#E5E5E5]">
              <span className="text-sm">{template}</span>
              <button className="text-xs text-[#525252] hover:text-[#141414]">
                Edit Template
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <button className="px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors">
        Save Branding Settings
      </button>
    </div>
  )
}

// Data Panel
function DataPanel() {
  const [exporting, setExporting] = useState<string | null>(null)
  const [purging, setPurging] = useState(false)
  const [clearing, setClearing] = useState(false)
  
  const handleExport = async (type: string) => {
    setExporting(type)
    try {
      const response = await fetch(`/api/admin/platform/export?type=${type}`)
      const blob = await response.blob()
      const contentDisposition = response.headers.get('Content-Disposition')
      const filename = contentDisposition?.match(/filename="(.+)"/)?.[1] || `export-${type}.csv`
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      // Silent fail
    } finally {
      setExporting(null)
    }
  }
  
  const handlePurge = async () => {
    if (!confirm('Are you sure? This will delete orphaned files permanently.')) return
    setPurging(true)
    try {
      await fetch('/api/admin/platform/data?action=purge_orphans', { method: 'DELETE' })
    } catch (e) {
      // Silent fail
    } finally {
      setPurging(false)
    }
  }
  
  const handleClearLogs = async () => {
    if (!confirm('Are you sure? This will delete audit logs older than 30 days.')) return
    setClearing(true)
    try {
      await fetch('/api/admin/platform/data?action=clear_logs', { method: 'DELETE' })
    } catch (e) {
      // Silent fail
    } finally {
      setClearing(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Data Export</h3>
        <div className="space-y-2">
          <button 
            onClick={() => handleExport('users')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {exporting === 'users' ? (
                <Loader2 className="w-4 h-4 text-[#525252] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#525252]" />
              )}
              <span className="text-sm">Export All Users</span>
            </div>
            <span className="text-xs text-[#A3A3A3]">CSV</span>
          </button>
          <button 
            onClick={() => handleExport('galleries')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {exporting === 'galleries' ? (
                <Loader2 className="w-4 h-4 text-[#525252] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#525252]" />
              )}
              <span className="text-sm">Export All Galleries</span>
            </div>
            <span className="text-xs text-[#A3A3A3]">CSV</span>
          </button>
          <button 
            onClick={() => handleExport('logs')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {exporting === 'logs' ? (
                <Loader2 className="w-4 h-4 text-[#525252] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#525252]" />
              )}
              <span className="text-sm">Export Audit Logs</span>
            </div>
            <span className="text-xs text-[#A3A3A3]">JSON</span>
          </button>
          <button 
            onClick={() => handleExport('settings')}
            disabled={!!exporting}
            className="w-full flex items-center justify-between p-3 border border-[#E5E5E5] hover:bg-[#F5F5F7] transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              {exporting === 'settings' ? (
                <Loader2 className="w-4 h-4 text-[#525252] animate-spin" />
              ) : (
                <Download className="w-4 h-4 text-[#525252]" />
              )}
              <span className="text-sm">Export All Settings</span>
            </div>
            <span className="text-xs text-[#A3A3A3]">JSON</span>
          </button>
        </div>
      </div>
      
      <div>
        <h3 className="text-sm font-medium text-[#141414] mb-3">Data Retention</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-[#525252] mb-1">Delete inactive accounts after</label>
            <select className="w-full px-3 py-2 border border-[#E5E5E5] text-sm bg-white">
              <option value="">Never</option>
              <option value="6">6 months</option>
              <option value="12">1 year</option>
              <option value="24">2 years</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-[#525252] mb-1">Delete demo cards after</label>
            <select defaultValue="30" className="w-full px-3 py-2 border border-[#E5E5E5] text-sm bg-white">
              <option value="30">30 days</option>
              <option value="60">60 days</option>
              <option value="90">90 days</option>
            </select>
          </div>
        </div>
      </div>
      
      <div className="p-4 bg-red-50 border border-red-200">
        <h3 className="text-sm font-medium text-red-800 mb-2">Danger Zone</h3>
        <p className="text-xs text-red-600 mb-3">These actions are irreversible.</p>
        <div className="flex gap-2">
          <button 
            onClick={handlePurge}
            disabled={purging}
            className="px-3 py-2 text-xs border border-red-300 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
          >
            {purging && <Loader2 className="w-3 h-3 animate-spin" />}
            Purge Orphaned Files
          </button>
          <button 
            onClick={handleClearLogs}
            disabled={clearing}
            className="px-3 py-2 text-xs border border-red-300 text-red-700 hover:bg-red-100 transition-colors disabled:opacity-50 inline-flex items-center gap-1"
          >
            {clearing && <Loader2 className="w-3 h-3 animate-spin" />}
            Clear Old Logs
          </button>
        </div>
      </div>
    </div>
  )
}

// Coming Soon Panel
function ComingSoonPanel() {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 border border-[#E5E5E5] flex items-center justify-center mx-auto mb-4">
        <Zap className="w-8 h-8 text-[#525252]" />
      </div>
      <h3 className="font-serif text-xl text-[#141414] mb-2">Coming Soon</h3>
      <p className="text-sm text-[#737373]">This control panel is under development.</p>
    </div>
  )
}

// Edit Setting Modal
function EditSettingModal({ setting, onClose }: { setting: SystemSetting; onClose: () => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [value, setValue] = useState(() => {
    if (setting.valueType === 'array' && Array.isArray(setting.value)) {
      return setting.value.join(', ')
    }
    return String(setting.value ?? '')
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      let parsedValue: unknown = value
      
      if (setting.valueType === 'number') {
        parsedValue = Number(value)
      } else if (setting.valueType === 'boolean') {
        parsedValue = value === 'true'
      } else if (setting.valueType === 'array') {
        parsedValue = value.split(',').map(s => s.trim()).filter(Boolean)
      } else if (setting.valueType === 'json') {
        parsedValue = JSON.parse(value)
      }
      
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: setting.key, value: parsedValue }),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md"
      >
        <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl text-[#141414]">Edit Setting</h2>
            <code className="text-xs text-[#737373] bg-[#F5F5F7] px-1.5 py-0.5 mt-1 inline-block">
              {setting.key}
            </code>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] transition-colors">
            <X className="w-5 h-5 text-[#525252]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#141414] mb-1">{setting.name}</label>
            {setting.description && (
              <p className="text-xs text-[#737373] mb-2">{setting.description}</p>
            )}
            
            {setting.valueType === 'boolean' ? (
              <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : setting.valueType === 'number' ? (
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
              />
            ) : (
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                rows={setting.valueType === 'json' || setting.valueType === 'array' ? 4 : 2}
                className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] resize-none font-mono text-sm"
              />
            )}
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// Maintenance Modal
function MaintenanceModal({ isActive, onClose }: { isActive: boolean; onClose: () => void }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: 'Scheduled Maintenance',
    message: 'We are currently performing maintenance. Please check back soon.',
    severity: 'info' as 'info' | 'warning' | 'critical',
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isActive, ...(!isActive && formData) }),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-md"
      >
        <div className="p-6 border-b border-[#E5E5E5] flex items-center justify-between">
          <h2 className="font-serif text-xl text-[#141414]">
            {isActive ? 'End Maintenance' : 'Enable Maintenance'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F7] transition-colors">
            <X className="w-5 h-5 text-[#525252]" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isActive ? (
            <p className="text-[#525252]">
              Are you sure you want to end maintenance mode? Users will be able to access the platform normally.
            </p>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-[#141414] mb-1">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#141414] mb-1">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#141414] mb-1">Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full px-3 py-2 border border-[#E5E5E5] focus:outline-none focus:border-[#141414] bg-white"
                >
                  <option value="info">Info (Black)</option>
                  <option value="warning">Warning (Amber)</option>
                  <option value="critical">Critical (Red)</option>
                </select>
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-3 pt-4 border-t border-[#E5E5E5]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#525252] hover:text-[#141414] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 ${
                isActive
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-[#141414] text-white hover:bg-black'
              }`}
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isActive ? 'End Maintenance' : 'Enable Maintenance'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
