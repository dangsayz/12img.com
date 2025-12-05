'use client'

import * as React from 'react'
import { cn } from '@/lib/utils/cn'

interface SwitchProps {
  id?: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
}

export function Switch({
  id,
  checked,
  onCheckedChange,
  disabled,
  className,
}: SwitchProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-black' : 'bg-gray-200',
        className
      )}
    >
      <span
        className={cn(
          'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform',
          checked ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  )
}
