'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
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
  HelpCircle,
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

export function SettingsContent({ settings, maintenance, health, stats }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState<'settings' | 'maintenance' | 'health'>('settings')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(['general', 'email'])
  )
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null)
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false)
  const [isRunningHealthCheck, setIsRunningHealthCheck] = useState(false)
  
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
      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      console.error('Health check error:', error)
    } finally {
      setIsRunningHealthCheck(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Maintenance Alert */}
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
      
      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#E5E5E5] p-4 group relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] uppercase tracking-wider">Settings</p>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-[#A3A3A3] cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-[#141414] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-medium mb-1">System Settings</p>
                <p className="text-white/70">Total number of configurable settings across all categories (General, Email, Storage, Billing, Security).</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-serif text-[#141414] mt-1">{stats.settingsCount}</p>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-4 group relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] uppercase tracking-wider">Maintenance</p>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-[#A3A3A3] cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-[#141414] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-medium mb-1">Maintenance Mode</p>
                <p className="text-white/70 mb-2">{stats.maintenanceActive ? 'Site is currently in maintenance mode. Users see a maintenance page.' : 'Site is live and accessible to all users.'}</p>
                <p className="text-white/50 text-[10px]">Use the Maintenance tab to toggle this.</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-serif text-[#141414] mt-1">
            {stats.maintenanceActive ? 'Active' : 'Off'}
          </p>
        </div>
        <div className="bg-white border border-[#E5E5E5] p-4 group relative">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] uppercase tracking-wider">Services</p>
            <div className="relative">
              <HelpCircle className="w-3.5 h-3.5 text-[#A3A3A3] cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-[#141414] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-medium mb-1">Health Checks</p>
                <p className="text-white/70 mb-2">Shows healthy services out of total monitored services (Database, Storage, Auth, Email, API).</p>
                <p className="text-white/50 text-[10px]">{stats.healthyServices}/{stats.totalServices} services passing health checks.</p>
              </div>
            </div>
          </div>
          <p className="text-2xl font-serif text-[#141414] mt-1">
            {stats.healthyServices}/{stats.totalServices}
          </p>
        </div>
        <div className={`border p-4 group relative ${
          stats.healthyServices === stats.totalServices 
            ? 'bg-emerald-50 border-emerald-200' 
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between">
            <p className="text-xs text-[#525252] uppercase tracking-wider">Status</p>
            <div className="relative">
              <HelpCircle className={`w-3.5 h-3.5 cursor-help ${
                stats.healthyServices === stats.totalServices ? 'text-emerald-400' : 'text-amber-500'
              }`} />
              <div className="absolute right-0 top-6 w-64 p-3 bg-[#141414] text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <p className="font-medium mb-1">Overall System Status</p>
                {stats.healthyServices === stats.totalServices ? (
                  <p className="text-white/70">All systems operational. No action required.</p>
                ) : (
                  <>
                    <p className="text-amber-300 mb-2">⚠️ {stats.totalServices - stats.healthyServices} service(s) need attention.</p>
                    <p className="text-white/70">Check the System Health tab to see which services are failing and take corrective action.</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <p className={`text-2xl font-serif mt-1 ${
            stats.healthyServices === stats.totalServices 
              ? 'text-emerald-700' 
              : 'text-amber-700'
          }`}>
            {stats.healthyServices === stats.totalServices ? 'All Healthy' : 'Degraded'}
          </p>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-[#E5E5E5]">
        <div className="flex gap-0">
          {[
            { key: 'settings', label: 'Settings' },
            { key: 'maintenance', label: 'Maintenance' },
            { key: 'health', label: 'System Health' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-[#141414]'
                  : 'text-[#737373] hover:text-[#525252]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div
                  layoutId="settingsTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#141414]"
                />
              )}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
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
                            <div
                              key={setting.id}
                              className="px-4 py-3 flex items-center justify-between hover:bg-[#FAFAFA] transition-colors"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-[#141414]">{setting.name}</p>
                                {setting.description && (
                                  <p className="text-xs text-[#737373] mt-0.5">{setting.description}</p>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <code className="text-xs text-[#737373] bg-[#F5F5F7] px-1.5 py-0.5">
                                    {setting.key}
                                  </code>
                                  {setting.isReadonly && (
                                    <span className="text-[10px] text-[#A3A3A3] uppercase">Read-only</span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-3 ml-4">
                                <div className="text-right">
                                  {setting.isSensitive ? (
                                    <span className="text-sm text-[#A3A3A3]">••••••••</span>
                                  ) : (
                                    <span className="text-sm text-[#141414] font-mono">
                                      {formatSettingValue(setting.value, setting.valueType)}
                                    </span>
                                  )}
                                </div>
                                {!setting.isReadonly && (
                                  <button
                                    onClick={() => setEditingSetting(setting)}
                                    className="p-2 hover:bg-[#E5E5E5] transition-colors"
                                  >
                                    <Pencil className="w-4 h-4 text-[#525252]" />
                                  </button>
                                )}
                              </div>
                            </div>
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
        
        {activeTab === 'maintenance' && (
          <motion.div
            key="maintenance"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Current Status */}
            <div className={`p-6 border ${
              maintenance 
                ? 'bg-amber-50 border-amber-200' 
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 border ${
                    maintenance ? 'border-amber-300' : 'border-emerald-300'
                  }`}>
                    {maintenance ? (
                      <AlertTriangle className="w-6 h-6 text-amber-600" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-serif text-xl ${
                      maintenance ? 'text-amber-800' : 'text-emerald-800'
                    }`}>
                      {maintenance ? 'Maintenance Mode Active' : 'System Operational'}
                    </h3>
                    <p className={`text-sm ${
                      maintenance ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {maintenance 
                        ? `Started ${new Date(maintenance.startsAt).toLocaleString()}`
                        : 'All systems are running normally'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowMaintenanceModal(true)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    maintenance
                      ? 'bg-amber-600 text-white hover:bg-amber-700'
                      : 'bg-[#141414] text-white hover:bg-black'
                  }`}
                >
                  {maintenance ? 'End Maintenance' : 'Enable Maintenance'}
                </button>
              </div>
            </div>
            
            {/* Info */}
            <div className="bg-white border border-[#E5E5E5] p-6">
              <h3 className="font-medium text-[#141414] mb-3">About Maintenance Mode</h3>
              <ul className="space-y-2 text-sm text-[#525252]">
                <li className="flex items-start gap-2">
                  <span className="text-[#141414]">•</span>
                  Users will see a maintenance banner when enabled
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414]">•</span>
                  Admins can still access the platform during maintenance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414]">•</span>
                  Use for deployments, database migrations, or emergency fixes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#141414]">•</span>
                  All maintenance events are logged to the audit trail
                </li>
              </ul>
            </div>
          </motion.div>
        )}
        
        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Actions */}
            <div className="flex justify-end">
              <button
                onClick={runHealthChecks}
                disabled={isRunningHealthCheck}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#141414] text-white text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
              >
                {isRunningHealthCheck ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                Run Health Checks
              </button>
            </div>
            
            {/* Health Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {health.map((check) => {
                const statusConfig = HEALTH_STATUS_CONFIG[check.status] || HEALTH_STATUS_CONFIG.unknown
                const StatusIcon = statusConfig.icon
                
                return (
                  <div
                    key={check.service}
                    className={`p-4 border ${statusConfig.bg} ${
                      check.status === 'healthy' ? 'border-emerald-200' :
                      check.status === 'degraded' ? 'border-amber-200' :
                      check.status === 'down' ? 'border-red-200' :
                      'border-[#E5E5E5]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                        <div>
                          <h4 className="font-medium text-[#141414] capitalize">{check.service}</h4>
                          <p className={`text-sm capitalize ${statusConfig.color}`}>
                            {check.status}
                          </p>
                        </div>
                      </div>
                      {check.responseTimeMs !== null && (
                        <span className="text-xs text-[#737373]">
                          {check.responseTimeMs}ms
                        </span>
                      )}
                    </div>
                    {check.errorMessage && (
                      <p className="text-xs text-red-600 mt-2 bg-red-50 p-2">
                        {check.errorMessage}
                      </p>
                    )}
                    <p className="text-xs text-[#A3A3A3] mt-2">
                      Last checked: {new Date(check.lastCheckAt).toLocaleString()}
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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

function formatSettingValue(value: unknown, type: string): string {
  if (value === null || value === undefined) return '—'
  if (type === 'boolean') return value ? 'true' : 'false'
  if (type === 'array') return Array.isArray(value) ? value.join(', ') : String(value)
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
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
        body: JSON.stringify({
          key: setting.key,
          value: parsedValue,
        }),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Update error:', error)
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
            <label className="block text-sm font-medium text-[#141414] mb-1">
              {setting.name}
            </label>
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
            
            <p className="text-xs text-[#A3A3A3] mt-1">
              Type: {setting.valueType}
              {setting.valueType === 'array' && ' (comma-separated)'}
            </p>
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
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
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
        body: JSON.stringify({
          enabled: !isActive,
          ...(!isActive && formData),
        }),
      })
      
      if (response.ok) {
        router.refresh()
        onClose()
      }
    } catch (error) {
      console.error('Maintenance toggle error:', error)
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
                  <option value="info">Info (Blue)</option>
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
                  : 'bg-amber-600 text-white hover:bg-amber-700'
              }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isActive ? (
                'End Maintenance'
              ) : (
                'Enable Maintenance'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}
