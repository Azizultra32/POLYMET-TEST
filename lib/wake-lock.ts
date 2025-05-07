"use client"

// A safer implementation of wake lock functionality that gracefully degrades
export class SafeWakeLock {
  private wakeLock: any = null
  private isEnabled = false
  private fallbackInterval: NodeJS.Timeout | null = null

  // Initialize the wake lock - this doesn't enable it yet
  async initialize(): Promise<void> {
    // Only run on client side
    if (typeof window === "undefined") return
  }

  // Enable wake lock - must be called in response to a user gesture
  async enable(): Promise<boolean> {
    if (this.isEnabled) return true

    try {
      // Try native WakeLock API first
      if ("wakeLock" in navigator) {
        try {
          this.wakeLock = await (navigator as any).wakeLock.request("screen")
          this.isEnabled = true
          console.log("Native Wake Lock enabled")
          return true
        } catch (error) {
          console.warn("Native WakeLock request failed:", error)
          // Don't throw, just fall through to alternatives
        }
      }

      // Last resort fallback: use a setInterval to keep JavaScript running
      // This won't prevent screen from sleeping but keeps JS running
      this.fallbackInterval = setInterval(() => {
        // Just keep JavaScript running
        const now = new Date().getTime()
      }, 10000)

      this.isEnabled = true
      console.log("Fallback Wake Lock enabled (JS only)")
      return true
    } catch (error) {
      console.warn("All wake lock methods failed:", error)
      // Don't throw an error, just return false
      return false
    }
  }

  // Disable wake lock
  async disable(): Promise<void> {
    if (!this.isEnabled) return

    try {
      // Release native WakeLock if we have it
      if (this.wakeLock) {
        await this.wakeLock.release()
        this.wakeLock = null
        console.log("Native Wake Lock disabled")
      }

      // Clear fallback interval if we're using it
      if (this.fallbackInterval) {
        clearInterval(this.fallbackInterval)
        this.fallbackInterval = null
        console.log("Fallback Wake Lock disabled")
      }
    } catch (error) {
      console.warn("Error disabling wake lock:", error)
    } finally {
      this.isEnabled = false
    }
  }

  // Check if wake lock is enabled
  isActive(): boolean {
    return this.isEnabled
  }
}

// Create a singleton instance
let wakeLockInstance: SafeWakeLock | null = null

export function getWakeLock(): SafeWakeLock {
  if (!wakeLockInstance) {
    wakeLockInstance = new SafeWakeLock()
    // Initialize but don't await - it'll be ready when needed
    wakeLockInstance.initialize()
  }
  return wakeLockInstance
}
