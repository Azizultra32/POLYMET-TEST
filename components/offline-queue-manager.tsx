"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { getOfflineQueue } from "@/lib/indexedDB"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { Upload } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfflineQueueManagerProps {
  onProcessQueue?: () => Promise<void>
  className?: string
}

export default function OfflineQueueManager({ onProcessQueue, className }: OfflineQueueManagerProps) {
  const [queueCount, setQueueCount] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const isOnline = useOnlineStatus()

  // Check queue count periodically
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
    const interval = setInterval(checkQueue, 30000)
    return () => clearInterval(interval)
  }, [])

  // Process the queue
  const handleProcessQueue = async () => {
    if (!isOnline || !onProcessQueue || queueCount === 0) return

    try {
      setIsProcessing(true)
      await onProcessQueue()

      // Refresh the queue count
      const queue = await getOfflineQueue()
      setQueueCount(queue.length)
    } catch (error) {
      console.error("Error processing queue:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  // Don't render anything if queue is empty
  if (queueCount === 0) return null

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleProcessQueue}
      disabled={!isOnline || isProcessing || queueCount === 0}
    >
      <Upload className="h-4 w-4" />
      Queue
      <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full text-xs">{queueCount}</span>
    </Button>
  )
}
