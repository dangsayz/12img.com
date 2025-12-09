'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { Pencil, Check } from 'lucide-react'
import { updateGallery } from '@/server/actions/gallery.actions'

interface EditableTitleProps {
  galleryId: string
  initialTitle: string
  currentSlug?: string
  className?: string
  onTitleChange?: (newTitle: string) => void
}

export function EditableTitle({ galleryId, initialTitle, currentSlug, className = '', onTitleChange }: EditableTitleProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(initialTitle)
  const [savedTitle, setSavedTitle] = useState(initialTitle)
  const [isPending, startTransition] = useTransition()
  const [showSaved, setShowSaved] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    const trimmed = title.trim()
    if (!trimmed || trimmed === savedTitle) {
      setTitle(savedTitle)
      setIsEditing(false)
      return
    }

    startTransition(async () => {
      const formData = new FormData()
      formData.set('title', trimmed)
      const result = await updateGallery(galleryId, formData)
      if (result.error) {
        setTitle(savedTitle)
      } else {
        // Update local state, no redirect needed
        setSavedTitle(trimmed)
        onTitleChange?.(trimmed)
        // Show saved indicator briefly
        setShowSaved(true)
        setTimeout(() => setShowSaved(false), 2000)
      }
      setIsEditing(false)
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      setTitle(savedTitle)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          disabled={isPending}
          maxLength={100}
          className={`bg-transparent border-b-2 border-gray-900 outline-none font-semibold tracking-tight ${className} ${
            isPending ? 'opacity-50' : ''
          }`}
          style={{ width: `${Math.max(title.length, 1)}ch` }}
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="p-1 text-gray-400 hover:text-gray-900"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setIsEditing(true)}
        className={`group relative text-left font-semibold tracking-tight ${className}`}
      >
        <span className="border-b-2 border-transparent group-hover:border-gray-300">
          {title}
        </span>
        <Pencil className="inline-block ml-2 w-4 h-4 text-gray-300 opacity-0 group-hover:opacity-100 -translate-y-0.5" />
      </button>
      {showSaved && (
        <span className="text-xs text-stone-500 animate-fade-in">
          Saved
        </span>
      )}
    </div>
  )
}
