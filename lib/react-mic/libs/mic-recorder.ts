"use client"

interface MicRecorderConfig {
  bitRate?: number
  sampleRate?: number
  bufferSize?: number
  channels?: number
}

class MicRecorder {
  private config: MicRecorderConfig
  private activeStream: MediaStream | null
  private context: AudioContext | null
  private microphone: MediaStreamAudioSourceNode | null
  private processor: ScriptProcessorNode | null
  private startTime: number
  private analyser: AnalyserNode | null
  private chunks: Blob[]

  constructor(options: MicRecorderConfig = {}) {
    this.config = {
      bitRate: options.bitRate || 128,
      sampleRate: options.sampleRate || 44100,
      bufferSize: options.bufferSize || 4096,
      channels: options.channels || 2,
    }

    this.activeStream = null
    this.context = null
    this.microphone = null
    this.processor = null
    this.startTime = 0
    this.analyser = null
    this.chunks = []
  }

  async start(): Promise<void> {
    if (typeof window === "undefined" || !navigator.mediaDevices) {
      return Promise.reject(new Error("MediaDevices API not available"))
    }

    try {
      // Get audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.activeStream = stream

      // Store a global reference for Safari
      if (typeof window !== "undefined") {
        // @ts-ignore
        window.microphoneStream = stream
      }

      // Create audio context
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      this.context = new AudioContext()

      // Create analyzer
      this.analyser = this.context.createAnalyser()
      this.analyser.fftSize = 2048

      // Connect microphone to analyzer
      this.microphone = this.context.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)

      // Reset chunks
      this.chunks = []

      return Promise.resolve()
    } catch (error) {
      return Promise.reject(error)
    }
  }

  stop(): void {
    if (this.activeStream) {
      this.activeStream.getTracks().forEach((track) => track.stop())
      this.activeStream = null
    }

    if (this.microphone) {
      this.microphone.disconnect()
      this.microphone = null
    }

    if (this.analyser) {
      this.analyser.disconnect()
      this.analyser = null
    }

    if (this.context && this.context.state !== "closed") {
      this.context.close()
      this.context = null
    }

    // Clear global reference
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.microphoneStream = null
    }
  }

  getStream(): MediaStream | null {
    return this.activeStream
  }

  async getMp3(): Promise<[Blob[], Blob]> {
    // For simplicity, we're just returning the raw audio data
    // In a real implementation, you'd convert to MP3 here
    const blob = new Blob(this.chunks, { type: "audio/webm" })
    return [this.chunks, blob]
  }

  // Add audio data to chunks
  addChunk(data: Blob): void {
    this.chunks.push(data)
  }
}

export default MicRecorder
