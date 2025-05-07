"use client"

import { useState } from "react"
import AudioRecorder from "@/components/audio-recorder"
import ModernAudioRecorder from "@/components/modern-audio-recorder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import type { TranscriptData } from "@/types/types"

export default function RecorderTestPage() {
  const [useModernUI, setUseModernUI] = useState(true)
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
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Audio Recorder Test</CardTitle>
            <div className="flex items-center space-x-2">
              <Label htmlFor="ui-mode">Modern UI</Label>
              <Switch id="ui-mode" checked={useModernUI} onCheckedChange={setUseModernUI} />
            </div>
          </div>
          <CardDescription>Toggle between classic and modern recording interfaces</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="recorder">
            <TabsList>
              <TabsTrigger value="recorder">Recorder</TabsTrigger>
              <TabsTrigger value="status">Recording Status</TabsTrigger>
            </TabsList>

            <TabsContent value="recorder" className="pt-4">
              {useModernUI ? (
                <ModernAudioRecorder
                  patientCode="Test Patient"
                  onRecording={handleRecordingStart}
                  onStopRecording={handleRecordingStop}
                  onUploadComplete={handleUploadComplete}
                />
              ) : (
                <AudioRecorder
                  patientCode="Test Patient"
                  onRecording={handleRecordingStart}
                  onStopRecording={handleRecordingStop}
                  onUploadComplete={handleUploadComplete}
                  useModernUI={false}
                />
              )}
            </TabsContent>

            <TabsContent value="status" className="pt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recording Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {recordingPatient ? (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse"></div>
                        <span className="font-medium">Recording in progress</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">Patient: </span>
                        <span className="font-medium">{recordingPatient.patient_code}</span>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">ID: </span>
                        <span className="font-mono text-xs">{recordingPatient.mid}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">No active recording</div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
