"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Badge } from "./ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const OnlineStatusIndicator = () => {
  const isOnline = useOnlineStatus()
  const [showTooltip, setShowTooltip] = useState(false)
  const [hasStatusChanged, setHasStatusChanged] = useState(false)

  // Show tooltip when status changes
  useEffect(() => {
    setHasStatusChanged(true)
    setShowTooltip(true)

    const timer = setTimeout(() => {
      setShowTooltip(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isOnline])

  return (
    <div className="relative">
      <Badge
        variant="outline"
        className={cn(
          "transition-all duration-200 gap-1.5 px-3 py-1 text-sm font-medium",
          isOnline
            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
            : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="h-3.5 w-3.5" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5" />
            <span>Offline</span>
          </>
        )}
      </Badge>

      {showTooltip && hasStatusChanged && (
        <div
          className={cn(
            "absolute top-full mt-2 left-1/2 transform -translate-x-1/2 px-3 py-2 rounded shadow-md text-xs font-medium z-50 whitespace-nowrap animate-in fade-in",
            isOnline
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50"
              : "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50",
          )}
        >
          {isOnline
            ? "Connection restored. Your changes will sync now."
            : "You're offline. Changes will sync when connection is restored."}
          <div
            className={cn(
              "absolute bottom-full left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45",
              isOnline
                ? "bg-emerald-50 border-t border-l border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800/50"
                : "bg-rose-50 border-t border-l border-rose-200 dark:bg-rose-950/30 dark:border-rose-800/50",
            )}
          />
        </div>
      )}
    </div>
  )
}

export default OnlineStatusIndicator
