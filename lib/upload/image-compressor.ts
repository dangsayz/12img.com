/**
 * Client-Side Image Compression
 * 
 * This is the #1 optimization for upload speed.
 * Pixieset compresses images before upload, reducing a 15MB file to 2-3MB.
 * 
 * We use browser-native APIs for maximum performance:
 * - createImageBitmap() for fast decoding
 * - OffscreenCanvas for GPU-accelerated resizing
 * - canvas.toBlob() for JPEG encoding
 */

export interface CompressionOptions {
  maxWidth: number
  maxHeight: number
  quality: number // 0-1
  preserveExif?: boolean
}

export interface CompressionResult {
  blob: Blob
  width: number
  height: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
}

// Default options optimized for web delivery
export const DEFAULT_COMPRESSION: CompressionOptions = {
  maxWidth: 4096,    // Max dimension - covers 4K displays
  maxHeight: 4096,
  quality: 0.85,     // High quality, good compression
  preserveExif: false,
}

// High quality preset for photographers who want minimal loss
export const HIGH_QUALITY_COMPRESSION: CompressionOptions = {
  maxWidth: 6000,
  maxHeight: 6000,
  quality: 0.92,
  preserveExif: true,
}

/**
 * Compress an image file for faster upload
 * Returns the original file if compression wouldn't help
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = DEFAULT_COMPRESSION
): Promise<CompressionResult> {
  const originalSize = file.size
  
  // Skip compression for small files (< 500KB) or non-JPEG/PNG
  if (originalSize < 500 * 1024) {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    }
  }
  
  // Skip for formats we can't compress well
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    }
  }

  try {
    // Use createImageBitmap for fast, off-main-thread decoding
    const bitmap = await createImageBitmap(file)
    const { width: origWidth, height: origHeight } = bitmap
    
    // Calculate target dimensions maintaining aspect ratio
    let targetWidth = origWidth
    let targetHeight = origHeight
    
    if (origWidth > options.maxWidth || origHeight > options.maxHeight) {
      const ratio = Math.min(
        options.maxWidth / origWidth,
        options.maxHeight / origHeight
      )
      targetWidth = Math.round(origWidth * ratio)
      targetHeight = Math.round(origHeight * ratio)
    }
    
    // Use OffscreenCanvas if available (faster, works in workers)
    let canvas: OffscreenCanvas | HTMLCanvasElement
    let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null
    
    if (typeof OffscreenCanvas !== 'undefined') {
      canvas = new OffscreenCanvas(targetWidth, targetHeight)
      ctx = canvas.getContext('2d')
    } else {
      canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      ctx = canvas.getContext('2d')
    }
    
    if (!ctx) {
      throw new Error('Failed to get canvas context')
    }
    
    // Draw with high-quality scaling
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)
    
    // Clean up bitmap
    bitmap.close()
    
    // Convert to blob
    let blob: Blob
    
    if (canvas instanceof OffscreenCanvas) {
      blob = await canvas.convertToBlob({
        type: 'image/jpeg',
        quality: options.quality,
      })
    } else {
      blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
          'image/jpeg',
          options.quality
        )
      })
    }
    
    const compressedSize = blob.size
    
    // Only use compressed version if it's actually smaller
    if (compressedSize >= originalSize * 0.95) {
      return {
        blob: file,
        width: origWidth,
        height: origHeight,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
      }
    }
    
    return {
      blob,
      width: targetWidth,
      height: targetHeight,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize,
    }
  } catch (error) {
    console.warn('[Compressor] Failed to compress, using original:', error)
    return {
      blob: file,
      width: 0,
      height: 0,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
    }
  }
}

/**
 * Batch compress multiple images with concurrency control
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = DEFAULT_COMPRESSION,
  concurrency: number = 4,
  onProgress?: (completed: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []
  const executing: Promise<void>[] = []
  let completed = 0
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    
    const task = compressImage(file, options).then(result => {
      results[i] = result
      completed++
      onProgress?.(completed, files.length)
    })
    
    executing.push(task)
    
    if (executing.length >= concurrency) {
      await Promise.race(executing)
      // Remove completed tasks
      const completedIndex = executing.findIndex(p => 
        p === task || (p as any)._completed
      )
      if (completedIndex >= 0) {
        executing.splice(completedIndex, 1)
      }
    }
  }
  
  await Promise.all(executing)
  return results
}

/**
 * Get image dimensions without loading full image
 * Uses createImageBitmap for efficiency
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  const bitmap = await createImageBitmap(file)
  const { width, height } = bitmap
  bitmap.close()
  return { width, height }
}
