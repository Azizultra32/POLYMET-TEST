"use client"

import AudioContext from "./AudioContext"

class Visualizer {
  static visualizeSineWave(
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor: string,
    strokeColor: string,
  ) {
    const analyser = AudioContext.getAnalyser()
    if (!analyser) return

    const bufferLength = analyser.fftSize
    const dataArray = new Uint8Array(bufferLength)

    canvasCtx.clearRect(0, 0, width, height)
    canvasCtx.fillStyle = backgroundColor
    canvasCtx.fillRect(0, 0, width, height)
    canvasCtx.lineWidth = 2
    canvasCtx.strokeStyle = strokeColor
    canvasCtx.beginPath()

    const draw = () => {
      requestAnimationFrame(draw)
      analyser.getByteTimeDomainData(dataArray)

      // Check for sound detection
      AudioContext.detectSound(dataArray)

      canvasCtx.fillStyle = backgroundColor
      canvasCtx.fillRect(0, 0, width, height)
      canvasCtx.lineWidth = 2
      canvasCtx.strokeStyle = strokeColor
      canvasCtx.beginPath()

      const sliceWidth = width / bufferLength
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = (v * height) / 2

        if (i === 0) {
          canvasCtx.moveTo(x, y)
        } else {
          canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      canvasCtx.lineTo(width, height / 2)
      canvasCtx.stroke()
    }

    draw()
  }

  static visualizeFrequencyBars(
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor: string,
    strokeColor: string,
  ) {
    const analyser = AudioContext.getAnalyser()
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    canvasCtx.clearRect(0, 0, width, height)
    canvasCtx.fillStyle = backgroundColor
    canvasCtx.fillRect(0, 0, width, height)

    const draw = () => {
      requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Check for sound detection
      AudioContext.detectSound(dataArray)

      canvasCtx.fillStyle = backgroundColor
      canvasCtx.fillRect(0, 0, width, height)

      const barWidth = (width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height

        canvasCtx.fillStyle = strokeColor
        canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight)

        x += barWidth + 1
      }
    }

    draw()
  }

  static visualizeFrequencyCircles(
    canvasCtx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    width: number,
    height: number,
    backgroundColor: string,
    strokeColor: string,
  ) {
    const analyser = AudioContext.getAnalyser()
    if (!analyser) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    canvasCtx.clearRect(0, 0, width, height)
    canvasCtx.fillStyle = backgroundColor
    canvasCtx.fillRect(0, 0, width, height)

    const draw = () => {
      requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Check for sound detection
      AudioContext.detectSound(dataArray)

      canvasCtx.fillStyle = backgroundColor
      canvasCtx.fillRect(0, 0, width, height)

      // Draw circles
      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) / 2

      for (let i = 0; i < bufferLength; i += 10) {
        const radius = (dataArray[i] / 255) * maxRadius

        canvasCtx.beginPath()
        canvasCtx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
        canvasCtx.strokeStyle = strokeColor
        canvasCtx.stroke()
      }
    }

    draw()
  }
}

export default Visualizer
