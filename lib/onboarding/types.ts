// Onboarding hint system types

export type OnboardingSection = 
  | 'dashboard'
  | 'clients'
  | 'galleries'
  | 'contracts'
  | 'messages'
  | 'settings'
  | 'upload'

export interface HintStep {
  id: string
  targetSelector: string // CSS selector for the element to highlight
  title: string
  description: string
  position: 'top' | 'bottom' | 'left' | 'right' | 'center'
  align?: 'start' | 'center' | 'end'
}

export interface OnboardingFlow {
  section: OnboardingSection
  steps: HintStep[]
}

// Local storage key prefix
export const ONBOARDING_STORAGE_KEY = '12img_onboarding_completed'

// Check if a section's onboarding has been completed
export function hasCompletedOnboarding(section: OnboardingSection): boolean {
  if (typeof window === 'undefined') return true
  const completed = localStorage.getItem(`${ONBOARDING_STORAGE_KEY}_${section}`)
  return completed === 'true'
}

// Mark a section's onboarding as completed
export function markOnboardingComplete(section: OnboardingSection): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${ONBOARDING_STORAGE_KEY}_${section}`, 'true')
}

// Reset onboarding for a section (for testing or user request)
export function resetOnboarding(section: OnboardingSection): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${section}`)
}

// Reset all onboarding
export function resetAllOnboarding(): void {
  if (typeof window === 'undefined') return
  const sections: OnboardingSection[] = [
    'dashboard', 'clients', 'galleries', 'contracts', 'messages', 'settings', 'upload'
  ]
  sections.forEach(section => {
    localStorage.removeItem(`${ONBOARDING_STORAGE_KEY}_${section}`)
  })
}
