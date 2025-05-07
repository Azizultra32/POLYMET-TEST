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

export interface MicRecorderConfig {
  bitRate?: number
  startRecordingAt?: number
  deviceId?: string | null
  sampleRate?: number
}
