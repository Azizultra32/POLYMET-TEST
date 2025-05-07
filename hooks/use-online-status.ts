"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus(): boolean {
  // Default to true to avoid errors during SSR
  const [isOnline, setIsOnline] = useState<boolean>(true)

  useEffect(() => {
    // Only run in browser environment
    if (typeof window === "undefined" || typeof navigator === "undefined") return

    // Set initial state based on navigator.onLine
    setIsOnline(navigator.onLine)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Add event listeners
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    // Clean up
    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
