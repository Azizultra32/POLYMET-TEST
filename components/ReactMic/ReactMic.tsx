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
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  mediaStream: MediaStream | null
  mediaRecorder: MediaRecorder | null
  audioChunks: Blob[]
  soundDetected: boolean
}

// AudioContext singleton
const AudioContextSingleton = {
  audioContext: null as AudioContext | null,
  analyser: null as AnalyserNode | null,
  soundDetected: false,

  getAudioContext() {
    if (!this.audioContext) {
      try {
        window.AudioContext = window.AudioContext || (window as any).webkitAudioContext
        this.audioContext = new AudioContext()
      } catch (e) {
        console.error("Web Audio API is not supported in this browser", e)
      }
    }
    return this.audioContext
  },

  getAnalyser() {
    if (!this.analyser && this.audioContext) {
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.minDecibels = -90
      this.analyser.maxDecibels = -10
      this.analyser.smoothingTimeConstant = 0.85
    }
    return this.analyser
  },

  setSoundDetected(detected: boolean) {
    this.soundDetected = detected
  },
}

class ReactMic extends Component<ReactMicProps, ReactMicState> {
  visualizerRef: React.RefObject<HTMLCanvasElement>
  animationFrameId: number | null = null
  dataInterval: NodeJS.Timeout | null = null
  microphoneStream: MediaStream | null = null

  static defaultProps = {
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    strokeColor: "#000000",
    className: "visualizer",
    audioBitsPerSecond: 128000,
    mimeType: "audio/webm;codecs=opus",
    record: false,
    width: 640,
    height: 100,
    visualSetting: "sinewave",
    echoCancellation: true,
    autoGainControl: true,
    noiseSuppression: true,
    channelCount: 1,
  }

  constructor(props: ReactMicProps) {
    super(props)
    this.visualizerRef = createRef<HTMLCanvasElement>()
    this.state = {
      isRecording: false,
      isStarting: false,
      audioContext: null,
      analyser: null,
      mediaStream: null,
      mediaRecorder: null,
      audioChunks: [],
      soundDetected: false,
    }
  }

  componentDidMount() {
    // Initialize audio context
    this.initAudioContext()

    // Start visualization
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
        this.startRecording()
      } else if (prevProps.record) {
        // Stopped recording
        this.stopRecording()
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

    // Clean up audio resources
    this.stopMicrophone()
  }

  initAudioContext = () => {
    if (typeof window === "undefined") return

    try {
      const audioContext = AudioContextSingleton.getAudioContext()
      const analyser = AudioContextSingleton.getAnalyser()

      if (audioContext && analyser) {
        this.setState({ audioContext, analyser })
      }
    } catch (error) {
      console.error("Error initializing audio context:", error)
    }
  }

  startRecording = async () => {
    try {
      // Check if MediaRecorder is supported
      if (typeof MediaRecorder === "undefined") {
        console.error("MediaRecorder is not supported in this browser")
        this.setState({ isRecording: false, isStarting: false })
        return
      }

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.props.echoCancellation,
          autoGainControl: this.props.autoGainControl,
          noiseSuppression: this.props.noiseSuppression,
          channelCount: this.props.channelCount,
        },
      })

      this.microphoneStream = stream

      // Set up audio processing
      const { audioContext, analyser } = this.state

      if (!audioContext || !analyser) {
        this.initAudioContext()
      }

      // Get updated context and analyser
      const updatedContext = this.state.audioContext || AudioContextSingleton.getAudioContext()
      const updatedAnalyser = this.state.analyser || AudioContextSingleton.getAnalyser()

      if (!updatedContext || !updatedAnalyser) {
        throw new Error("Failed to initialize audio context")
      }

      // Connect microphone to analyser
      const microphone = updatedContext.createMediaStreamSource(stream)
      microphone.connect(updatedAnalyser)

      // Check if the browser supports the specified mimeType
      let mimeType = this.props.mimeType
      if (!MediaRecorder.isTypeSupported(mimeType!)) {
        // Fallback to a more widely supported format
        mimeType = "audio/webm"
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "" // Let the browser choose
        }
        console.warn(`Specified mimeType ${this.props.mimeType} not supported, using ${mimeType || "browser default"}`)
      }

      // Create media recorder with options
      const options: MediaRecorderOptions = {
        audioBitsPerSecond: this.props.audioBitsPerSecond,
      }

      if (mimeType) {
        options.mimeType = mimeType
      }

      const mediaRecorder = new MediaRecorder(stream, options)

      // Set up data handling
      const audioChunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        // Combine all audio chunks into a single blob
        const audioBlob = new Blob(audioChunks, { type: mimeType || "audio/webm" })

        // Call onStop callback
        if (this.props.onStop) {
          this.props.onStop(audioBlob, this.state.soundDetected)
        }

        // Reset state
        this.setState({
          isRecording: false,
          isStarting: false,
          audioChunks: [],
          soundDetected: false,
        })

        // Stop microphone
        this.stopMicrophone()
      }

      // Start recording
      mediaRecorder.start()

      // Set up interval to send data chunks periodically
      this.dataInterval = setInterval(() => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
          mediaRecorder.requestData()

          // Create a blob from current chunks and send it
          if (audioChunks.length > 0 && this.props.onData) {
            const audioBlob = new Blob(audioChunks, { type: mimeType || "audio/webm" })
            this.props.onData(audioBlob, this.state.soundDetected)

            // Clear chunks after sending
            audioChunks.length = 0
          }
        }
      }, 10000) // 10 seconds

      // Update state
      this.setState({
        mediaStream: stream,
        mediaRecorder,
        audioChunks,
        isStarting: false,
      })

      // Call onStart callback
      if (this.props.onStart) {
        this.props.onStart()
      }
    } catch (error) {
      console.error("Error starting recording:", error)
      this.setState({ isRecording: false, isStarting: false })

      // Create a mock blob for the onStop callback to prevent further errors
      if (this.props.onStop) {
        const emptyBlob = new Blob([], { type: "audio/webm" })
        this.props.onStop(emptyBlob, false)
      }
    }
  }

  stopRecording = () => {
    const { mediaRecorder } = this.state

    if (mediaRecorder && mediaRecorder.state === "recording") {
      try {
        mediaRecorder.stop()
      } catch (error) {
        console.error("Error stopping media recorder:", error)
        // Create a mock blob for the onStop callback
        if (this.props.onStop) {
          const emptyBlob = new Blob([], { type: "audio/webm" })
          this.props.onStop(emptyBlob, false)
        }
      }
    } else {
      // If mediaRecorder is not available or not recording, still call onStop
      if (this.props.onStop) {
        const emptyBlob = new Blob([], { type: "audio/webm" })
        this.props.onStop(emptyBlob, false)
      }
    }

    // Clear data interval
    if (this.dataInterval) {
      clearInterval(this.dataInterval)
      this.dataInterval = null
    }

    this.setState({ isRecording: false })
  }

  stopMicrophone = () => {
    if (this.microphoneStream) {
      try {
        this.microphoneStream.getTracks().forEach((track) => track.stop())
      } catch (error) {
        console.error("Error stopping microphone tracks:", error)
      }
      this.microphoneStream = null
    }
  }

  drawVisualizer = () => {
    const canvas = this.visualizerRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const {
      width = 640,
      height = 100,
      backgroundColor = "rgba(255, 255, 255, 0.5)",
      strokeColor = "#000000",
      record,
    } = this.props
    const { analyser, mediaStream } = this.state

    // Clear canvas
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw visualization
    if (record && analyser && mediaStream) {
      try {
        // Set up analyser
        analyser.fftSize = 2048
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        // Get frequency data
        analyser.getByteTimeDomainData(dataArray)

        // Check if sound is detected
        let soundDetected = false
        for (let i = 0; i < bufferLength; i++) {
          if (Math.abs(dataArray[i] - 128) > 10) {
            soundDetected = true
            break
          }
        }

        if (soundDetected !== this.state.soundDetected) {
          this.setState({ soundDetected })
          AudioContextSingleton.setSoundDetected(soundDetected)
        }

        // Draw waveform
        ctx.lineWidth = 2
        ctx.strokeStyle = strokeColor
        ctx.beginPath()

        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }

          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
      } catch (error) {
        console.error("Error drawing visualizer:", error)
        // Draw a flat line as fallback
        ctx.beginPath()
        ctx.strokeStyle = strokeColor
        ctx.lineWidth = 2
        ctx.moveTo(0, height / 2)
        ctx.lineTo(width, height / 2)
        ctx.stroke()
      }

      // Request animation frame for continuous updates if recording
      this.animationFrameId = requestAnimationFrame(() => this.drawVisualizer())
    } else {
      // Draw a flat line when not recording
      ctx.beginPath()
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = 2
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()

      // Cancel animation frame if not recording
      if (this.animationFrameId) {
        cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = null
      }
    }
  }

  render() {
    const { width, height, className } = this.props
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

export default ReactMic
