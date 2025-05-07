"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"

interface AudioVisualizerProps {
  audioStream?: MediaStream | null
  isRecording: boolean
  isPaused?: boolean
  className?: string
  barCount?: number
  barColor?: string
  barSpacing?: number
  height?: number
}

export default function AudioVisualizer({
  audioStream,
  isRecording,
  isPaused = false,
  className,
  barCount = 64,
  barColor = "#10b981", // Default to green
  barSpacing = 1,
  height = 100,
}: AudioVisualizerProps) {
  const [frequencies, setFrequencies] = useState<number[]>(new Array(barCount).fill(0))
  const [volume, setVolume] = useState(0)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Initialize audio context and analyzer when stream is available
  useEffect(() => {
    if (!audioStream || !isRecording || isPaused) return

    // Clean up previous instances
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error)
      audioContextRef.current = null
    }

    try {
      // Create audio context and analyzer
      audioContextRef.current = new AudioContext()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256 // Power of 2, determines frequency bin count
      analyserRef.current.smoothingTimeConstant = 0.8 // Smoother transitions between frames

      // Connect audio source to analyzer
      sourceRef.current = audioContextRef.current.createMediaStreamSource(audioStream)
      sourceRef.current.connect(analyserRef.current)

      // Start animation
      animate()
    } catch (error) {
      console.error("Error initializing audio visualizer:", error)
      startFallbackAnimation()
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }
    }
  }, [audioStream, isRecording, isPaused, barCount])

  // Reset visualizer when recording stops
  useEffect(() => {
    if (!isRecording || isPaused) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }

      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
        fallbackIntervalRef.current = null
      }

      // Reset visualization
      setFrequencies(new Array(barCount).fill(0))
      setVolume(0)
    } else if (isRecording && !isPaused && !animationFrameRef.current && !fallbackIntervalRef.current) {
      // If we're recording but don't have an animation frame, restart
      if (analyserRef.current) {
        animate()
      } else {
        startFallbackAnimation()
      }
    }
  }, [isRecording, isPaused, barCount])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }

      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current)
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
      }
    }
  }, [])

  // Animation function for real audio visualization
  const animate = () => {
    if (!analyserRef.current) return

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Apply voice-focused weighting to frequencies
    const weightedFrequencies = applyVoiceWeighting(dataArray)

    // Calculate average volume
    const average = weightedFrequencies.reduce((sum, value) => sum + value, 0) / weightedFrequencies.length
    setVolume(average)

    // Update state with new frequencies
    setFrequencies(weightedFrequencies.slice(0, barCount))

    // Continue animation
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  // Apply weighting to emphasize voice frequencies
  const applyVoiceWeighting = (frequencies: Uint8Array): number[] => {
    return Array.from(frequencies).map((value, index) => {
      const frequency = ((index / frequencies.length) * (audioContextRef.current?.sampleRate ?? 44100)) / 2
      let weight = 1

      // Boost frequencies in human voice range (85-255 Hz)
      if (frequency > 85 && frequency < 255) {
        weight = 1.5
      } else if (frequency < 85) {
        weight = 0.5 // Reduce lower frequencies
      }

      return Math.min((value / 256) * weight, 1)
    })
  }

  // Fallback animation when real audio isn't available
  const startFallbackAnimation = () => {
    // Generate random frequency data that resembles voice patterns
    const simulateAudio = () => {
      const simulatedFrequencies = Array(barCount)
        .fill(0)
        .map(() => {
          const index = Math.floor(Math.random() * barCount)
          let value = Math.random()

          // Boost mid-range frequencies (voice range)
          if (index > Math.floor(barCount * 0.25) && index < Math.floor(barCount * 0.6)) {
            value *= 1.5
          }

          // Reduce low frequencies
          if (index < Math.floor(barCount * 0.25)) {
            value *= 0.5
          }

          return Math.min(value, 1)
        })

      setFrequencies(simulatedFrequencies)

      // Calculate average volume
      const average = simulatedFrequencies.reduce((sum, value) => sum + value, 0) / simulatedFrequencies.length
      setVolume(average)
    }

    // Initial simulation
    simulateAudio()

    // Update every 50ms for smooth animation
    fallbackIntervalRef.current = setInterval(simulateAudio, 50)
  }

  // Render the visualizer
  return (
    <div
      className={cn("w-full overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800", className)}
      style={{ height: `${height}px` }}
    >
      <div className="flex items-end h-full w-full gap-[1px]" aria-hidden="true">
        {frequencies.map((freq, i) => (
          <div
            key={i}
            className="flex-1 transition-all duration-75 rounded-t-sm"
            style={{
              height: `${Math.max(3, Math.min(freq * 100, 100))}%`,
              opacity: freq < 0.1 ? 0.3 : 0.4 + freq * 0.6,
              backgroundColor: barColor,
              marginLeft: `${barSpacing}px`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
