"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface SimpleAudioVisualizerProps {
  className?: string
  barCount?: number
  barColor?: string
  height?: number
  isRecording: boolean
  isPaused?: boolean
}

export default function SimpleAudioVisualizer({
  className,
  barCount = 40,
  barColor = "#10b981",
  height = 100,
  isRecording,
  isPaused = false,
}: SimpleAudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Initialize audio context and analyzer
  useEffect(() => {
    if (!isRecording || isPaused) {
      // Clear canvas when not recording
      const canvas = canvasRef.current
      if (canvas) {
        const ctx = canvas.getContext("2d")
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      return
    }

    // Try to get microphone access
    const setupAudio = async () => {
      try {
        // Get microphone stream
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        streamRef.current = stream

        // Create audio context and analyzer
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        analyserRef.current.smoothingTimeConstant = 0.8

        // Connect microphone to analyzer
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream)
        sourceRef.current.connect(analyserRef.current)

        // Start visualization
        animate()
      } catch (error) {
        console.error("Error accessing microphone:", error)
        // Fall back to simulated visualization
        simulateVisualization()
      }
    }

    setupAudio()

    return () => {
      // Clean up
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }

      if (sourceRef.current) {
        sourceRef.current.disconnect()
        sourceRef.current = null
      }

      if (audioContextRef.current) {
        audioContextRef.current.close().catch(console.error)
        audioContextRef.current = null
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isRecording, isPaused])

  // Animation function
  const animate = () => {
    const canvas = canvasRef.current
    if (!canvas || !analyserRef.current) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Get frequency data
    const bufferLength = analyserRef.current.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)
    analyserRef.current.getByteFrequencyData(dataArray)

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw bars
    const barWidth = canvas.width / barCount
    let x = 0

    for (let i = 0; i < barCount; i++) {
      // Use a subset of the frequency data
      const index = Math.floor(i * (bufferLength / barCount))
      const value = dataArray[index]

      // Calculate bar height
      const barHeight = (value / 255) * canvas.height

      // Apply voice-focused weighting
      let weight = 1
      if (i > barCount * 0.2 && i < barCount * 0.6) {
        weight = 1.5 // Boost mid-range frequencies (voice)
      } else if (i < barCount * 0.2) {
        weight = 0.5 // Reduce low frequencies
      }

      const weightedHeight = Math.min(barHeight * weight, canvas.height)

      // Draw bar
      ctx.fillStyle = barColor
      ctx.fillRect(x, canvas.height - weightedHeight, barWidth - 1, weightedHeight)

      x += barWidth
    }

    // Continue animation
    animationRef.current = requestAnimationFrame(animate)
  }

  // Fallback animation
  const simulateVisualization = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const simulateFrame = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw simulated bars
      const barWidth = canvas.width / barCount
      let x = 0

      for (let i = 0; i < barCount; i++) {
        // Generate random height with voice-like pattern
        let height = Math.random() * canvas.height * 0.8

        // Apply voice-focused weighting
        if (i > barCount * 0.2 && i < barCount * 0.6) {
          height *= 1.5 // Boost mid-range frequencies (voice)
        } else if (i < barCount * 0.2) {
          height *= 0.5 // Reduce low frequencies
        }

        // Draw bar
        ctx.fillStyle = barColor
        ctx.fillRect(x, canvas.height - height, barWidth - 1, height)

        x += barWidth
      }

      // Continue animation
      animationRef.current = requestAnimationFrame(simulateFrame)
    }

    simulateFrame()
  }

  return <canvas ref={canvasRef} className={cn("w-full", className)} width={500} height={height} />
}
