"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Volume2, VolumeX } from "lucide-react"
import RecordButton, { type RecordingState } from "@/components/record-button"
import SimpleAudioVisualizer from "@/components/simple-audio-visualizer"
import type { TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"
import useSpeechRecognition from "@/hooks/use-speech-recognition"

interface ModernAudioRecorderProps {
  patientCode?: string
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  className?: string
}

export default function ModernAudioRecorder({
  patientCode = "Patient",
  onRecording,
  onStopRecording,
  onUploadComplete,
  className = "",
}: ModernAudioRecorderProps) {
  // State
  const [recordingState, setRecordingState] = useState<RecordingState>("idle")
  const [transcriptText, setTranscriptText] = useState("")
  const [soundDetected, setSoundDetected] = useState(false)
  const [isAddendum, setIsAddendum] = useState(false)
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(true)
  const [patient, setPatient] = useState<TranscriptData>({
    mid: uuidv4(),
    patient_code: patientCode,
    token_count: 0,
    patient_tag: 1,
  })

  // Refs
  const audioChunksRef = useRef<Blob[]>([])
  const chunkNumberRef = useRef<number>(0)

  // Custom hooks
  const { toast } = useToast()

  // Speech recognition setup
  const commands = [
    {
      command: "start recording",
      callback: () => recordingState === "idle" && setRecordingState("recording"),
      matchInterim: false,
    },
    {
      command: "stop recording",
      callback: () => recordingState === "recording" && setRecordingState("stopped"),
      matchInterim: false,
    },
    {
      command: "pause recording",
      callback: () => recordingState === "recording" && setRecordingState("paused"),
      matchInterim: false,
    },
    {
      command: "resume recording",
      callback: () => recordingState === "paused" && setRecordingState("recording"),
      matchInterim: false,
    },
    {
      command: "patient name *",
      callback: (patientName: string) => {
        if (patientName) {
          setPatient((prev) => ({ ...prev, patient_code: patientName }))
          toast({
            title: "Patient Name Updated",
            description: `Patient name set to: ${patientName}`,
          })
        }
      },
      matchInterim: false,
    },
  ]

  const { transcript, listening, browserSupportsSpeechRecognition, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({ commands, continuous: true })

  // Update patient code when prop changes
  useEffect(() => {
    setPatient((prev) => ({
      ...prev,
      patient_code: patientCode,
    }))
  }, [patientCode])

  // Update transcript from speech recognition
  useEffect(() => {
    if (transcript) {
      setTranscriptText(transcript)
    }
  }, [transcript])

  // Handle recording start
  const handleRecordingStart = useCallback(() => {
    // Reset chunk counter if not an addendum
    if (!isAddendum) {
      chunkNumberRef.current = 0
      audioChunksRef.current = []

      // Generate new patient ID
      const newPatient = {
        ...patient,
        mid: uuidv4(),
        token_count: 0,
      }
      setPatient(newPatient)

      // Notify parent component
      onRecording(newPatient)
    } else {
      // For addendum, continue with existing patient
      onRecording(patient)
    }

    // Start speech recognition if enabled
    if (transcriptionEnabled && browserSupportsSpeechRecognition) {
      resetTranscript()
      startListening()
    }

    toast({
      title: "Recording Started",
      description: `Recording for ${patient.patient_code}`,
    })
  }, [
    isAddendum,
    patient,
    onRecording,
    toast,
    transcriptionEnabled,
    browserSupportsSpeechRecognition,
    resetTranscript,
    startListening,
  ])

  // Handle recording pause
  const handleRecordingPause = useCallback(() => {
    // Pause speech recognition
    if (listening) {
      stopListening()
    }

    toast({
      title: "Recording Paused",
      description: "Your recording has been paused.",
    })
  }, [listening, stopListening, toast])

  // Handle recording resume
  const handleRecordingResume = useCallback(() => {
    // Resume speech recognition
    if (transcriptionEnabled && browserSupportsSpeechRecognition) {
      startListening()
    }

    toast({
      title: "Recording Resumed",
      description: "Your recording has been resumed.",
    })
  }, [transcriptionEnabled, browserSupportsSpeechRecognition, startListening, toast])

  // Handle recording stop
  const handleRecordingStop = useCallback(
    (audioBlob: Blob, audioUrl: string) => {
      // Stop speech recognition
      if (listening) {
        stopListening()
      }

      if (onStopRecording) {
        onStopRecording({
          ...patient,
          token_count: chunkNumberRef.current,
        })
      }

      toast({
        title: "Recording Stopped",
        description: "Your recording has been saved.",
      })

      // Simulate upload complete after a delay
      if (onUploadComplete) {
        setTimeout(() => {
          onUploadComplete({
            ...patient,
            token_count: chunkNumberRef.current,
          })
        }, 1000)
      }
    },
    [patient, onStopRecording, onUploadComplete, listening, stopListening, toast],
  )

  // Handle recording error
  const handleRecordingError = useCallback(
    (error: Error) => {
      toast({
        title: "Recording Error",
        description: error.message,
        variant: "destructive",
      })
    },
    [toast],
  )

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Audio Recorder</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Patient Name"
              value={patient.patient_code}
              onChange={(e) => setPatient((prev) => ({ ...prev, patient_code: e.target.value }))}
              disabled={recordingState === "recording"}
              className="flex-1"
            />

            <div className="flex items-center gap-2">
              <span className="text-sm">Addendum</span>
              <Switch
                checked={isAddendum}
                onCheckedChange={setIsAddendum}
                disabled={recordingState === "recording" || recordingState === "paused"}
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-4 pb-2">
            <RecordButton
              size={100}
              onRecordingStart={handleRecordingStart}
              onRecordingPause={handleRecordingPause}
              onRecordingResume={handleRecordingResume}
              onRecordingStop={handleRecordingStop}
              onError={handleRecordingError}
              className="mb-2"
            />
          </div>

          <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
            <SimpleAudioVisualizer
              isRecording={recordingState === "recording"}
              isPaused={recordingState === "paused"}
              height={64}
              barColor="#10b981"
              className="w-full h-full"
            />
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {soundDetected ? (
                <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
              ) : (
                <VolumeX className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Voice Recognition</span>
              <Switch
                checked={transcriptionEnabled}
                onCheckedChange={setTranscriptionEnabled}
                disabled={recordingState === "recording" && !recordingState === "paused"}
              />
            </div>

            <div className="p-3 bg-gray-50 rounded-md border min-h-[80px] max-h-[150px] overflow-y-auto">
              {transcriptionEnabled ? (
                transcript ? (
                  <p className="text-sm">{transcript}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    {recordingState === "recording"
                      ? "Listening for speech..."
                      : "Speech will appear here when recording"}
                  </p>
                )
              ) : (
                <p className="text-sm text-gray-400 italic">Voice recognition is disabled</p>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-500">
            <p>
              Voice commands: "start recording", "stop recording", "pause recording", "resume recording", "patient name
              [name]"
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
