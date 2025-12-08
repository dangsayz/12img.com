'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  MeasuringStrategy,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Check, Move } from 'lucide-react'
import { updateImagePositions } from '@/server/actions/upload.actions'

interface GalleryImage {
  id: string
  thumbnailUrl: string
  previewUrl: string
  originalUrl: string
  width: number | null
  height: number | null
}

interface SortableImageProps {
  image: GalleryImage
  index: number
  isSelected: boolean
  isSelecting: boolean
  isDragActive: boolean
  onSelect: () => void
}

function SortableImage({ image, index, isSelected, isSelecting, isDragActive, onSelect }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isSorting,
  } = useSortable({ 
    id: image.id,
    transition: {
      duration: 200,
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isSorting ? transition : undefined,
  }

  const imgSrc = image.thumbnailUrl || image.previewUrl

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={false}
      animate={{
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging 
          ? '0 25px 50px -12px rgba(0, 0, 0, 0.25)' 
          : '0 0 0 0 rgba(0, 0, 0, 0)',
        zIndex: isDragging ? 50 : 0,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`
        relative aspect-square bg-stone-100 overflow-hidden group touch-none
        ${isDragging ? 'ring-2 ring-stone-900' : ''}
        ${isSelecting && isSelected ? 'ring-2 ring-stone-900' : ''}
        ${isDragActive && !isDragging ? 'opacity-80' : ''}
      `}
    >
      {imgSrc && (
        <Image
          src={imgSrc}
          alt=""
          fill
          className={`object-cover transition-transform duration-200 ${isDragging ? 'scale-105' : ''}`}
          sizes="(max-width: 768px) 25vw, 20vw"
          draggable={false}
          priority={index < 12}
        />
      )}

      {/* Position number badge - shows during reorder mode */}
      <div className={`
        absolute top-1.5 right-1.5 min-w-[24px] h-6 px-1.5 
        bg-black/70 backdrop-blur-sm rounded text-white text-xs font-medium
        flex items-center justify-center
        transition-opacity duration-150
        ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
      `}>
        {index + 1}
      </div>

      {/* Full-card drag handle - entire card is draggable */}
      {!isSelecting && (
        <div
          {...attributes}
          {...listeners}
          className="absolute inset-0 cursor-grab active:cursor-grabbing"
          aria-label={`Drag to reorder image ${index + 1}`}
        >
          {/* Visual drag indicator - center icon on mobile, corner on desktop */}
          <div className={`
            absolute 
            md:top-2 md:left-2 md:right-auto md:bottom-auto
            inset-0 md:inset-auto
            md:w-8 md:h-8 
            bg-black/0 md:bg-white/90 md:backdrop-blur-sm md:rounded 
            flex items-center justify-center 
            transition-all duration-150
            ${isDragActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}>
            <Move className="w-5 h-5 text-white md:text-stone-600 drop-shadow-lg md:drop-shadow-none" />
          </div>
        </div>
      )}

      {/* Selection checkbox */}
      {isSelecting && (
        <button
          onClick={onSelect}
          className={`absolute top-2 left-2 w-7 h-7 border-2 flex items-center justify-center transition-colors rounded ${
            isSelected
              ? 'bg-stone-900 border-stone-900'
              : 'bg-white/90 border-stone-400 hover:border-stone-600'
          }`}
        >
          {isSelected && <Check className="w-4 h-4 text-white" />}
        </button>
      )}

      {/* Subtle hover overlay */}
      <div className={`
        absolute inset-0 pointer-events-none transition-colors duration-150
        ${isDragging ? 'bg-black/5' : 'bg-black/0 group-hover:bg-black/5'}
      `} />
    </motion.div>
  )
}

// Overlay shown while dragging - enhanced with scale and rotation
function DragOverlayImage({ image, index }: { image: GalleryImage; index: number }) {
  const imgSrc = image.thumbnailUrl || image.previewUrl

  return (
    <motion.div 
      initial={{ scale: 1, rotate: 0 }}
      animate={{ scale: 1.08, rotate: 2 }}
      className="aspect-square bg-stone-100 overflow-hidden shadow-2xl rounded-lg ring-2 ring-stone-900"
    >
      {imgSrc && (
        <Image
          src={imgSrc}
          alt=""
          width={200}
          height={200}
          className="object-cover w-full h-full"
          draggable={false}
        />
      )}
      {/* Position badge on overlay */}
      <div className="absolute top-2 right-2 min-w-[24px] h-6 px-1.5 bg-stone-900 rounded text-white text-xs font-bold flex items-center justify-center">
        {index + 1}
      </div>
    </motion.div>
  )
}

interface SortableImageGridProps {
  galleryId: string
  images: GalleryImage[]
  isSelecting: boolean
  selectedImages: Set<string>
  onSelect: (imageId: string) => void
  onImagesReorder: (images: GalleryImage[]) => void
}

export function SortableImageGrid({
  galleryId,
  images,
  isSelecting,
  selectedImages,
  onSelect,
  onImagesReorder,
}: SortableImageGridProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Touch-friendly sensors with proper delay for mobile
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Reduced for faster response
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 150, // Short delay to distinguish from scroll
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    // Clear any pending success state
    setSaveSuccess(false)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
  }, [])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      setActiveId(null)

      if (!over || active.id === over.id) {
        return
      }

      const oldIndex = images.findIndex((img) => img.id === active.id)
      const newIndex = images.findIndex((img) => img.id === over.id)

      if (oldIndex === -1 || newIndex === -1) {
        return
      }

      // Optimistically update UI
      const newImages = arrayMove(images, oldIndex, newIndex)
      onImagesReorder(newImages)

      // Save to server
      setIsSaving(true)
      try {
        const positions = newImages.map((img, idx) => ({
          imageId: img.id,
          position: idx,
        }))

        const result = await updateImagePositions(galleryId, positions)

        if (!result.success) {
          console.error('Failed to save positions:', result.error)
          // Revert on error
          onImagesReorder(images)
        } else {
          // Show success briefly
          setSaveSuccess(true)
          saveTimeoutRef.current = setTimeout(() => {
            setSaveSuccess(false)
          }, 1500)
        }
      } catch (error) {
        console.error('Failed to save positions:', error)
        // Revert on error
        onImagesReorder(images)
      } finally {
        setIsSaving(false)
      }
    },
    [images, galleryId, onImagesReorder]
  )

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  const activeImage = activeId ? images.find((img) => img.id === activeId) : null
  const activeIndex = activeId ? images.findIndex((img) => img.id === activeId) : -1
  const isDragActive = activeId !== null

  return (
    <div className="relative">
      {/* Status indicator - saving or success */}
      <AnimatePresence>
        {(isSaving || saveSuccess) && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`absolute -top-10 right-0 z-50 flex items-center gap-2 px-3 py-1.5 text-xs rounded-full ${
              saveSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-stone-900 text-white'
            }`}
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3 h-3" />
                Saved
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instruction hint */}
      <AnimatePresence>
        {!isDragActive && images.length > 1 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs text-stone-400 mb-3 text-center"
          >
            Drag images to reorder • Changes save automatically
          </motion.p>
        )}
      </AnimatePresence>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        measuring={{
          droppable: {
            strategy: MeasuringStrategy.Always,
          },
        }}
      >
        <SortableContext items={images.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-1.5">
            {images.map((image, index) => (
              <SortableImage
                key={image.id}
                image={image}
                index={index}
                isSelected={selectedImages.has(image.id)}
                isSelecting={isSelecting}
                isDragActive={isDragActive}
                onSelect={() => onSelect(image.id)}
              />
            ))}
          </div>
        </SortableContext>

        <DragOverlay adjustScale={false} dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}>
          {activeImage ? <DragOverlayImage image={activeImage} index={activeIndex} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}
