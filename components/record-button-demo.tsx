"use client"

import { useState } from "react"
import RecordButton from "./record-button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function RecordButtonDemo() {
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped">("idle")
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null)

  const handleRecordingStart = () => {
    setRecordingState("recording")
    setAudioUrl(null)

    // Start a timer to track recording duration
    const startTime = Date.now()
    const interval = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    setTimerInterval(interval)
  }

  const handleRecordingPause = () => {
    setRecordingState("paused")

    // Pause the timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  const handleRecordingResume = () => {
    setRecordingState("recording")

    // Resume the timer
    const startTime = Date.now() - recordingDuration * 1000
    const interval = setInterval(() => {
      setRecordingDuration(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    setTimerInterval(interval)
  }

  const handleRecordingStop = (audioBlob: Blob, url: string) => {
    setRecordingState("stopped")
    setAudioUrl(url)

    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  const handleError = (error: Error) => {
    console.error("Recording error:", error)
    setRecordingState("idle")

    // Stop the timer
    if (timerInterval) {
      clearInterval(timerInterval)
      setTimerInterval(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const resetRecording = () => {
    setRecordingState("idle")
    setAudioUrl(null)
    setRecordingDuration(0)
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="text-center">
        <h3 className="text-lg font-medium mb-2">
          {recordingState === "idle"
            ? "Ready to Record"
            : recordingState === "recording"
              ? "Recording..."
              : recordingState === "paused"
                ? "Paused"
                : "Recording Complete"}
        </h3>

        {(recordingState === "recording" || recordingState === "paused") && (
          <div className="text-2xl font-mono">{formatTime(recordingDuration)}</div>
        )}
      </div>

      <RecordButton
        size={120}
        onRecordingStart={handleRecordingStart}
        onRecordingPause={handleRecordingPause}
        onRecordingResume={handleRecordingResume}
        onRecordingStop={handleRecordingStop}
        onError={handleError}
        className="mb-4"
      />

      {audioUrl && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Recording Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <audio src={audioUrl} controls className="w-full mb-4" />
            <Button onClick={resetRecording} variant="outline" className="w-full">
              New Recording
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="text-sm text-muted-foreground mt-4 text-center max-w-md">
        <p>Tap the button to start recording. Tap again to pause, or hold for 1 second to stop.</p>
        <p className="mt-2">The animation will speed up when recording starts and slow down when recording stops.</p>
      </div>
    </div>
  )
}
