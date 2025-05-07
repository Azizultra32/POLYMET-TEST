"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// Types
export type RecordingState = "idle" | "recording" | "paused" | "stopped" | "error"
type AnimationState = "idle" | "speeding-up" | "recording" | "paused" | "slowing-down"

interface RecordButtonProps {
  size?: number
  onRecordingStart?: () => void
  onRecordingPause?: () => void
  onRecordingResume?: () => void
  onRecordingStop?: (audioBlob: Blob, audioUrl: string) => void
  onError?: (error: Error) => void
  className?: string
}

export default function RecordButton({
  size = 64,
  onRecordingStart,
  onRecordingPause,
  onRecordingResume,
  onRecordingStop,
  onError,
  className = "",
}: RecordButtonProps) {
  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [animationState, setAnimationState] = useState<AnimationState>("idle")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState<boolean | null>(null)

  // Long press detection
  const [isLongPressing, setIsLongPressing] = useState(false)
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null)
  const longPressDuration = 1000 // 1 second for long press
  const stateChangeTimeRef = useRef<number>(0)

  // Recording refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Animation refs
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [currentFrame, setCurrentFrame] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  const imagesRef = useRef<HTMLImageElement[]>([])
  const lastFrameTimeRef = useRef<number>(0)
  const frameProgressRef = useRef(0)
  const animationProgressRef = useRef<number>(1) // 1 = normal speed, 0 = stopped
  const totalFrames = 46
  const targetFps = 45 // Maximum FPS during recording
  const minSlowdownFps = 30 // Minimum FPS during slowdown to keep rendering smooth

  // Check if microphone is available
  useEffect(() => {
    const checkMicrophoneAvailability = async () => {
      try {
        // Check if navigator.mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setIsMicrophoneAvailable(false)
          setErrorMessage("Media devices API not supported in this browser")
          return
        }

        // Try to get the list of media devices
        const devices = await navigator.mediaDevices.enumerateDevices()
        const hasMicrophone = devices.some((device) => device.kind === "audioinput")

        if (!hasMicrophone) {
          setIsMicrophoneAvailable(false)
          setErrorMessage("No microphone detected on this device")
          return
        }

        // Try to access the microphone
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // If we get here, microphone is available
        setIsMicrophoneAvailable(true)
        setErrorMessage(null)

        // Stop the test stream
        stream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        setIsMicrophoneAvailable(false)
        if (error instanceof Error) {
          setErrorMessage(error.message)
          if (onError) onError(error)
        } else {
          setErrorMessage("Unknown error accessing microphone")
          if (onError) onError(new Error("Unknown error accessing microphone"))
        }
      }
    }

    checkMicrophoneAvailability()
  }, [onError])

  // Start recording
  const startRecording = useCallback(async () => {
    // If we already know microphone is not available, don't try again
    if (isMicrophoneAvailable === false) {
      setRecordingState("error")
      return
    }

    try {
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === "undefined") {
        throw new Error("MediaRecorder API not supported in this browser")
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        if (audioChunksRef.current.length === 0) {
          console.warn("No audio data was recorded")
          return
        }

        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)

        if (onRecordingStop) {
          onRecordingStop(audioBlob, audioUrl)
        }
      }

      mediaRecorder.start()

      // Start the speed-up animation
      setAnimationState("speeding-up")
      setRecordingState("recording")
      stateChangeTimeRef.current = performance.now()
      setErrorMessage(null)

      if (onRecordingStart) {
        onRecordingStart()
      }
    } catch (error) {
      console.error("Error accessing microphone:", error)
      setRecordingState("error")

      if (error instanceof Error) {
        setErrorMessage(error.message)
        if (onError) onError(error)
      } else {
        setErrorMessage("Unknown error accessing microphone")
        if (onError) onError(new Error("Unknown error accessing microphone"))
      }
    }
  }, [isMicrophoneAvailable, onRecordingStart, onRecordingStop, onError])

  // Pause recording
  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      try {
        // Pause the recording
        if ("pause" in mediaRecorderRef.current) {
          mediaRecorderRef.current.pause()
        }

        // Pause the animation
        setAnimationState("paused")
        setRecordingState("paused")

        if (onRecordingPause) {
          onRecordingPause()
        }
      } catch (error) {
        console.error("Error pausing recording:", error)
        if (error instanceof Error && onError) {
          onError(error)
        }
      }
    }
  }, [onRecordingPause, onError])

  // Resume recording
  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && "resume" in mediaRecorderRef.current) {
      try {
        // Resume the recording
        mediaRecorderRef.current.resume()

        // Resume the animation
        setAnimationState("recording")
        setRecordingState("recording")
        stateChangeTimeRef.current = performance.now()

        if (onRecordingResume) {
          onRecordingResume()
        }
      } catch (error) {
        console.error("Error resuming recording:", error)
        if (error instanceof Error && onError) {
          onError(error)
        }
      }
    }
  }, [onRecordingResume, onError])

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && (recordingState === "recording" || recordingState === "paused")) {
      try {
        // Stop the recording
        mediaRecorderRef.current.stop()

        // Release the media stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }

        // Start the slowdown animation
        setAnimationState("slowing-down")
        setRecordingState("stopped")
        stateChangeTimeRef.current = performance.now()
      } catch (error) {
        console.error("Error stopping recording:", error)
        if (error instanceof Error && onError) {
          onError(error)
        }
      }
    }
  }, [recordingState, onError])

  // Handle button press
  const handleButtonPress = useCallback(() => {
    // If in error state, try to start recording again
    if (recordingState === "error") {
      startRecording()
      return
    }

    // Start long press timer
    if ((recordingState === "recording" || recordingState === "paused") && !isLongPressing) {
      setIsLongPressing(true)
      stateChangeTimeRef.current = Date.now()

      longPressTimerRef.current = setTimeout(() => {
        // Long press detected, stop recording
        stopRecording()
        setIsLongPressing(false)
      }, longPressDuration)
    }
  }, [recordingState, isLongPressing, stopRecording, startRecording])

  // Handle button tap
  const handleButtonTap = useCallback(() => {
    switch (recordingState) {
      case "idle":
      case "error":
        startRecording()
        break
      case "recording":
        pauseRecording()
        break
      case "paused":
        resumeRecording()
        break
      default:
        // Do nothing for other states
        break
    }
  }, [recordingState, startRecording, pauseRecording, resumeRecording])

  // Handle button release
  const handleButtonRelease = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // If we were long pressing but didn't complete, handle as a tap
    if (isLongPressing) {
      setIsLongPressing(false)

      // If we didn't complete the long press, treat as a tap
      const elapsedTime = Date.now() - (stateChangeTimeRef.current || Date.now())
      if (elapsedTime < longPressDuration) {
        handleButtonTap()
      }
    } else {
      // Normal tap
      handleButtonTap()
    }
  }, [isLongPressing, handleButtonTap])

  // Handle mouse leave - don't treat it as a button release for paused state
  const handleMouseLeave = useCallback(() => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }

    // Reset long pressing state
    if (isLongPressing) {
      setIsLongPressing(false)
    }

    // We don't call handleButtonTap() here, which preserves the paused state
  }, [isLongPressing])

  // Clean up function
  const cleanup = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop()
      } catch (error) {
        console.error("Error stopping media recorder:", error)
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
    }
  }, [])

  // Preload images
  useEffect(() => {
    const loadImages = async () => {
      const images: HTMLImageElement[] = []
      let loaded = 0

      // Complete URL mapping for all frames
      const completeUrls = [
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_000.jpg-QcNKreMuOx8gkc9Dp4oTBQTS7fDPgx.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_001.jpg-IpDIkZeMSM5aQ446gUlGtr13u63cKl.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_002.jpg-IolriPy0ICHSLeBWqp9ngeYsDK3rck.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_003.jpg-mo7mCtuQWh7x7BFuRE7rqErqOcZndD.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_004.jpg-MXi97UIsphRPYOLo8sFSqObDls3rlU.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_005.jpg-2Cbp1HeEmeHl1XF77BlPtPNF7oDXib.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_006.jpg-FP6evoQmj8hQrkBDPafSrw1PHDsE6S.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_007.jpg-nNGGHPk2nSiaazCx79ub8jzgfwDMOV.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_008.jpg-qAM9XVMCuGyq9dCrZsRnwLvOXqspZ5.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_009.jpg-hwkdsNiO7okroHYkMhevWfLUc7gpcU.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_010.jpg-XYpPR3DD1x2Q1DYrCp4gt494fpHf2H.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_011.jpg-OGT31ZS6DR9o7L10QWkaie5WgHPpbw.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_012.jpg-hGFcGrscRlXNsUjMJHZUUhWjSgWANL.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_013.jpg-f5d3ksU6b7DpLNmbOgdulerMs9CafX.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_014.jpg-oLR6Nw55jTdH3du4g5czQvddILikLx.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_015.jpg-eInu9cnRRIhBq3iR9YPV0AFdB29GDu.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_016.jpg-Vs1Vmv4mtf9O3Euf4sgE48bjQy7Jgm.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_017.jpg-NOYLoyz0XL4PdO0YV7qYWUVfMS0rPh.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_018.jpg-XRzYvEiGMYOuQkA6PMntHOwxZBpkqB.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_019.jpg-HB4SN8oQUFhk8cpIG3FSIzierOg4ZM.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_020.jpg-LxnbPyN3tZR6m0NIGwT7m7tJw7ZZsc.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_021.jpg-w1xg2bqk8K0Ii2cd5SdYlizfSPg0V4.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_022.jpg-t9Txu8R0VJVNdn9QRXKgIXsOd9pBr0.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_023.jpg-PGXGaZrvusVqQYdFCc78sYwr0kmTbV.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_024.jpg-zq4hK1nIp6BgZ1w7mQjs0qOUWnjFHe.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_025.jpg-lpXImFvmMRQFQU5FM8Lyds6FyCCU42.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_026.jpg-pnOr7Bb9NiU19fAehRWUKSLMO5Hnsg.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_027.jpg-t0gy3q04gbOve8YZWXjFu7iSm4BQC8.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_028.jpg-riTPKq30cvXRROUbMS5xhl2L2ABhWw.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_029.jpg-DaOQFxt7Cu6qTsxpyBuiFcpLF87Ab8.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_030.jpg-YFyuL7sy22fILKqEnWY6IKmqSsSx4v.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_031.jpg-aN0JVrrgctfykJN5gQXGUhlrotCtKj.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_032.jpg-dUnWGKOPQL9ZjESdvWATlIh6DNL9MD.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_033.jpg-h6OUNgijCfBqDPLsOKJOfnprYudOga.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_034.jpg-QlPsFLM5VjH2jhCmGOz2UkzasE7K2p.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_035.jpg-5BHcbVWqFUkJJ89QYPdQcxZwUMaG29.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_036.jpg-6szlQUNIXAhNoiS5t9sAxQtUCTOI2y.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_037.jpg-22wZM4v8FduvlLsQloGeq9kVeKl6gW.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_038.jpg-O0QhZL47784HeeR0OhWkrwDNeTBiF7.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_039.jpg-AxqrDIY3Ura9qSsWREFeOLenCU8FX6.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_040.jpg-NERfNSf3BjfbCiBG36LotD0QzPtsgV.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_041.jpg-GkYi0CNAJayArt6No3iilJMpkncyjN.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_042.jpg-3WCrTiuPG6tX430xyOxKK8Cr90WX4J.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_043.jpg-xP1l4j2Qab38pOUMB3cZ98zuVBVsfJ.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_044.jpg-UqampEfsQ9oyuZqAYmOuEvThZooxm5.jpeg",
        "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_045.jpg-saxgSX9khTUSPydl1AfkhkWMxqr5Zk.jpeg",
      ]

      // Load all images
      for (let i = 0; i < totalFrames; i++) {
        const img = new Image()
        img.crossOrigin = "anonymous" // Avoid CORS issues
        img.onload = () => {
          loaded++
          if (loaded === totalFrames) {
            setImagesLoaded(true)
          }
        }
        img.onerror = (e) => {
          console.error(`Failed to load image at index ${i}`, e)
        }
        img.src = completeUrls[i]
        images[i] = img
      }

      imagesRef.current = images
    }

    loadImages()

    return () => {
      // Clean up image references
      imagesRef.current = []
    }
  }, [totalFrames])

  // Draw current frame to canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw fallback circle if images not loaded
    if (!imagesLoaded || !imagesRef.current[currentFrame]) {
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2 - 2, 0, 2 * Math.PI)
      ctx.strokeStyle = "white"
      ctx.lineWidth = 2
      ctx.stroke()
      return
    }

    // Draw the current frame
    const img = imagesRef.current[currentFrame]
    if (img && img.complete) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    }

    // Draw pause indicator if paused
    if (animationState === "paused") {
      // Draw semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw pause icon
      ctx.fillStyle = "white"
      const pauseWidth = canvas.width * 0.08
      const pauseHeight = canvas.height * 0.25
      const pauseGap = canvas.width * 0.08
      const pauseY = canvas.height / 2 - pauseHeight / 2

      // Left bar
      ctx.fillRect(canvas.width / 2 - pauseWidth - pauseGap / 2, pauseY, pauseWidth, pauseHeight)

      // Right bar
      ctx.fillRect(canvas.width / 2 + pauseGap / 2, pauseY, pauseWidth, pauseHeight)
    }

    // Draw error indicator
    if (recordingState === "error") {
      // Draw semi-transparent overlay
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)"
      ctx.beginPath()
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width / 2, 0, 2 * Math.PI)
      ctx.fill()

      // Draw error icon (exclamation mark)
      ctx.fillStyle = "red"

      // Exclamation mark vertical line
      const excWidth = canvas.width * 0.08
      const excHeight = canvas.height * 0.25
      const excY = canvas.height / 2 - excHeight / 2 - canvas.height * 0.05
      ctx.fillRect(canvas.width / 2 - excWidth / 2, excY, excWidth, excHeight)

      // Exclamation mark dot
      ctx.beginPath()
      ctx.arc(canvas.width / 2, excY + excHeight + canvas.height * 0.08, excWidth / 2, 0, 2 * Math.PI)
      ctx.fill()
    }

    // Draw long press indicator
    if (isLongPressing) {
      const elapsedTime = Date.now() - (stateChangeTimeRef.current || Date.now())
      const progress = Math.min(1, elapsedTime / longPressDuration)

      // Draw progress circle
      ctx.beginPath()
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2 - 4,
        -Math.PI / 2,
        -Math.PI / 2 + progress * 2 * Math.PI,
      )
      ctx.strokeStyle = "rgba(255, 0, 0, 0.7)"
      ctx.lineWidth = 4
      ctx.stroke()
    }
  }, [
    currentFrame,
    imagesLoaded,
    animationState,
    isLongPressing,
    longPressDuration,
    stateChangeTimeRef,
    recordingState,
  ])

  // Animation loop
  useEffect(() => {
    // If idle, paused, or error, don't animate
    if (animationState === "idle" || animationState === "paused" || animationState === "error" || !imagesLoaded) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
      return
    }

    // Calculate animation parameters based on state
    const calculateAnimationParams = (timestamp: number) => {
      const elapsed = timestamp - stateChangeTimeRef.current

      switch (animationState) {
        case "speeding-up": {
          // Speed up over 1 second from 1 FPS to targetFps
          const speedUpDuration = 1000
          const progress = Math.min(1, elapsed / speedUpDuration)
          const newFps = 1 + (targetFps - 1) * progress
          animationProgressRef.current = 1 // Normal speed

          // If we've reached target FPS, transition to recording state
          if (progress >= 1) {
            setAnimationState("recording")
            return { fps: targetFps, frameSkipFactor: 1 }
          }

          return { fps: newFps, frameSkipFactor: 1 }
        }

        case "recording":
          // Maintain constant FPS during recording
          animationProgressRef.current = 1 // Normal speed
          return { fps: targetFps, frameSkipFactor: 1 }

        case "slowing-down": {
          // Slower deceleration over 3 seconds
          const slowdownDuration = 3000
          const progress = Math.min(1, elapsed / slowdownDuration)

          // Calculate animation progress (how fast we move through frames)
          // This creates a smooth deceleration from 100% to 0% speed
          const easedProgress = Math.pow(progress, 1.5) // Adjusted easing for smoother deceleration
          animationProgressRef.current = 1 - easedProgress

          // Keep rendering FPS high for smooth visuals
          const renderFps = Math.max(minSlowdownFps, targetFps * (1 - progress * 0.3))

          // Calculate frame skip factor (how many frames to advance per render)
          // As we slow down, we advance fewer frames per render
          const frameSkipFactor = animationProgressRef.current

          // If we've almost stopped, transition to idle
          if (progress >= 0.99) {
            setAnimationState("idle")
            setRecordingState("idle")
            return { fps: 0, frameSkipFactor: 0 }
          }

          return { fps: renderFps, frameSkipFactor }
        }

        default:
          return { fps: 0, frameSkipFactor: 0 }
      }
    }

    const animate = (timestamp: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = timestamp
      }

      // Calculate current animation parameters
      const { fps, frameSkipFactor } = calculateAnimationParams(timestamp)

      // If fps is 0, we've completed the animation
      if (fps === 0) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = undefined
        }
        setCurrentFrame(0) // Ensure we end on frame 0
        setAnimationState("idle")
        setRecordingState("idle")
        return
      }

      const frameIntervalMs = 1000 / fps
      const elapsed = timestamp - lastFrameTimeRef.current

      if (elapsed > frameIntervalMs) {
        // Update fractional frame progress
        frameProgressRef.current += frameSkipFactor

        // Only advance frame when we've accumulated enough progress
        if (frameProgressRef.current >= 1) {
          // Calculate how many frames to advance
          const framesToAdvance = Math.floor(frameProgressRef.current)
          frameProgressRef.current -= framesToAdvance

          // Update frame and handle special cases
          setCurrentFrame((prev) => {
            // Calculate next frame, considering we might skip multiple frames
            const next = (prev + framesToAdvance) % totalFrames

            // Special handling for the final rotation
            if (animationState === "slowing-down") {
              // If we're very slow (near the end of slowdown)
              if (animationProgressRef.current < 0.1) {
                // If we're approaching frame 0
                if (next <= 5 && prev > totalFrames / 2) {
                  // We're about to complete a rotation, land exactly on frame 0
                  return 0
                }
              }
            }

            return next
          })
        }

        lastFrameTimeRef.current = timestamp
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = undefined
      }
    }
  }, [animationState, imagesLoaded, targetFps, minSlowdownFps, stateChangeTimeRef])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      cleanup()

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [cleanup])

  // Determine button label based on state
  const getButtonLabel = () => {
    if (recordingState === "recording") {
      return "Tap to pause recording, hold to stop"
    } else if (recordingState === "paused") {
      return "Tap to resume recording, hold to stop"
    } else if (recordingState === "error") {
      return "Microphone access error, tap to retry"
    } else {
      return "Start recording"
    }
  }

  // Get status message based on state
  const getStatusMessage = () => {
    if (errorMessage) {
      return errorMessage
    }

    switch (recordingState) {
      case "recording":
        return "Tap to pause, hold for 1 second to stop"
      case "paused":
        return "Tap to resume, hold for 1 second to stop"
      case "error":
        return "Microphone access error. Please check permissions and try again."
      case "idle":
      default:
        return "Tap to start recording"
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onMouseDown={handleButtonPress}
        onMouseUp={handleButtonRelease}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleButtonPress}
        onTouchEnd={handleButtonRelease}
        className={`bg-transparent border-0 p-0 cursor-pointer focus:outline-none ${className}`}
        aria-label={getButtonLabel()}
      >
        <canvas ref={canvasRef} width={size} height={size} className="bg-black rounded-full" />

        {!imagesLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-white text-xs">Loading...</div>
          </div>
        )}
      </button>

      <div
        className={`text-sm text-center max-w-xs ${recordingState === "error" ? "text-red-500" : "text-muted-foreground"}`}
      >
        {getStatusMessage()}
      </div>
    </div>
  )
}
