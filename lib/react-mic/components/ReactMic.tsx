"use client"

import { Component, createRef } from "react"
import type React from "react"
import AudioContext from "../libs/AudioContext"
import Visualizer from "../libs/Visualizer"
import MicRecorder from "../libs/mic-recorder"

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
  onStreamAvailable?: (stream: MediaStream) => void // New prop
}

interface ReactMicState {
  microphoneRecorder: MicRecorder | null
  canvas: HTMLCanvasElement | null
  canvasCtx: CanvasRenderingContext2D | null
}

export class ReactMic extends Component<ReactMicProps, ReactMicState> {
  visualizerRef: React.RefObject<HTMLCanvasElement>
  interval: NodeJS.Timeout | null = null

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
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    channelCount: 2,
  }

  constructor(props: ReactMicProps) {
    super(props)
    this.state = {
      microphoneRecorder: null,
      canvas: null,
      canvasCtx: null,
    }
    this.visualizerRef = createRef<HTMLCanvasElement>()
    this.interval = null
  }

  componentDidMount() {
    const { onSave, onStop, onStart, onData, audioElem, audioBitsPerSecond, mimeType } = this.props
    const visualizer = this.visualizerRef.current

    if (!visualizer) return

    const canvas = visualizer
    const canvasCtx = canvas.getContext("2d")

    if (!canvasCtx) return

    const options = {
      audioBitsPerSecond,
      mimeType,
    }

    if (audioElem) {
      // For playback
      this.setState({ canvas, canvasCtx }, () => {
        this.visualize()
      })
    } else {
      // For recording
      this.setState(
        {
          microphoneRecorder: new MicRecorder({ bitRate: 128 }),
          canvas,
          canvasCtx,
        },
        () => {
          this.visualize()
        },
      )
    }
  }

  componentDidUpdate(prevProps: ReactMicProps) {
    const { record, onStart, onStop, onData } = this.props
    const { microphoneRecorder } = this.state

    if (prevProps.record !== record) {
      if (record) {
        if (microphoneRecorder) {
          microphoneRecorder
            .start()
            .then(() => {
              if (onStart) onStart()

              // Expose the stream to parent component if callback is provided
              if (this.props.onStreamAvailable && microphoneRecorder.getStream()) {
                this.props.onStreamAvailable(microphoneRecorder.getStream())
              }

              // Set up interval for data chunks
              this.interval = setInterval(() => {
                if (microphoneRecorder && onData) {
                  microphoneRecorder
                    .getMp3()
                    .then(([buffer, blob]) => {
                      const soundDetected = AudioContext.getSoundDetected()
                      AudioContext.setSoundDetected(false)
                      onData(blob, soundDetected)
                    })
                    .catch((e) => console.log(e))
                }
              }, 10000) // Every 10 seconds
            })
            .catch((e) => console.error(e))
        }
      } else if (microphoneRecorder) {
        // Clear interval
        if (this.interval) {
          clearInterval(this.interval)
          this.interval = null
        }

        microphoneRecorder
          .getMp3()
          .then(([buffer, blob]) => {
            const soundDetected = AudioContext.getSoundDetected()
            AudioContext.setSoundDetected(false)
            if (onStop) onStop(blob, soundDetected)
            this.clear()
            microphoneRecorder.stop()
          })
          .catch((e) => console.log(e))
      }
    }
  }

  componentWillUnmount() {
    const { microphoneRecorder } = this.state

    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }

    if (microphoneRecorder) {
      microphoneRecorder.stop()
    }
  }

  visualize = () => {
    const { backgroundColor, strokeColor, width, height, visualSetting } = this.props
    const { canvas, canvasCtx } = this.state

    if (!canvas || !canvasCtx) return

    if (visualSetting === "sinewave") {
      Visualizer.visualizeSineWave(canvasCtx, canvas, width!, height!, backgroundColor!, strokeColor!)
    } else if (visualSetting === "frequencyBars") {
      Visualizer.visualizeFrequencyBars(canvasCtx, canvas, width!, height!, backgroundColor!, strokeColor!)
    } else if (visualSetting === "frequencyCircles") {
      Visualizer.visualizeFrequencyCircles(canvasCtx, canvas, width!, height!, backgroundColor!, strokeColor!)
    }
  }

  clear() {
    const { width, height } = this.props
    const { canvasCtx } = this.state

    if (canvasCtx) {
      canvasCtx.clearRect(0, 0, width!, height!)
    }
  }

  render() {
    const { width, height, className } = this.props

    return <canvas ref={this.visualizerRef} height={height} width={width} className={className} />
  }
}

export default ReactMic
