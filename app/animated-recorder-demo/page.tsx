"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AudioRecorderWithAnimation from "@/components/audio-recorder-with-animation"
import RecordButtonDemo from "@/components/record-button-demo"
import type { TranscriptData } from "@/types/types"

export default function AnimatedRecorderDemoPage() {
  const [recordingInfo, setRecordingInfo] = useState<TranscriptData | null>(null)

  const handleRecordingStart = (patient: TranscriptData) => {
    console.log("Recording started:", patient)
    setRecordingInfo(patient)
  }

  const handleRecordingStop = (patient: TranscriptData) => {
    console.log("Recording stopped:", patient)
    setRecordingInfo(null)
  }

  const handleUploadComplete = (patient: TranscriptData) => {
    console.log("Upload complete:", patient)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Animated Record Button Demo</h1>

      <Tabs defaultValue="recorder" className="max-w-3xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="recorder">Full Recorder</TabsTrigger>
          <TabsTrigger value="button">Button Only</TabsTrigger>
        </TabsList>

        <TabsContent value="recorder" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Audio Recorder with Animated Button</CardTitle>
              <CardDescription>Full audio recorder implementation with the new animated record button</CardDescription>
            </CardHeader>
            <CardContent>
              <AudioRecorderWithAnimation
                patientCode="Demo Patient"
                onRecording={handleRecordingStart}
                onStopRecording={handleRecordingStop}
                onUploadComplete={handleUploadComplete}
              />

              {recordingInfo && (
                <div className="mt-6 p-4 border rounded-md bg-blue-50 border-blue-200">
                  <h3 className="font-medium mb-2">Recording in Progress</h3>
                  <p className="text-sm">Patient: {recordingInfo.patient_code}</p>
                  <p className="text-sm">ID: {recordingInfo.mid}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="button" className="mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Animated Record Button</CardTitle>
              <CardDescription>Interactive demo of just the record button component</CardDescription>
            </CardHeader>
            <CardContent>
              <RecordButtonDemo />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="max-w-3xl mx-auto mt-8">
        <CardHeader>
          <CardTitle>Implementation Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            The animated record button provides a modern, intuitive interface for audio recording with clear visual
            feedback:
          </p>

          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Color-coded states:</strong> Green for idle, red for recording, amber for paused, blue for
              processing
            </li>
            <li>
              <strong>Animated transitions:</strong> Smooth animations between states provide clear visual feedback
            </li>
            <li>
              <strong>Long-press detection:</strong> Hold the button to stop recording with a visual progress indicator
            </li>
            <li>
              <strong>Pulsing effect:</strong> During recording, a pulsing animation indicates active recording
            </li>
            <li>
              <strong>Accessibility:</strong> Proper ARIA labels and visual indicators for all states
            </li>
          </ul>

          <p className="text-sm text-muted-foreground mt-4">
            The button is built with canvas animations and is fully customizable to match your application's design.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
