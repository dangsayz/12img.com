/**
 * Adaptive Concurrency Controller
 * 
 * Dynamically adjusts the number of concurrent uploads based on:
 * - Network speed (measured from recent uploads)
 * - Success rate (back off if errors increase)
 * - Browser/device capabilities
 * 
 * This is how Pixieset maintains fast uploads across different network conditions.
 */

export interface ConcurrencyMetrics {
  currentConcurrency: number
  avgUploadSpeed: number // bytes per second
  successRate: number // 0-1
  recentErrors: number
}

export class AdaptiveConcurrencyController {
  private minConcurrency: number
  private maxConcurrency: number
  private currentConcurrency: number
  
  // Metrics tracking
  private recentSpeeds: number[] = []
  private recentResults: boolean[] = []
  private readonly maxSamples = 20
  
  // Timing
  private lastAdjustment = 0
  private readonly adjustmentCooldown = 2000 // ms between adjustments
  
  constructor(options?: {
    minConcurrency?: number
    maxConcurrency?: number
    initialConcurrency?: number
  }) {
    this.minConcurrency = options?.minConcurrency ?? 3
    this.maxConcurrency = options?.maxConcurrency ?? 20
    this.currentConcurrency = options?.initialConcurrency ?? 8
    
    // Detect device capabilities and adjust max
    if (typeof navigator !== 'undefined') {
      const cores = navigator.hardwareConcurrency || 4
      // More cores = can handle more concurrent uploads
      this.maxConcurrency = Math.min(this.maxConcurrency, cores * 3)
    }
  }
  
  /**
   * Record the result of an upload for adaptive tuning
   */
  recordUpload(success: boolean, bytesUploaded: number, durationMs: number): void {
    // Track success/failure
    this.recentResults.push(success)
    if (this.recentResults.length > this.maxSamples) {
      this.recentResults.shift()
    }
    
    // Track speed (only for successful uploads)
    if (success && durationMs > 0) {
      const speed = bytesUploaded / (durationMs / 1000) // bytes per second
      this.recentSpeeds.push(speed)
      if (this.recentSpeeds.length > this.maxSamples) {
        this.recentSpeeds.shift()
      }
    }
    
    // Adjust concurrency based on metrics
    this.maybeAdjust()
  }
  
  /**
   * Get current recommended concurrency level
   */
  getConcurrency(): number {
    return this.currentConcurrency
  }
  
  /**
   * Get current metrics for debugging/display
   */
  getMetrics(): ConcurrencyMetrics {
    const successCount = this.recentResults.filter(r => r).length
    const successRate = this.recentResults.length > 0 
      ? successCount / this.recentResults.length 
      : 1
    
    const avgSpeed = this.recentSpeeds.length > 0
      ? this.recentSpeeds.reduce((a, b) => a + b, 0) / this.recentSpeeds.length
      : 0
    
    return {
      currentConcurrency: this.currentConcurrency,
      avgUploadSpeed: avgSpeed,
      successRate,
      recentErrors: this.recentResults.filter(r => !r).length,
    }
  }
  
  /**
   * Adjust concurrency based on recent performance
   */
  private maybeAdjust(): void {
    const now = Date.now()
    if (now - this.lastAdjustment < this.adjustmentCooldown) {
      return
    }
    
    // Need enough samples to make decisions
    if (this.recentResults.length < 5) {
      return
    }
    
    const metrics = this.getMetrics()
    
    // High error rate - back off aggressively
    if (metrics.successRate < 0.8) {
      this.currentConcurrency = Math.max(
        this.minConcurrency,
        Math.floor(this.currentConcurrency * 0.6)
      )
      this.lastAdjustment = now
      console.log(`[Concurrency] Backing off to ${this.currentConcurrency} (errors: ${metrics.recentErrors})`)
      return
    }
    
    // Perfect success rate and good speed - try increasing
    if (metrics.successRate === 1 && this.recentSpeeds.length >= 5) {
      // Check if speed is stable (not degrading)
      const recentAvg = this.recentSpeeds.slice(-5).reduce((a, b) => a + b, 0) / 5
      const olderAvg = this.recentSpeeds.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, this.recentSpeeds.length)
      
      // Speed is stable or improving - can increase concurrency
      if (recentAvg >= olderAvg * 0.9) {
        this.currentConcurrency = Math.min(
          this.maxConcurrency,
          this.currentConcurrency + 2
        )
        this.lastAdjustment = now
        console.log(`[Concurrency] Increasing to ${this.currentConcurrency} (speed stable)`)
      }
    }
  }
  
  /**
   * Reset metrics (e.g., when starting a new upload session)
   */
  reset(): void {
    this.recentSpeeds = []
    this.recentResults = []
    this.currentConcurrency = Math.min(8, this.maxConcurrency)
  }
}

// Singleton instance for the app
let controller: AdaptiveConcurrencyController | null = null

export function getAdaptiveConcurrencyController(): AdaptiveConcurrencyController {
  if (!controller) {
    controller = new AdaptiveConcurrencyController()
  }
  return controller
}
