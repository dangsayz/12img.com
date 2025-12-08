'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Clock, ChevronDown } from 'lucide-react'

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  suggestions: string[]
  placeholder?: string
  label?: string
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  suggestions,
  placeholder = 'Start typing...',
  label,
  className = '',
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([])
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Filter suggestions based on input
  useEffect(() => {
    if (!value.trim()) {
      setFilteredSuggestions([])
      return
    }

    const query = value.toLowerCase()
    const matches = suggestions.filter((s) =>
      s.toLowerCase().includes(query)
    )
    setFilteredSuggestions(matches)
    setHighlightedIndex(-1)
  }, [value, suggestions])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
    setIsOpen(true)
  }

  const handleSelect = useCallback((suggestion: string) => {
    onChange(suggestion)
    setIsOpen(false)
    inputRef.current?.blur()
  }, [onChange])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true)
        setFilteredSuggestions(suggestions.slice(0, 5))
      }
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          handleSelect(filteredSuggestions[highlightedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        break
    }
  }

  const showDropdown = isOpen && filteredSuggestions.length > 0

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {label && (
        <label className="block text-xs uppercase tracking-wider text-stone-400 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (value.trim() && filteredSuggestions.length > 0) {
              setIsOpen(true)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-4 py-3 border border-stone-200 focus:border-stone-400 focus:ring-0 text-stone-900 placeholder:text-stone-300 pr-10"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(!isOpen)
              if (!isOpen) {
                setFilteredSuggestions(suggestions.slice(0, 8))
              }
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-1 bg-white border border-stone-200 shadow-lg max-h-48 overflow-y-auto"
          >
            <div className="py-1">
              <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Previously used
              </div>
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSelect(suggestion)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`w-full px-3 py-2 text-left text-sm flex items-center gap-2 transition-colors ${
                    highlightedIndex === index
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-stone-400 flex-shrink-0" />
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
