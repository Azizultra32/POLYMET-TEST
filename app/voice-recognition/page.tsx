"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import EnhancedAudioRecorder from "@/components/enhanced-audio-recorder"
import type { TranscriptData } from "@/types/types"

export default function VoiceRecognitionPage() {
  const [recordings, setRecordings] = useState<TranscriptData[]>([])
  const [currentRecording, setCurrentRecording] = useState<TranscriptData | null>(null)

  const handleRecordingStart = (patient: TranscriptData) => {
    console.log("Recording started:", patient)
    setCurrentRecording(patient)
  }

  const handleRecordingStop = (patient: TranscriptData) => {
    console.log("Recording stopped:", patient)
  }

  const handleUploadComplete = (patient: TranscriptData) => {
    console.log("Upload complete:", patient)
    setRecordings((prev) => [patient, ...prev])
    setCurrentRecording(null)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Voice Recognition Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <EnhancedAudioRecorder
            onRecording={handleRecordingStart}
            onStopRecording={handleRecordingStop}
            onUploadComplete={handleUploadComplete}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recordings ({recordings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {recordings.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No recordings yet</p>
          ) : (
            <div className="space-y-4">
              {recordings.map((recording) => (
                <div key={recording.mid} className="p-4 border rounded-md">
                  <div className="flex justify-between">
                    <h3 className="font-medium">{recording.patient_code}</h3>
                    <span className="text-sm text-muted-foreground">{recording.token_count} chunks</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">ID: {recording.mid.substring(0, 8)}...</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
