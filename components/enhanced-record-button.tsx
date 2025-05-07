"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export type RecordingState = "idle" | "recording" | "paused" | "processing" | "error"

interface EnhancedRecordButtonProps {
  size?: number
  state: RecordingState
  onStart?: () => void
  onPause?: () => void
  onStop?: () => void
  onLongPress?: () => void
  className?: string
  errorMessage?: string
  disabled?: boolean
  processingText?: string
  idleText?: string
  recordingText?: string
  pausedText?: string
  errorText?: string
}

export default function EnhancedRecordButton({
  size = 64,
  state = "idle",
  onStart,
  onPause,
  onStop,
  onLongPress,
  className = "",
  errorMessage,
  disabled = false,
  processingText = "Processing...",
  idleText = "Tap to record, hold to cancel",
  recordingText = "Recording... Tap to pause, hold to stop",
  pausedText = "Paused. Tap to resume, hold to stop",
  errorText = "Error occurred",
}: EnhancedRecordButtonProps) {
  // Interactive states
  const [isPressed, setIsPressed] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Long press handling
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressDuration = 1500 // 1.5 seconds for long press
  const pressStartTimeRef = useRef<number>(0)

  // Animation refs
  const buttonRef = useRef<HTMLButtonElement>(null)
  const progressRef = useRef<SVGCircleElement>(null)

  // Clean up timers
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearInterval(longPressTimer.current)
      }
    }
  }, [])

  // Start long press timer
  const startLongPress = () => {
    if (disabled || state === "error" || state === "processing") return

    setIsPressed(true)
    pressStartTimeRef.current = Date.now()

    // Clear any existing timer
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current)
    }

    // Start progress timer
    longPressTimer.current = setInterval(() => {
      const elapsed = Date.now() - pressStartTimeRef.current
      const progress = Math.min(1, elapsed / longPressDuration)
      setLongPressProgress(progress)

      if (progress >= 1) {
        clearInterval(longPressTimer.current!)
        setLongPressProgress(0)
        setIsPressed(false)

        // Trigger long press action
        if (onLongPress) {
          onLongPress()
        } else if (onStop) {
          // Default long press action is stop
          onStop()
        }
      }
    }, 16) // Update at 60fps
  }

  // End long press timer
  const endLongPress = () => {
    if (longPressTimer.current) {
      clearInterval(longPressTimer.current)
      longPressTimer.current = null
    }

    const wasPressed = isPressed
    setIsPressed(false)

    // If we didn't complete a long press, treat as a tap
    if (wasPressed && longPressProgress < 1) {
      handleTap()
    }

    setLongPressProgress(0)
  }

  // Handle tap actions based on current state
  const handleTap = () => {
    if (disabled) return

    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 300)

    switch (state) {
      case "idle":
        if (onStart) onStart()
        break
      case "recording":
        if (onPause) onPause()
        break
      case "paused":
        if (onStart) onStart()
        break
      case "error":
        if (onStart) onStart() // Try again
        break
      default:
        break
    }
  }

  // Determine button appearance based on state
  const getButtonAppearance = () => {
    switch (state) {
      case "recording":
        return {
          mainColor: "bg-red-500",
          pulseColor: "bg-red-600",
          iconColor: "bg-white",
          border: "border-4 border-red-200",
          shadow: "shadow-lg shadow-red-500/20",
        }
      case "paused":
        return {
          mainColor: "bg-amber-500",
          pulseColor: "bg-amber-600",
          iconColor: "bg-white",
          border: "border-4 border-amber-200",
          shadow: "shadow-md shadow-amber-500/20",
        }
      case "processing":
        return {
          mainColor: "bg-blue-500",
          pulseColor: "bg-blue-600",
          iconColor: "bg-white",
          border: "border-4 border-blue-200",
          shadow: "shadow-md shadow-blue-500/20",
        }
      case "error":
        return {
          mainColor: "bg-rose-500",
          pulseColor: "bg-rose-600",
          iconColor: "bg-white",
          border: "border-4 border-rose-200",
          shadow: "shadow-md shadow-rose-500/20",
        }
      default: // idle
        return {
          mainColor: "bg-emerald-500",
          pulseColor: "bg-emerald-600",
          iconColor: "bg-white",
          border: "border-4 border-emerald-200",
          shadow: "shadow-lg shadow-emerald-500/30",
        }
    }
  }

  const appearance = getButtonAppearance()

  return (
    <div className={cn("flex flex-col items-center justify-center", className)}>
      <div className="relative">
        {/* Main Button */}
        <motion.button
          ref={buttonRef}
          type="button"
          disabled={disabled}
          onMouseDown={startLongPress}
          onMouseUp={endLongPress}
          onMouseLeave={endLongPress}
          onTouchStart={startLongPress}
          onTouchEnd={endLongPress}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: isAnimating ? [1, 0.95, 1] : 1,
          }}
          transition={{
            duration: 0.3,
            ease: "easeInOut",
          }}
          className={cn(
            "relative rounded-full overflow-hidden transition-all",
            appearance.mainColor,
            appearance.border,
            appearance.shadow,
            disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105",
            "focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900",
            "focus:ring-emerald-500/50 dark:focus:ring-emerald-500/50",
          )}
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          aria-label={
            state === "idle"
              ? "Start recording"
              : state === "recording"
                ? "Pause recording"
                : state === "paused"
                  ? "Resume recording"
                  : state === "error"
                    ? "Error, try again"
                    : "Processing"
          }
        >
          {/* Inner content based on state */}
          <div className="absolute inset-0 flex items-center justify-center">
            {state === "recording" && <div className="w-1/3 h-1/3 rounded-sm bg-white" />}
            {state === "paused" && (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-[18%] h-1/3 rounded-sm bg-white" />
                <div className="w-[18%] h-1/3 rounded-sm bg-white" />
              </div>
            )}
            {state === "idle" && (
              <motion.div
                className="w-1/3 h-1/3 rounded-full bg-white"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 2 }}
              />
            )}
            {state === "processing" && (
              <motion.div
                className="w-1/4 h-1/4 border-4 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1, ease: "linear" }}
              />
            )}
            {state === "error" && <div className="text-white font-bold text-lg">!</div>}
          </div>
        </motion.button>

        {/* Long Press Progress Indicator */}
        <AnimatePresence>
          {isPressed && longPressProgress > 0 && (
            <svg
              className="absolute top-0 left-0 -rotate-90"
              width={size}
              height={size}
              viewBox={`0 0 ${size} ${size}`}
            >
              <circle
                ref={progressRef}
                cx={size / 2}
                cy={size / 2}
                r={size / 2 - 4}
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={`${longPressProgress * Math.PI * (size - 8)} ${Math.PI * (size - 8)}`}
                strokeLinecap="round"
                className="opacity-70"
              />
            </svg>
          )}
        </AnimatePresence>

        {/* Pulse Animation for Recording State */}
        <AnimatePresence>
          {state === "recording" && (
            <motion.span
              className="absolute inset-0 rounded-full"
              initial={{ opacity: 0.7, scale: 1 }}
              animate={{ opacity: 0, scale: 1.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
              style={{ backgroundColor: "rgba(239, 68, 68, 0.3)" }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Status Text */}
      <div className="mt-2 text-center text-sm">
        <span className={cn("block", state === "error" ? "text-rose-500" : "text-gray-500")}>
          {state === "idle" && idleText}
          {state === "recording" && recordingText}
          {state === "paused" && pausedText}
          {state === "processing" && processingText}
          {state === "error" && (errorMessage || errorText)}
        </span>
      </div>
    </div>
  )
}
