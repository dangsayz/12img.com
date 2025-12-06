'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, CheckCircle, Shield, CreditCard, Loader2 } from 'lucide-react'
import { 
  suspendUserAction, 
  reactivateUserAction, 
  updateUserPlanAction, 
  updateUserRoleAction 
} from './actions'
import type { AdminUserWithUsage } from '@/lib/admin/types'

interface Props {
  user: AdminUserWithUsage
}

export function UserActions({ user }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const handleSuspend = () => {
    if (!suspendReason.trim()) {
      setError('Please provide a reason')
      return
    }
    setError(null)
    
    startTransition(async () => {
      const result = await suspendUserAction(user.id, suspendReason)
      if (result.error) {
        setError(result.error)
      } else {
        setShowSuspendModal(false)
        setSuspendReason('')
        router.refresh()
      }
    })
  }
  
  const handleReactivate = () => {
    setError(null)
    startTransition(async () => {
      const result = await reactivateUserAction(user.id)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }
  
  const handlePlanChange = (plan: string) => {
    setError(null)
    startTransition(async () => {
      const result = await updateUserPlanAction(user.id, plan)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }
  
  const handleRoleChange = (role: string) => {
    setError(null)
    startTransition(async () => {
      const result = await updateUserRoleAction(user.id, role)
      if (result.error) {
        setError(result.error)
      } else {
        router.refresh()
      }
    })
  }
  
  return (
    <div className="space-y-4">
      {/* Actions Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Actions</h2>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}
        
        {/* Plan Selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <CreditCard className="w-4 h-4" />
            Change Plan
          </label>
          <select
            value={user.plan || 'free'}
            onChange={(e) => handlePlanChange(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"
          >
            <option value="free">Free</option>
            <option value="essential">Essential</option>
            <option value="pro">Pro</option>
            <option value="studio">Studio</option>
            <option value="elite">Elite</option>
          </select>
        </div>
        
        {/* Role Selector */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
            <Shield className="w-4 h-4" />
            Change Role
          </label>
          <select
            value={user.role || 'user'}
            onChange={(e) => handleRoleChange(e.target.value)}
            disabled={isPending}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 disabled:opacity-50"
          >
            <option value="user">User</option>
            <option value="support">Support</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>
        </div>
        
        {/* Suspend/Reactivate */}
        <div className="pt-4 border-t border-gray-100">
          {user.is_suspended ? (
            <button
              onClick={handleReactivate}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Reactivate Account
            </button>
          ) : (
            <button
              onClick={() => setShowSuspendModal(true)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
            >
              <Ban className="w-4 h-4" />
              Suspend Account
            </button>
          )}
        </div>
      </div>
      
      {/* Suspend Modal */}
      {showSuspendModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Suspend User</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will prevent the user from accessing their account.
            </p>
            <textarea
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Reason for suspension..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
              rows={3}
            />
            {error && (
              <p className="text-sm text-red-600 mt-2">{error}</p>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowSuspendModal(false)
                  setSuspendReason('')
                  setError(null)
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
