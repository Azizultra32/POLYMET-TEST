"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import AnimatedAudioRecorder from "@/components/animated-audio-recorder"
import type { TranscriptData } from "@/types/types"

export default function AnimatedRecorderDemo() {
  const [recordingInfo, setRecordingInfo] = useState<TranscriptData | null>(null)
  const [uploadedRecordings, setUploadedRecordings] = useState<TranscriptData[]>([])

  const handleRecordingStart = (patient: TranscriptData) => {
    console.log("Recording started:", patient)
    setRecordingInfo(patient)
  }

  const handleRecordingStop = (patient: TranscriptData) => {
    console.log("Recording stopped:", patient)
  }

  const handleUploadComplete = (patient: TranscriptData) => {
    console.log("Upload complete:", patient)
    setRecordingInfo(null)
    setUploadedRecordings((prev) => [patient, ...prev])
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Animated Audio Recorder</h1>

        <div className="grid gap-8">
          <AnimatedAudioRecorder
            patientCode="Demo Patient"
            onRecording={handleRecordingStart}
            onStopRecording={handleRecordingStop}
            onUploadComplete={handleUploadComplete}
          />

          <Card>
            <CardHeader>
              <CardTitle>How To Use</CardTitle>
              <CardDescription>Instructions for using the new audio recorder</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  1
                </div>
                <div>
                  <h3 className="font-medium">Start Recording</h3>
                  <p className="text-sm text-muted-foreground">Tap the green button to start recording.</p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  2
                </div>
                <div>
                  <h3 className="font-medium">Pause/Resume</h3>
                  <p className="text-sm text-muted-foreground">
                    Tap the red button again to pause, tap the amber button to resume.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  3
                </div>
                <div>
                  <h3 className="font-medium">Stop Recording</h3>
                  <p className="text-sm text-muted-foreground">
                    Press and hold the record button for 1.5 seconds to stop and save.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold">
                  4
                </div>
                <div>
                  <h3 className="font-medium">Voice Commands</h3>
                  <p className="text-sm text-muted-foreground">
                    Try saying "start recording", "pause recording", or "stop recording".
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {uploadedRecordings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Recordings</CardTitle>
                <CardDescription>Your saved recordings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uploadedRecordings.map((recording, index) => (
                    <div key={index} className="p-3 border rounded-md">
                      <div className="font-medium">{recording.patient_code}</div>
                      <div className="text-sm text-muted-foreground">
                        {recording.token_count} audio chunks • ID: {recording.mid?.substring(0, 8)}...
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
