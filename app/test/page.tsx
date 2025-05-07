"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mic, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import AudioRecorder from "@/components/audio-recorder"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"
import type { TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"

export default function TestPage() {
  const [isClient, setIsClient] = useState(false)
  const [currentTab, setCurrentTab] = useState("audio")
  const { hasMicAccess, isRequestingPermission, requestMicrophoneAccess } = useMicrophonePermission()

  // Mock patient data
  const [patientData, setPatientData] = useState<TranscriptData>({
    mid: uuidv4(),
    patient_code: "Test Patient",
    language: "en",
    token_count: 0,
  })

  const [newPatientData, setNewPatientData] = useState<TranscriptData>({
    mid: uuidv4(),
    patient_code: "",
    language: "en",
    token_count: 0,
  })

  const [recordings, setRecordings] = useState<TranscriptData[]>([])

  // Audio recorder handlers
  const handleRecording = (patient: TranscriptData) => {
    console.log("Recording started:", patient)
    setPatientData(patient)
  }

  const handleStopRecording = (patient: TranscriptData) => {
    console.log("Recording stopped:", patient)
  }

  const handleUploadComplete = (patient: TranscriptData) => {
    console.log("Upload complete:", patient)
    setRecordings((prev) => [patient, ...prev])

    // Reset new patient data for next recording
    setNewPatientData({
      mid: uuidv4(),
      patient_code: "",
      language: "en",
      token_count: 0,
    })
  }

  const handleSpeechCommand = (command: number, text?: string) => {
    console.log("Speech command:", command, text)
  }

  // Client-side only rendering
  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <div className="flex justify-center">
                <Skeleton className="h-16 w-16 rounded-full" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              Audio Recorder Demo
            </span>
            {!hasMicAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={requestMicrophoneAccess}
                disabled={isRequestingPermission}
                className="flex items-center gap-2 bg-yellow-50 border-yellow-300 hover:bg-yellow-100"
              >
                <Mic className="h-4 w-4" />
                {isRequestingPermission ? "Requesting..." : "Allow Microphone"}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="audio" onValueChange={setCurrentTab} value={currentTab}>
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="audio">Recorder</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>

            <TabsContent value="audio" className="space-y-4">
              {/* Microphone Permission Alert */}
              {!hasMicAccess && (
                <Alert variant="warning" className="mb-4 bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Please allow microphone access to use the audio recorder. Click the "Allow Microphone" button above.
                  </AlertDescription>
                </Alert>
              )}

              {/* Audio Recorder */}
              <AudioRecorder
                patientData={patientData}
                newPatientData={newPatientData}
                onRecording={handleRecording}
                onStopRecording={handleStopRecording}
                onUploadComplete={handleUploadComplete}
                hasMicrophoneAccess={hasMicAccess}
                onSpeechCommand={handleSpeechCommand}
                disabled={false}
              />

              <div className="text-center text-sm text-muted-foreground mt-2">
                Click the mic button to start recording
              </div>
            </TabsContent>

            <TabsContent value="recordings" className="space-y-4">
              {recordings.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No recordings yet. Create a recording first!
                </div>
              ) : (
                <div className="space-y-4">
                  {recordings.map((recording) => (
                    <Card key={recording.mid} className="overflow-hidden">
                      <CardHeader className="bg-muted py-2">
                        <CardTitle className="text-base flex justify-between">
                          <span>{recording.patient_code}</span>
                          <span className="text-muted-foreground text-sm">{new Date().toLocaleString()}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm">
                              Recording ID:{" "}
                              <span className="font-mono text-xs">{recording.mid.substring(0, 8)}...</span>
                            </div>
                            <div className="text-sm text-muted-foreground">Uploaded successfully</div>
                          </div>
                          <Button variant="outline" size="sm" className="ml-2">
                            Play
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
