"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Wifi, WifiOff, Send, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface StatusBarProps {
  isOnline: boolean
  statusText?: string
  onSendElement?: () => void
  onSendConsoleErrors?: () => void
  errorCount?: number
}

export default function StatusBar({
  isOnline,
  statusText = "Ready",
  onSendElement,
  onSendConsoleErrors,
  errorCount = 0,
}: StatusBarProps) {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className="h-8 bg-muted/50 border-t flex items-center justify-between px-4 text-xs text-muted-foreground">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          {isOnline ? <Wifi className="h-3 w-3 text-emerald-500" /> : <WifiOff className="h-3 w-3 text-rose-500" />}
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>

        <div className="flex items-center space-x-1">
          {errorCount > 0 ? (
            <AlertCircle className="h-3 w-3 text-rose-500" />
          ) : (
            <CheckCircle className="h-3 w-3 text-emerald-500" />
          )}
          <span>{errorCount > 0 ? `${errorCount} error${errorCount > 1 ? "s" : ""}` : "No errors"}</span>
        </div>

        <div>{statusText}</div>
      </div>

      <div className="flex items-center space-x-4">
        <TooltipProvider>
          {onSendElement && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSendElement}>
                  <Send className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Element</p>
              </TooltipContent>
            </Tooltip>
          )}

          {onSendConsoleErrors && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onSendConsoleErrors}>
                  <Bug className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Send Console Errors</p>
              </TooltipContent>
            </Tooltip>
          )}
        </TooltipProvider>

        <div>
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>
    </div>
  )
}
