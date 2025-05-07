"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

export type RecordButtonState = "idle" | "recording" | "paused" | "processing" | "error"

interface AnimatedRecordButtonProps {
  size?: number
  state: RecordButtonState
  onClick: () => void
  onLongPress?: () => void
  className?: string
  disabled?: boolean
}

export default function AnimatedRecordButton({
  size = 64,
  state = "idle",
  onClick,
  onLongPress,
  className = "",
  disabled = false,
}: AnimatedRecordButtonProps) {
  // Interactive states
  const [isPressed, setIsPressed] = useState(false)
  const [longPressProgress, setLongPressProgress] = useState(0)

  // Long press handling
  const longPressTimer = useRef<NodeJS.Timeout | null>(null)
  const longPressDuration = 1500 // 1.5 seconds for long press
  const pressStartTimeRef = useRef<number>(0)

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
    if (disabled) return

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
      onClick()
    }

    setLongPressProgress(0)
  }

  // Get button appearance based on state
  const getButtonStyles = () => {
    switch (state) {
      case "recording":
        return {
          outer: "bg-red-500 border-red-300",
          inner: "bg-white",
          shadow: "shadow-lg shadow-red-500/30",
          pulse: "bg-red-500/30",
        }
      case "paused":
        return {
          outer: "bg-amber-500 border-amber-300",
          inner: "bg-white",
          shadow: "shadow-md shadow-amber-500/20",
          pulse: "bg-amber-500/30",
        }
      case "processing":
        return {
          outer: "bg-blue-500 border-blue-300",
          inner: "bg-white",
          shadow: "shadow-md shadow-blue-500/20",
          pulse: "bg-blue-500/30",
        }
      case "error":
        return {
          outer: "bg-rose-500 border-rose-300",
          inner: "bg-white",
          shadow: "shadow-md shadow-rose-500/20",
          pulse: "bg-rose-500/30",
        }
      default: // idle
        return {
          outer: "bg-emerald-500 border-emerald-300",
          inner: "bg-white",
          shadow: "shadow-lg shadow-emerald-500/30",
          pulse: "bg-emerald-500/30",
        }
    }
  }

  const styles = getButtonStyles()

  return (
    <div className={cn("relative inline-block", className)}>
      {/* Main Button */}
      <motion.button
        type="button"
        disabled={disabled}
        onMouseDown={startLongPress}
        onMouseUp={endLongPress}
        onMouseLeave={endLongPress}
        onTouchStart={startLongPress}
        onTouchEnd={endLongPress}
        whileTap={{ scale: 0.95 }}
        className={cn(
          "relative rounded-full overflow-hidden transition-all border-4",
          styles.outer,
          styles.shadow,
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
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
        {/* Button content based on state */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {state === "recording" && (
              <motion.div
                className="w-1/3 h-1/3 rounded-sm bg-white"
                animate={{ scale: [1, 0.95, 1] }}
                transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1.5 }}
              />
            )}
            {state === "paused" && (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-[18%] h-1/3 rounded-sm bg-white" />
                <div className="w-[18%] h-1/3 rounded-sm bg-white" />
              </div>
            )}
            {state === "idle" && (
              <motion.div
                className="w-1/2 h-1/2 rounded-full bg-white"
                animate={{ scale: [1, 1.05, 1] }}
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
          </motion.div>
        </AnimatePresence>
      </motion.button>

      {/* Long Press Progress Indicator */}
      <AnimatePresence>
        {isPressed && longPressProgress > 0 && (
          <svg
            className="absolute top-0 left-0 -rotate-90 pointer-events-none"
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
          >
            <circle
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
            className={cn("absolute inset-0 rounded-full", styles.pulse)}
            initial={{ opacity: 0.7, scale: 1 }}
            animate={{ opacity: 0, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
