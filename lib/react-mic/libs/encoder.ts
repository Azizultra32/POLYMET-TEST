"use client"

// We'll create a wrapper for lamejs that only loads on the client side
let Mp3Encoder: any = null

// Function to dynamically load lamejs only when needed
const loadLamejs = async () => {
  if (typeof window === "undefined") return null

  if (!Mp3Encoder) {
    try {
      // Dynamic import to ensure it only runs on client
      const lamejs = await import("lamejs")
      Mp3Encoder = lamejs.Mp3Encoder
      return Mp3Encoder
    } catch (err) {
      console.error("Failed to load lamejs:", err)
      return null
    }
  }

  return Mp3Encoder
}

class Encoder {
  config: {
    sampleRate: number
    bitRate: number
  }
  mp3Encoder: any
  maxSamples: number
  samplesMono: Int16Array | null
  dataBuffer: Int8Array[]

  constructor(config: { sampleRate?: number; bitRate?: number } = {}) {
    this.config = {
      sampleRate: 44100,
      bitRate: 128,
    }

    Object.assign(this.config, config)

    // Initialize with null - we'll set it properly in encode()
    this.mp3Encoder = null

    // Audio is processed by frames of 1152 samples per audio channel
    this.maxSamples = 1152

    this.samplesMono = null
    this.dataBuffer = []
  }

  /**
   * Clear active buffer
   */
  clearBuffer() {
    this.dataBuffer = []
  }

  /**
   * Append new audio buffer to current active buffer
   * @param {Buffer} buffer
   */
  appendToBuffer(buffer: Int8Array) {
    this.dataBuffer.push(new Int8Array(buffer))
  }

  /**
   * Float current data to 16 bits PCM
   * @param {Float32Array} input
   * @param {Int16Array} output
   */
  floatTo16BitPCM(input: Float32Array, output: Int16Array) {
    for (let i = 0; i < input.length; i++) {
      const s = Math.max(-1, Math.min(1, input[i]))
      output[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
  }

  /**
   * Convert buffer to proper format
   * @param {ArrayBuffer} arrayBuffer
   */
  convertBuffer(arrayBuffer: Float32Array) {
    const data = new Float32Array(arrayBuffer)
    const out = new Int16Array(arrayBuffer.length)
    this.floatTo16BitPCM(data, out)

    return out
  }

  /**
   * Encode and append current buffer to dataBuffer
   * @param {ArrayBuffer} arrayBuffer
   */
  async encode(arrayBuffer: Float32Array) {
    try {
      // Ensure Mp3Encoder is loaded
      if (!this.mp3Encoder) {
        const encoder = await loadLamejs()
        if (!encoder) {
          console.error("Failed to load MP3 encoder")
          return
        }
        this.mp3Encoder = new encoder(1, this.config.sampleRate, this.config.bitRate)
      }

      this.samplesMono = this.convertBuffer(arrayBuffer)
      let remaining = this.samplesMono.length

      for (let i = 0; remaining >= 0; i += this.maxSamples) {
        const left = this.samplesMono.subarray(i, i + this.maxSamples)
        const mp3buffer = this.mp3Encoder.encodeBuffer(left)
        this.appendToBuffer(mp3buffer)
        remaining -= this.maxSamples
      }
    } catch (error) {
      console.error("Error encoding audio:", error)
      // Create a fallback empty buffer if encoding fails
      this.appendToBuffer(new Int8Array(0))
    }
  }

  /**
   * Return full dataBuffer
   */
  async finish() {
    try {
      // Ensure Mp3Encoder is loaded
      if (!this.mp3Encoder) {
        const encoder = await loadLamejs()
        if (!encoder) {
          console.error("Failed to load MP3 encoder")
          return []
        }
        this.mp3Encoder = new encoder(1, this.config.sampleRate, this.config.bitRate)
      }

      this.appendToBuffer(this.mp3Encoder.flush())
      return this.dataBuffer
    } catch (error) {
      console.error("Error finishing encoding:", error)
      return []
    }
  }
}

export default Encoder
