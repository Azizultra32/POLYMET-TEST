"use client"

import { useState } from "react"
import AudioRecorder from "@/components/audio-recorder"
import AnimatedAudioRecorder from "@/components/animated-audio-recorder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import type { TranscriptData } from "@/types/types"

export default function RecorderComparisonPage() {
  const [activeTab, setActiveTab] = useState<string>("enhanced")
  const [recordingPatient, setRecordingPatient] = useState<TranscriptData | null>(null)

  const handleRecordingStart = (patient: TranscriptData) => {
    console.log("Recording started:", patient)
    setRecordingPatient(patient)
  }

  const handleRecordingStop = (patient: TranscriptData) => {
    console.log("Recording stopped:", patient)
    setRecordingPatient(null)
  }

  const handleUploadComplete = (patient: TranscriptData) => {
    console.log("Upload complete:", patient)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Audio Recorder UI Comparison</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-3xl mx-auto">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="traditional">Traditional UI</TabsTrigger>
          <TabsTrigger value="enhanced">Enhanced UI</TabsTrigger>
        </TabsList>

        <div className="grid gap-8">
          <TabsContent value="traditional" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Traditional Record UI</CardTitle>
                <CardDescription>The classic audio recorder interface</CardDescription>
              </CardHeader>
              <CardContent>
                <AudioRecorder
                  patientCode="Patient (Traditional)"
                  onRecording={handleRecordingStart}
                  onStopRecording={handleRecordingStop}
                  onUploadComplete={handleUploadComplete}
                  useEnhancedUI={false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enhanced" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Enhanced Record UI</CardTitle>
                <CardDescription>New animated recorder with improved UX</CardDescription>
              </CardHeader>
              <CardContent>
                <AnimatedAudioRecorder
                  patientCode="Patient (Enhanced)"
                  onRecording={handleRecordingStart}
                  onStopRecording={handleRecordingStop}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </div>

        <div className="flex justify-center mt-6 gap-4">
          <Button
            onClick={() => setActiveTab("traditional")}
            variant={activeTab === "traditional" ? "default" : "outline"}
          >
            Show Traditional UI
          </Button>
          <Button onClick={() => setActiveTab("enhanced")} variant={activeTab === "enhanced" ? "default" : "outline"}>
            Show Enhanced UI
          </Button>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Key Improvements</CardTitle>
            <CardDescription>The enhanced UI offers several advantages</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 list-disc pl-5">
              <li>Smooth animations provide visual feedback during interactions</li>
              <li>Long-press progress indicator shows when you're about to stop recording</li>
              <li>Color-coded states make it clear what mode you're in (recording, paused, etc.)</li>
              <li>Consistent design language across all states</li>
              <li>Improved accessibility with clear visual indicators and states</li>
              <li>Responsive design works well on all device sizes</li>
            </ul>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  )
}
