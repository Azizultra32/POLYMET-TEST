"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { Mic, Pause, Square, Play, Volume2, VolumeX } from "lucide-react"
import useSpeechRecognition from "@/hooks/use-speech-recognition"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"
import type { TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"
// First, update the imports to include our new visualizer
import SimpleAudioVisualizer from "@/components/simple-audio-visualizer"

interface EnhancedAudioRecorderProps {
  patientCode?: string
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  className?: string
}

export default function EnhancedAudioRecorder({
  patientCode = "Patient",
  onRecording,
  onStopRecording,
  onUploadComplete,
  className = "",
}: EnhancedAudioRecorderProps) {
  // State
  const [recording, setRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [isAddendum, setIsAddendum] = useState(false)
  const [soundDetected, setSoundDetected] = useState(false)
  const [patient, setPatient] = useState<TranscriptData>({
    mid: uuidv4(),
    patient_code: patientCode,
    token_count: 0,
    patient_tag: 1,
  })
  const [chunkNumber, setChunkNumber] = useState(0)
  const [transcriptionEnabled, setTranscriptionEnabled] = useState(true)
  // Add a new state variable for the audio stream
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null)

  // Refs
  const audioChunks = useRef<Blob[]>([])

  // Custom hooks
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const { hasMicAccess, requestAccess } = useMicrophonePermission()

  // Speech recognition setup with commands
  const commands = [
    {
      command: "start recording",
      callback: () => !recording && startRecording(),
      matchInterim: false,
    },
    {
      command: "stop recording",
      callback: () => recording && stopRecording(),
      matchInterim: false,
    },
    {
      command: "pause recording",
      callback: () => recording && !recordingPaused && pauseRecording(),
      matchInterim: false,
    },
    {
      command: "resume recording",
      callback: () => recordingPaused && resumeRecording(),
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

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({ commands, continuous: true })

  // Update patient code when prop changes
  useEffect(() => {
    setPatient((prev) => ({
      ...prev,
      patient_code: patientCode,
    }))
  }, [patientCode])

  // Start recording
  const startRecording = useCallback(async () => {
    if (!hasMicAccess) {
      const granted = await requestAccess()
      if (!granted) {
        toast({
          title: "Microphone Access Required",
          description: "Please enable microphone access to record.",
          variant: "destructive",
        })
        return
      }
    }

    // Reset chunk counter if not an addendum
    if (!isAddendum) {
      setChunkNumber(0)
      audioChunks.current = []

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

    setRecording(true)
    setRecordingPaused(false)

    toast({
      title: "Recording Started",
      description: `Recording for ${patient.patient_code}`,
    })
  }, [
    hasMicAccess,
    isAddendum,
    patient,
    onRecording,
    requestAccess,
    toast,
    transcriptionEnabled,
    browserSupportsSpeechRecognition,
    resetTranscript,
    startListening,
  ])

  // Stop recording
  const stopRecording = useCallback(() => {
    setRecording(false)
    setRecordingPaused(false)

    // Stop speech recognition
    if (listening) {
      stopListening()
    }

    if (onStopRecording) {
      onStopRecording({
        ...patient,
        token_count: chunkNumber,
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
          token_count: chunkNumber,
        })
      }, 1000)
    }
  }, [patient, chunkNumber, onStopRecording, onUploadComplete, listening, stopListening, toast])

  // Pause recording
  const pauseRecording = useCallback(() => {
    setRecordingPaused(true)

    // Pause speech recognition
    if (listening) {
      stopListening()
    }

    toast({
      title: "Recording Paused",
      description: "Your recording has been paused.",
    })
  }, [listening, stopListening, toast])

  // Resume recording
  const resumeRecording = useCallback(() => {
    setRecordingPaused(false)

    // Resume speech recognition
    if (transcriptionEnabled && browserSupportsSpeechRecognition) {
      startListening()
    }

    toast({
      title: "Recording Resumed",
      description: "Your recording has been resumed.",
    })
  }, [transcriptionEnabled, browserSupportsSpeechRecognition, startListening, toast])

  // Handle audio data from ReactMic
  const handleAudioData = useCallback((blob: Blob, soundDetected: boolean) => {
    if (!soundDetected) return

    // Add to audio chunks
    audioChunks.current.push(blob)

    // Update chunk counter
    setChunkNumber((prev) => prev + 1)

    // Update sound detection state
    setSoundDetected(soundDetected)

    // Update patient token count
    setPatient((prev) => ({
      ...prev,
      token_count: prev.token_count + 1,
    }))
  }, [])

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (listening) {
        stopListening()
      }
    }
  }, [listening, stopListening])

  // If microphone access is not granted, show request button
  if (!hasMicAccess) {
    return (
      <div className={`flex flex-col items-center gap-4 p-4 border rounded-lg bg-background ${className}`}>
        <p className="text-center text-muted-foreground">Microphone access is required for recording.</p>
        <Button onClick={requestAccess}>
          <Mic className="mr-2 h-4 w-4" />
          Enable Microphone
        </Button>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 p-4 border rounded-lg bg-background ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={recording ? (recordingPaused ? resumeRecording : pauseRecording) : startRecording}
            className={`w-12 h-12 rounded-full flex items-center justify-center focus:outline-none ${
              recording
                ? recordingPaused
                  ? "bg-yellow-500 hover:bg-yellow-600"
                  : "bg-red-500 hover:bg-red-600"
                : "bg-green-500 hover:bg-green-600"
            }`}
            aria-label={recording ? (recordingPaused ? "Resume recording" : "Pause recording") : "Start recording"}
          >
            {recording ? (
              recordingPaused ? (
                <Play className="w-6 h-6 text-white" />
              ) : (
                <Pause className="w-6 h-6 text-white" />
              )
            ) : (
              <Mic className="w-6 h-6 text-white" />
            )}
          </button>

          {recording && (
            <button
              onClick={stopRecording}
              className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center focus:outline-none"
              aria-label="Stop recording"
            >
              <Square className="w-6 h-6 text-white" />
            </button>
          )}
        </div>

        <div className="text-sm text-gray-500 flex items-center gap-2">
          {soundDetected ? (
            <Volume2 className="h-4 w-4 text-green-500 animate-pulse" />
          ) : (
            <VolumeX className="h-4 w-4 text-gray-400" />
          )}
          {recording ? (recordingPaused ? "Paused" : `Recording... (${chunkNumber} chunks)`) : "Ready to record"}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="Patient Name"
          value={patient.patient_code}
          onChange={(e) => setPatient((prev) => ({ ...prev, patient_code: e.target.value }))}
          disabled={recording && !recordingPaused}
          className="flex-1"
        />

        <div className="flex items-center gap-2">
          <span className="text-sm">Addendum</span>
          <Switch checked={isAddendum} onCheckedChange={setIsAddendum} disabled={recording} />
        </div>
      </div>

      <div className="w-full h-24 bg-gray-100 rounded-md overflow-hidden relative">
        <SimpleAudioVisualizer
          isRecording={recording && !recordingPaused}
          isPaused={recordingPaused}
          height={96}
          barColor="#10b981"
          className="w-full h-full"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Voice Recognition</span>
          <Switch
            checked={transcriptionEnabled}
            onCheckedChange={setTranscriptionEnabled}
            disabled={recording && !recordingPaused}
          />
        </div>

        <div className="p-3 bg-gray-50 rounded-md border min-h-[80px] max-h-[150px] overflow-y-auto">
          {transcriptionEnabled ? (
            transcript ? (
              <p className="text-sm">{transcript}</p>
            ) : (
              <p className="text-sm text-gray-400 italic">
                {recording && !recordingPaused ? "Listening for speech..." : "Speech will appear here when recording"}
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
  )
}
