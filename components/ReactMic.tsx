"use client"

import { Component, createRef } from "react"
import type React from "react"

// Define the props interface
export interface ReactMicProps {
  record: boolean
  className?: string
  onStop?: (blob: Blob, soundDetected: boolean) => void
  onData?: (blob: Blob, soundDetected: boolean) => void
  onStart?: () => void
  onSave?: (blob: Blob) => void
  audioElem?: HTMLAudioElement
  audioBitsPerSecond?: number
  mimeType?: string
  strokeColor?: string
  backgroundColor?: string
  visualSetting?: "sinewave" | "frequencyBars" | "frequencyCircles"
  width?: number
  height?: number
  echoCancellation?: boolean
  autoGainControl?: boolean
  noiseSuppression?: boolean
  channelCount?: number
}

interface ReactMicState {
  isRecording: boolean
  isStarting: boolean
}

// Simple implementation for visualization
class ReactMic extends Component<ReactMicProps, ReactMicState> {
  visualizerRef: React.RefObject<HTMLCanvasElement>
  animationFrameId: number | null = null
  dataInterval: NodeJS.Timeout | null = null

  static defaultProps = {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    strokeColor: "#000000",
    className: "visualizer",
    audioBitsPerSecond: 128000,
    mimeType: "audio/mp3",
    record: false,
    width: 640,
    height: 100,
    visualSetting: "sinewave",
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    channelCount: 2,
  }

  constructor(props: ReactMicProps) {
    super(props)
    this.visualizerRef = createRef<HTMLCanvasElement>()
    this.state = {
      isRecording: false,
      isStarting: false,
    }
  }

  componentDidMount() {
    // Initialize canvas and start visualization
    this.drawVisualizer()

    // Call onStart if recording is already active
    if (this.props.record && this.props.onStart) {
      this.props.onStart()
    }
  }

  componentDidUpdate(prevProps: ReactMicProps) {
    // Handle record state changes
    if (prevProps.record !== this.props.record) {
      if (this.props.record) {
        // Started recording
        this.setState({ isRecording: true, isStarting: true })

        // Simulate a slight delay before starting
        setTimeout(() => {
          this.setState({ isStarting: false })
          if (this.props.onStart) {
            this.props.onStart()
          }

          // Set up interval to simulate data chunks
          this.dataInterval = setInterval(() => {
            this.simulateDataChunk()
          }, 5000) // Send a chunk every 5 seconds
        }, 500)
      } else if (prevProps.record) {
        // Stopped recording
        this.setState({ isRecording: false })

        // Clear data interval
        if (this.dataInterval) {
          clearInterval(this.dataInterval)
          this.dataInterval = null
        }

        if (this.props.onStop) {
          // Create a mock blob for demo purposes
          const blob = new Blob([new Uint8Array(1000).buffer], { type: "audio/mp3" })
          this.props.onStop(blob, true)
        }
      }
    }

    // Update visualization
    this.drawVisualizer()
  }

  componentWillUnmount() {
    // Clean up animation frame
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
    }

    // Clean up data interval
    if (this.dataInterval) {
      clearInterval(this.dataInterval)
    }
  }

  drawVisualizer = () => {
    const canvas = this.visualizerRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const { width, height, backgroundColor, strokeColor, record } = this.props

    // Clear canvas
    ctx.fillStyle = backgroundColor!
    ctx.fillRect(0, 0, width!, height!)

    // Draw visualization
    if (record) {
      ctx.beginPath()
      ctx.strokeStyle = strokeColor!
      ctx.lineWidth = 2

      // Draw a simple sine wave for visualization
      const amplitude = height! / 4
      const frequency = 0.05
      const offset = height! / 2

      ctx.moveTo(0, offset)

      for (let x = 0; x < width!; x++) {
        const y = amplitude * Math.sin(x * frequency + Date.now() * 0.01) + offset
        ctx.lineTo(x, y)
      }

      ctx.stroke()

      // Request animation frame for continuous updates if recording
      this.animationFrameId = requestAnimationFrame(() => this.drawVisualizer())
    } else {
      // Draw a flat line when not recording
      ctx.beginPath()
      ctx.strokeStyle = strokeColor!
      ctx.lineWidth = 2
      ctx.moveTo(0, height! / 2)
      ctx.lineTo(width!, height! / 2)
      ctx.stroke()

      // Cancel animation frame if not recording
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }
  }

  simulateDataChunk = () => {
    if (this.props.record && this.props.onData) {
      // Create a mock blob with some actual size
      const blob = new Blob([new Uint8Array(5000).buffer], { type: "audio/mp3" })
      this.props.onData(blob, true)
    }
  }

  render() {
    const { width, height, className, record } = this.props
    const { isStarting } = this.state

    return (
      <div className="relative">
        <canvas ref={this.visualizerRef} width={width} height={height} className={className} />
        {isStarting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>
    )
  }
}

export { ReactMic }
