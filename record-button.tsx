"use client"

import type React from "react"
import { useRef, useState, useEffect } from "react"

interface RecordButtonProps {
  size: number
  recordingState: "idle" | "recording" | "processing" | "error"
  onButtonPress: () => void
  onButtonRelease: () => void
  className?: string
  errorMessage?: string
}

const RecordButton: React.FC<RecordButtonProps> = ({
  size,
  recordingState,
  onButtonPress,
  onButtonRelease,
  className = "",
  errorMessage,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imagesLoaded, setImagesLoaded] = useState(false)

  useEffect(() => {
    setImagesLoaded(true) // Simulate image loading
  }, [])

  const handleButtonPress = () => {
    onButtonPress()
  }

  const handleButtonRelease = () => {
    onButtonRelease()
  }

  const handleMouseLeave = () => {
    // Optional: Implement mouse leave behavior if needed
  }

  const getButtonLabel = () => {
    switch (recordingState) {
      case "idle":
        return "Start Recording"
      case "recording":
        return "Stop Recording"
      case "processing":
        return "Processing..."
      case "error":
        return "Error"
      default:
        return "Record"
    }
  }

  const getStatusMessage = () => {
    switch (recordingState) {
      case "idle":
        return "Press and hold to record"
      case "recording":
        return "Recording... Release to stop"
      case "processing":
        return "Processing audio..."
      case "error":
        return errorMessage || "An error occurred"
      default:
        return ""
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        aria-label={getButtonLabel()}
        aria-describedby="record-button-status"
        onMouseDown={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleButtonPress}
        onTouchEnd={handleButtonRelease}
        className={`bg-transparent border-0 p-0 cursor-pointer focus:outline-none ${className}`}
      >
        <canvas ref={canvasRef} width={size} height={size} className="bg-black rounded-full" />

        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xs">Loading...</div>
          </div>
        )}
      </button>

      <div
        id="record-button-status"
        className={`text-sm text-center max-w-xs ${recordingState === "error" ? "text-red-400" : "text-white opacity-50"}`}
      >
        {getStatusMessage()}
      </div>
    </div>
  )
}

export default RecordButton
