'use server'

import { 
  suspendUser, 
  reactivateUser, 
  updateUserPlan, 
  updateUserRole 
} from '@/server/admin/users'
import type { UserRole } from '@/lib/admin/types'

export async function suspendUserAction(userId: string, reason: string) {
  try {
    await suspendUser(userId, reason)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to suspend user' }
  }
}

export async function reactivateUserAction(userId: string) {
  try {
    await reactivateUser(userId)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to reactivate user' }
  }
}

export async function updateUserPlanAction(userId: string, plan: string) {
  try {
    await updateUserPlan(userId, plan)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update plan' }
  }
}

export async function updateUserRoleAction(userId: string, role: string) {
  try {
    await updateUserRole(userId, role as UserRole)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to update role' }
  }
}
