"use client"

class AudioContextManager {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private soundDetected = false
  private soundDetectionThreshold = -50 // dB

  constructor() {
    this.audioContext = null
    this.analyser = null
    this.soundDetected = false
    this.soundDetectionThreshold = -50 // dB
  }

  getAudioContext() {
    if (!this.audioContext && typeof window !== "undefined") {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        if (AudioContext) {
          this.audioContext = new AudioContext()
        }
      } catch (e) {
        console.error("Web Audio API is not supported in this browser", e)
      }
    }
    return this.audioContext
  }

  getAnalyser() {
    if (!this.analyser && this.getAudioContext()) {
      this.analyser = this.audioContext!.createAnalyser()
      this.analyser.minDecibels = this.soundDetectionThreshold
      this.analyser.fftSize = 2048
    }
    return this.analyser
  }

  setSoundDetected(detected: boolean) {
    this.soundDetected = detected
  }

  getSoundDetected() {
    return this.soundDetected
  }

  detectSound(dataArray: Uint8Array) {
    if (!dataArray || !dataArray.length) return false

    // Calculate average volume
    const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length

    // Detect if sound is above threshold
    const detected = average > 128 * 0.2 // 20% of max volume

    if (detected) {
      this.setSoundDetected(true)
    }

    return detected
  }

  close() {
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
      this.analyser = null
    }
  }
}

// Create a singleton instance
const AudioContext = new AudioContextManager()
export default AudioContext
