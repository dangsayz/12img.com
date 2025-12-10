/**
 * Web Worker for Parallel Image Compression
 * 
 * STATE-OF-THE-ART TECHNIQUE: Offload compression to separate threads
 * This allows compressing 4-8 images simultaneously without blocking UI
 * 
 * Key benefits:
 * 1. Main thread stays responsive (no jank)
 * 2. True parallel processing across CPU cores
 * 3. Can compress while uploading (pipeline parallelism)
 */

// Worker message types
export interface CompressionWorkerMessage {
  type: 'compress'
  id: string
  imageData: ArrayBuffer
  mimeType: string
  options: {
    maxWidth: number
    maxHeight: number
    quality: number
  }
}

export interface CompressionWorkerResult {
  type: 'result'
  id: string
  success: boolean
  blob?: Blob
  width?: number
  height?: number
  originalSize: number
  compressedSize: number
  compressionRatio: number
  error?: string
}

// This is the worker code that runs in a separate thread
const workerCode = `
self.onmessage = async function(e) {
  const { type, id, imageData, mimeType, options } = e.data;
  
  if (type !== 'compress') return;
  
  const originalSize = imageData.byteLength;
  
  try {
    // Create blob from array buffer
    const blob = new Blob([imageData], { type: mimeType });
    
    // Skip small files
    if (originalSize < 500 * 1024) {
      self.postMessage({
        type: 'result',
        id,
        success: true,
        blob,
        width: 0,
        height: 0,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1
      });
      return;
    }
    
    // Decode image using createImageBitmap (works in workers!)
    const bitmap = await createImageBitmap(blob);
    const { width: origWidth, height: origHeight } = bitmap;
    
    // Calculate target dimensions
    let targetWidth = origWidth;
    let targetHeight = origHeight;
    
    if (origWidth > options.maxWidth || origHeight > options.maxHeight) {
      const ratio = Math.min(
        options.maxWidth / origWidth,
        options.maxHeight / origHeight
      );
      targetWidth = Math.round(origWidth * ratio);
      targetHeight = Math.round(origHeight * ratio);
    }
    
    // Use OffscreenCanvas for GPU-accelerated rendering
    const canvas = new OffscreenCanvas(targetWidth, targetHeight);
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }
    
    // High-quality scaling
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
    
    // Release bitmap memory
    bitmap.close();
    
    // Convert to JPEG blob
    const compressedBlob = await canvas.convertToBlob({
      type: 'image/jpeg',
      quality: options.quality
    });
    
    const compressedSize = compressedBlob.size;
    
    // Only use compressed if actually smaller
    if (compressedSize >= originalSize * 0.95) {
      self.postMessage({
        type: 'result',
        id,
        success: true,
        blob,
        width: origWidth,
        height: origHeight,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1
      });
      return;
    }
    
    self.postMessage({
      type: 'result',
      id,
      success: true,
      blob: compressedBlob,
      width: targetWidth,
      height: targetHeight,
      originalSize,
      compressedSize,
      compressionRatio: originalSize / compressedSize
    });
    
  } catch (error) {
    // Return original on error
    const blob = new Blob([imageData], { type: mimeType });
    self.postMessage({
      type: 'result',
      id,
      success: true,
      blob,
      width: 0,
      height: 0,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      error: error.message
    });
  }
};
`

/**
 * Compression Worker Pool
 * 
 * Manages a pool of Web Workers for parallel compression
 * Automatically scales based on CPU cores
 */
export class CompressionWorkerPool {
  private workers: Worker[] = []
  private taskQueue: Map<string, {
    resolve: (result: CompressionWorkerResult) => void
    reject: (error: Error) => void
  }> = new Map()
  private availableWorkers: Worker[] = []
  private pendingTasks: Array<{
    id: string
    imageData: ArrayBuffer
    mimeType: string
    options: CompressionWorkerMessage['options']
  }> = []
  
  constructor(poolSize?: number) {
    // Default to number of CPU cores, max 8
    const size = poolSize ?? Math.min(navigator.hardwareConcurrency || 4, 8)
    
    // Create worker blob URL
    const blob = new Blob([workerCode], { type: 'application/javascript' })
    const workerUrl = URL.createObjectURL(blob)
    
    // Initialize worker pool
    for (let i = 0; i < size; i++) {
      const worker = new Worker(workerUrl)
      
      worker.onmessage = (e: MessageEvent<CompressionWorkerResult>) => {
        const result = e.data
        const task = this.taskQueue.get(result.id)
        
        if (task) {
          this.taskQueue.delete(result.id)
          task.resolve(result)
        }
        
        // Return worker to pool and process next task
        this.availableWorkers.push(worker)
        this.processNextTask()
      }
      
      worker.onerror = (error) => {
        console.error('[CompressionWorker] Error:', error)
      }
      
      this.workers.push(worker)
      this.availableWorkers.push(worker)
    }
  }
  
  /**
   * Compress an image file using a worker
   */
  async compress(
    file: File,
    options: CompressionWorkerMessage['options']
  ): Promise<CompressionWorkerResult> {
    const id = `compress-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const imageData = await file.arrayBuffer()
    
    return new Promise((resolve, reject) => {
      this.taskQueue.set(id, { resolve, reject })
      
      this.pendingTasks.push({
        id,
        imageData,
        mimeType: file.type,
        options
      })
      
      this.processNextTask()
    })
  }
  
  /**
   * Compress multiple files in parallel
   */
  async compressBatch(
    files: File[],
    options: CompressionWorkerMessage['options'],
    onProgress?: (completed: number, total: number) => void
  ): Promise<CompressionWorkerResult[]> {
    let completed = 0
    
    const results = await Promise.all(
      files.map(async (file) => {
        const result = await this.compress(file, options)
        completed++
        onProgress?.(completed, files.length)
        return result
      })
    )
    
    return results
  }
  
  private processNextTask() {
    if (this.pendingTasks.length === 0 || this.availableWorkers.length === 0) {
      return
    }
    
    const worker = this.availableWorkers.pop()!
    const task = this.pendingTasks.shift()!
    
    worker.postMessage({
      type: 'compress',
      id: task.id,
      imageData: task.imageData,
      mimeType: task.mimeType,
      options: task.options
    }, [task.imageData]) // Transfer ownership for zero-copy
  }
  
  /**
   * Get pool statistics
   */
  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      pendingTasks: this.pendingTasks.length,
      activeTasks: this.taskQueue.size
    }
  }
  
  /**
   * Terminate all workers
   */
  destroy() {
    this.workers.forEach(w => w.terminate())
    this.workers = []
    this.availableWorkers = []
    this.taskQueue.clear()
    this.pendingTasks = []
  }
}

// Singleton instance
let workerPool: CompressionWorkerPool | null = null

export function getCompressionWorkerPool(): CompressionWorkerPool {
  if (!workerPool) {
    workerPool = new CompressionWorkerPool()
  }
  return workerPool
}
