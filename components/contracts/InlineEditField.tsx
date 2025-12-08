'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Pencil, Check, X, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface InlineEditFieldProps {
  value: string | number | null | undefined
  displayValue?: string
  onSave: (value: string | number | null) => Promise<{ success: boolean; error?: string }>
  type?: 'text' | 'number' | 'date' | 'select' | 'currency' | 'percentage'
  options?: { value: string; label: string }[]
  placeholder?: string
  label?: string
  suffix?: string
  prefix?: string
  min?: number
  max?: number
  className?: string
  disabled?: boolean
  dark?: boolean
}

export function InlineEditField({
  value,
  displayValue,
  onSave,
  type = 'text',
  options,
  placeholder = 'Not set',
  label,
  suffix,
  prefix,
  min,
  max,
  className = '',
  disabled = false,
  dark = false,
}: InlineEditFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement>(null)

  // Format value for display
  const getDisplayValue = () => {
    if (displayValue !== undefined) return displayValue
    if (value === null || value === undefined || value === '') return placeholder
    
    if (type === 'currency') {
      return `$${Number(value).toLocaleString()}`
    }
    if (type === 'percentage') {
      return `${value}%`
    }
    if (type === 'date' && typeof value === 'string') {
      const date = new Date(value)
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    }
    if (type === 'select' && options) {
      const option = options.find(o => o.value === value)
      return option?.label || String(value)
    }
    return String(value)
  }

  // Initialize edit value when entering edit mode
  useEffect(() => {
    if (isEditing) {
      if (type === 'currency' || type === 'number') {
        setEditValue(value !== null && value !== undefined ? String(value) : '')
      } else if (type === 'percentage') {
        setEditValue(value !== null && value !== undefined ? String(value) : '')
      } else {
        setEditValue(value !== null && value !== undefined ? String(value) : '')
      }
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [isEditing, value, type])

  const handleStartEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setError(null)
  }

  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
  }

  const handleSave = () => {
    setError(null)
    
    startTransition(async () => {
      let saveValue: string | number | null = editValue
      
      // Convert to appropriate type
      if (type === 'number' || type === 'currency' || type === 'percentage') {
        if (editValue === '' || editValue === null) {
          saveValue = null
        } else {
          const num = Number(editValue)
          if (isNaN(num)) {
            setError('Please enter a valid number')
            return
          }
          if (min !== undefined && num < min) {
            setError(`Value must be at least ${min}`)
            return
          }
          if (max !== undefined && num > max) {
            setError(`Value must be at most ${max}`)
            return
          }
          saveValue = num
        }
      } else if (editValue === '') {
        saveValue = null
      }
      
      const result = await onSave(saveValue)
      
      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || 'Failed to save')
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const isEmpty = value === null || value === undefined || value === ''

  return (
    <div className={`group relative ${className}`}>
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-3"
          >
            {label && (
              <span className="text-xs text-stone-400 uppercase tracking-wider shrink-0">
                {label}
              </span>
            )}
            <div className={`flex items-center gap-2 flex-1 ${dark ? 'bg-white/10 backdrop-blur-sm' : 'bg-white'} rounded-xl p-1 ring-2 ${dark ? 'ring-white/20' : 'ring-stone-900/10'} shadow-lg`}>
              {prefix && <span className={`pl-2 ${dark ? 'text-white/60' : 'text-stone-400'} font-medium`}>{prefix}</span>}
              {type === 'select' && options ? (
                <select
                  ref={inputRef as React.RefObject<HTMLSelectElement>}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`flex-1 px-3 py-2.5 text-sm font-medium rounded-lg focus:outline-none transition-colors ${
                    dark 
                      ? 'bg-white text-stone-900' 
                      : 'bg-stone-50 text-stone-900 focus:bg-white'
                  }`}
                >
                  {options.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  type={type === 'date' ? 'date' : type === 'number' || type === 'currency' || type === 'percentage' ? 'number' : 'text'}
                  value={editValue}
                  onChange={e => setEditValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  min={min}
                  max={max}
                  step={type === 'currency' ? '0.01' : type === 'percentage' ? '1' : undefined}
                  placeholder={placeholder}
                  className={`flex-1 min-w-0 px-3 py-2.5 text-sm font-medium rounded-lg focus:outline-none transition-colors ${
                    dark 
                      ? 'bg-white text-stone-900 placeholder:text-stone-400' 
                      : 'bg-stone-50 text-stone-900 placeholder:text-stone-400 focus:bg-white'
                  }`}
                />
              )}
              {suffix && <span className={`pr-2 ${dark ? 'text-white/60' : 'text-stone-400'} font-medium`}>{suffix}</span>}
              
              <div className="flex items-center gap-1 pr-1">
                <button
                  onClick={handleSave}
                  disabled={isPending}
                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                    dark
                      ? 'bg-white text-stone-900 hover:bg-stone-100 shadow-sm'
                      : 'bg-stone-900 text-white hover:bg-stone-800 shadow-sm'
                  }`}
                >
                  {isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isPending}
                  className={`p-2 rounded-lg transition-all disabled:opacity-50 ${
                    dark
                      ? 'bg-white/10 text-white hover:bg-white/20'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {error && (
              <span className="absolute -bottom-6 left-0 text-xs text-red-500 font-medium">
                {error}
              </span>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="display"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleStartEdit}
            disabled={disabled}
            className={`
              flex items-center gap-2 text-left w-full
              ${disabled ? 'cursor-default' : 'cursor-pointer'}
              ${!disabled ? (dark ? 'hover:bg-white/10' : 'hover:bg-stone-50') + ' -mx-2 px-2 py-1 rounded-lg transition-colors' : ''}
            `}
          >
            {label && (
              <span className={`text-xs uppercase tracking-wider shrink-0 ${dark ? 'text-stone-500' : 'text-stone-400'}`}>
                {label}
              </span>
            )}
            <span className={`flex-1 ${isEmpty ? (dark ? 'text-stone-500 italic' : 'text-stone-400 italic') : ''}`}>
              {prefix && !isEmpty && <span className={dark ? 'text-stone-400' : 'text-stone-500'}>{prefix}</span>}
              {getDisplayValue()}
              {suffix && !isEmpty && <span className={dark ? 'text-stone-400' : 'text-stone-500'}>{suffix}</span>}
            </span>
            {!disabled && (
              <Pencil className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ${dark ? 'text-white/60' : 'text-stone-400'}`} />
            )}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}
