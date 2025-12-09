'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Pencil, RotateCcw } from 'lucide-react'
import type { ClauseSnapshot } from '@/lib/contracts/types'

interface InlineClauseEditorProps {
  clause: ClauseSnapshot
  isEditable: boolean
  onSave: (clauseId: string, newContent: string) => void
  onCancel?: () => void
}

export function InlineClauseEditor({ 
  clause, 
  isEditable, 
  onSave,
  onCancel 
}: InlineClauseEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(clause.content)
  const [isHovered, setIsHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const originalContent = useRef(clause.content)

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [editedContent, isEditing])

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Place cursor at end
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length
      )
    }
  }, [isEditing])

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }, [editedContent])

  const handleStartEdit = () => {
    if (!isEditable) return
    setIsEditing(true)
    originalContent.current = clause.content
    setEditedContent(clause.content)
  }

  const handleSave = () => {
    if (editedContent.trim() !== clause.content.trim()) {
      onSave(clause.id, editedContent)
    }
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditedContent(originalContent.current)
    setIsEditing(false)
    onCancel?.()
  }

  const handleReset = () => {
    setEditedContent(originalContent.current)
  }

  const hasChanges = editedContent.trim() !== originalContent.current.trim()

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="editing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="relative"
          >
            {/* Editing State */}
            <div className="relative rounded-xl border-2 border-stone-900 bg-white shadow-lg overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-500">
                    Editing: {clause.title}
                  </span>
                  {hasChanges && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                      Unsaved
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {hasChanges && (
                    <button
                      onClick={handleReset}
                      className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                      title="Reset changes"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={handleCancel}
                    className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Cancel (Esc)"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-stone-900 text-white rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Save (⌘+Enter)"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Save
                  </button>
                </div>
              </div>
              
              {/* Textarea */}
              <textarea
                ref={textareaRef}
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full min-h-[120px] p-4 text-sm text-stone-700 leading-relaxed resize-none focus:outline-none"
                placeholder="Enter clause content..."
              />
              
              {/* Footer hint */}
              <div className="px-3 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400">
                  ⌘+Enter to save • Esc to cancel
                </span>
                <span className="text-[10px] text-stone-400">
                  {editedContent.length} characters
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="viewing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={handleStartEdit}
            className={`
              relative rounded-xl transition-all duration-200
              ${isEditable ? 'cursor-pointer' : ''}
              ${isEditable && isHovered ? 'bg-stone-50 ring-2 ring-stone-200 ring-inset' : ''}
            `}
          >
            {/* Content */}
            <div 
              className="text-sm text-stone-600 leading-relaxed p-4"
              dangerouslySetInnerHTML={{ __html: clause.content }}
            />
            
            {/* Edit hint overlay */}
            {isEditable && isHovered && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-stone-900 text-white text-[10px] font-medium rounded-md shadow-lg"
              >
                <Pencil className="w-3 h-3" />
                Click to edit
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Compact inline editor for preview mode - edits directly in the rendered view
interface PreviewInlineEditorProps {
  clause: ClauseSnapshot
  isEditable: boolean
  onSave: (clauseId: string, newContent: string) => void
}

export function PreviewInlineEditor({ 
  clause, 
  isEditable, 
  onSave 
}: PreviewInlineEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(clause.content)
  const [isHovered, setIsHovered] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current && isEditing) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
      textareaRef.current.focus()
    }
  }, [editedContent, isEditing])

  const handleSave = () => {
    if (editedContent.trim() !== clause.content.trim()) {
      onSave(clause.id, editedContent)
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setEditedContent(clause.content)
      setIsEditing(false)
    } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSave()
    }
  }

  if (!isEditable) {
    return (
      <div 
        className="text-sm text-stone-600 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: clause.content }}
      />
    )
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <AnimatePresence mode="wait">
        {isEditing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative"
          >
            <textarea
              ref={textareaRef}
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-full min-h-[80px] p-3 text-sm text-stone-700 leading-relaxed border-2 border-stone-900 rounded-lg resize-none focus:outline-none bg-white"
            />
            <div className="absolute bottom-2 right-2 text-[10px] text-stone-400">
              ⌘+Enter to save
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditing(true)}
            className={`
              relative cursor-pointer rounded-lg transition-all duration-150 -mx-2 px-2 py-1
              ${isHovered ? 'bg-amber-50/50 ring-1 ring-amber-200' : ''}
            `}
          >
            <div 
              className="text-sm text-stone-600 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: clause.content }}
            />
            {isHovered && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute -top-1 -right-1 w-6 h-6 bg-stone-900 rounded-full flex items-center justify-center shadow-lg"
              >
                <Pencil className="w-3 h-3 text-white" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
