/**
 * Pre-flight Optimization
 * 
 * Generates signed URLs ahead of the upload queue so uploads never wait.
 * This is a key optimization - network latency for URL generation is hidden.
 */

import { generateSignedUploadUrls } from '@/server/actions/upload.actions'

interface SignedUrlInfo {
  localId: string
  storagePath: string
  signedUrl: string
  token: string
  expiresAt: number
}

interface PendingFile {
  localId: string
  mimeType: string
  fileSize: number
  originalFilename: string
}

export class PreflightOptimizer {
  private galleryId: string
  private urlCache: Map<string, SignedUrlInfo> = new Map()
  private pendingRequests: Map<string, Promise<SignedUrlInfo>> = new Map()
  private prefetchQueue: PendingFile[] = []
  private isPrefetching = false
  
  // How many URLs to keep ready ahead of uploads
  private readonly prefetchAhead = 20
  // URL expiry buffer (refresh if expiring within 60s)
  private readonly expiryBuffer = 60 * 1000
  
  constructor(galleryId: string) {
    this.galleryId = galleryId
  }
  
  /**
   * Queue files for prefetching signed URLs
   * Call this as soon as files are selected
   */
  queueForPrefetch(files: PendingFile[]): void {
    this.prefetchQueue.push(...files)
    this.startPrefetching()
  }
  
  /**
   * Get a signed URL for a file, using cache if available
   * This should be nearly instant if prefetching is working
   */
  async getSignedUrl(file: PendingFile): Promise<SignedUrlInfo> {
    // Check cache first
    const cached = this.urlCache.get(file.localId)
    if (cached && cached.expiresAt > Date.now() + this.expiryBuffer) {
      return cached
    }
    
    // Check if already being fetched
    const pending = this.pendingRequests.get(file.localId)
    if (pending) {
      return pending
    }
    
    // Need to fetch - do it immediately
    const promise = this.fetchSignedUrl(file)
    this.pendingRequests.set(file.localId, promise)
    
    try {
      const result = await promise
      this.urlCache.set(file.localId, result)
      return result
    } finally {
      this.pendingRequests.delete(file.localId)
    }
  }
  
  /**
   * Get multiple signed URLs in batch (more efficient)
   */
  async getSignedUrlsBatch(files: PendingFile[]): Promise<SignedUrlInfo[]> {
    // Separate cached from uncached
    const results: (SignedUrlInfo | null)[] = files.map(f => {
      const cached = this.urlCache.get(f.localId)
      if (cached && cached.expiresAt > Date.now() + this.expiryBuffer) {
        return cached
      }
      return null
    })
    
    const uncachedFiles = files.filter((_, i) => results[i] === null)
    
    if (uncachedFiles.length > 0) {
      const newUrls = await this.fetchSignedUrlsBatch(uncachedFiles)
      
      // Merge results
      let newUrlIndex = 0
      for (let i = 0; i < results.length; i++) {
        if (results[i] === null) {
          results[i] = newUrls[newUrlIndex++]
          this.urlCache.set(files[i].localId, results[i]!)
        }
      }
    }
    
    return results as SignedUrlInfo[]
  }
  
  /**
   * Background prefetching of signed URLs
   */
  private async startPrefetching(): Promise<void> {
    if (this.isPrefetching) return
    this.isPrefetching = true
    
    try {
      while (this.prefetchQueue.length > 0) {
        // Take a batch from the queue
        const batch = this.prefetchQueue.splice(0, this.prefetchAhead)
        
        // Filter out already cached
        const uncached = batch.filter(f => {
          const cached = this.urlCache.get(f.localId)
          return !cached || cached.expiresAt <= Date.now() + this.expiryBuffer
        })
        
        if (uncached.length > 0) {
          try {
            const urls = await this.fetchSignedUrlsBatch(uncached)
            urls.forEach((url, i) => {
              this.urlCache.set(uncached[i].localId, url)
            })
          } catch (error) {
            console.warn('[Preflight] Batch prefetch failed:', error)
            // Put items back in queue for retry
            this.prefetchQueue.unshift(...uncached)
            await new Promise(r => setTimeout(r, 1000)) // Back off
          }
        }
        
        // Small delay to avoid overwhelming the server
        if (this.prefetchQueue.length > 0) {
          await new Promise(r => setTimeout(r, 50))
        }
      }
    } finally {
      this.isPrefetching = false
    }
  }
  
  private async fetchSignedUrl(file: PendingFile): Promise<SignedUrlInfo> {
    const [result] = await generateSignedUploadUrls({
      galleryId: this.galleryId,
      files: [file],
    })
    
    return {
      ...result,
      expiresAt: Date.now() + 4 * 60 * 1000, // 4 minutes (URLs valid for 5)
    }
  }
  
  private async fetchSignedUrlsBatch(files: PendingFile[]): Promise<SignedUrlInfo[]> {
    const results = await generateSignedUploadUrls({
      galleryId: this.galleryId,
      files,
    })
    
    const expiresAt = Date.now() + 4 * 60 * 1000
    return results.map(r => ({ ...r, expiresAt }))
  }
  
  /**
   * Clear cache (e.g., when upload session ends)
   */
  clear(): void {
    this.urlCache.clear()
    this.pendingRequests.clear()
    this.prefetchQueue = []
  }
  
  /**
   * Get cache stats for debugging
   */
  getStats(): { cached: number; pending: number; queued: number } {
    return {
      cached: this.urlCache.size,
      pending: this.pendingRequests.size,
      queued: this.prefetchQueue.length,
    }
  }
}
