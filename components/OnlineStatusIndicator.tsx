"use client"

import { useOnlineStatus } from "@/hooks/use-online-status"
import { Badge } from "./ui/badge"
import { Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"
import { getOfflineQueue } from "@/lib/indexedDB"
import { useEffect, useState } from "react"

const OnlineStatusIndicator = () => {
  const isOnline = useOnlineStatus()
  const [queueCount, setQueueCount] = useState(0)

  // Check offline queue periodically
  useEffect(() => {
    const checkQueue = async () => {
      try {
        const queue = await getOfflineQueue()
        setQueueCount(queue.length)
      } catch (error) {
        console.error("Error checking queue:", error)
      }
    }

    checkQueue()
    const interval = setInterval(checkQueue, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Badge
      variant="outline"
      className={cn(
        "transition-all duration-200 gap-1.5 px-3 py-1 text-sm font-medium",
        isOnline
          ? "bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30"
          : "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/20 dark:text-destructive-foreground dark:border-destructive/30",
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5" />
          <span>Online</span>
          {queueCount > 0 && (
            <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{queueCount}</span>
          )}
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          <span>Offline</span>
          {queueCount > 0 && (
            <span className="ml-1 text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">{queueCount}</span>
          )}
        </>
      )}
    </Badge>
  )
}

export default OnlineStatusIndicator
