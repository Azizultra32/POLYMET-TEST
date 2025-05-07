"use client"

import { useState, useEffect, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Volume2, VolumeX } from "lucide-react"
import EnhancedRecordButton, { type RecordingState } from "@/components/enhanced-record-button"
import SimpleAudioVisualizer from "@/components/simple-audio-visualizer"
import type { TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"
import useSpeechRecognition from "@/hooks/use-speech-recognition"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"

interface AnimatedAudioRecorderProps {
  patientCode?: string
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  className?: string
}

export default function AnimatedAudioRecorder({
  patientCode = "Patient",
  onRecording,
  onStopRecording,
  onUploadComplete,
  className = "",
}: AnimatedAudioRecorderProps) {
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
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Refs
  const audioChunksRef = useRef<Blob[]>([])
  const chunkNumberRef = useRef<number>(0)
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const mediaStream = useRef<MediaStream | null>(null)

  // Custom hooks
  const { toast } = useToast()
  const { hasMicAccess, requestAccess, releaseStream } = useMicrophonePermission()

  // Speech recognition setup
  const { transcript, listening, browserSupportsSpeechRecognition, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      continuous: true,
      commands: [
        {
          command: "start recording",
          callback: () => handleStartRecording(),
          matchInterim: false,
        },
        {
          command: "stop recording",
          callback: () => handleStopRecording(),
          matchInterim: false,
        },
        {
          command: "pause recording",
          callback: () => handlePauseRecording(),
          matchInterim: false,
        },
      ],
    })

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

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
      }
      if (releaseStream) {
        releaseStream()
      }
    }
  }, [releaseStream])

  // Request microphone permission if needed
  const requestMicPermission = async () => {
    setErrorMessage(null)

    if (!hasMicAccess) {
      try {
        await requestAccess()
        return true
      } catch (error) {
        if (error instanceof Error) {
          setErrorMessage(error.message)
        } else {
          setErrorMessage("Could not access microphone")
        }
        setRecordingState("error")
        return false
      }
    }

    return true
  }

  // Handle recording start
  const handleStartRecording = async () => {
    // Don't do anything if already recording or processing
    if (recordingState === "recording" || recordingState === "processing") return

    // If paused, just resume
    if (recordingState === "paused" && mediaRecorder.current) {
      try {
        mediaRecorder.current.resume()
        setRecordingState("recording")

        // Resume speech recognition if enabled
        if (transcriptionEnabled && browserSupportsSpeechRecognition) {
          startListening()
        }

        toast({
          title: "Recording Resumed",
          description: "Your recording has been resumed.",
        })

        return
      } catch (error) {
        console.error("Error resuming recording:", error)
        setErrorMessage("Failed to resume recording")
        setRecordingState("error")
        return
      }
    }

    // Otherwise, start a new recording
    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Request microphone access if needed
      const hasAccess = await requestMicPermission()
      if (!hasAccess) {
        setIsProcessing(false)
        return
      }

      // Get media stream
      mediaStream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Create media recorder
      const mimeType = "audio/webm"
      mediaRecorder.current = new MediaRecorder(mediaStream.current, { mimeType })

      // Reset chunks and counters if not an addendum
      if (!isAddendum) {
        audioChunksRef.current = []
        chunkNumberRef.current = 0

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

      // Set up event handlers
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
          chunkNumberRef.current++

          // Update patient token count
          setPatient((prev) => ({
            ...prev,
            token_count: chunkNumberRef.current,
          }))

          // Signal that sound was detected
          setSoundDetected(true)
          setTimeout(() => setSoundDetected(false), 500)
        }
      }

      mediaRecorder.current.onstop = () => {
        if (audioChunksRef.current.length === 0) return

        const finalBlob = new Blob(audioChunksRef.current, { type: mimeType })

        if (onStopRecording) {
          onStopRecording(patient)
        }

        if (onUploadComplete) {
          setTimeout(() => {
            onUploadComplete(patient)
          }, 1000)
        }

        setRecordingState("idle")
      }

      // Start recording
      mediaRecorder.current.start(1000) // Chunk every second

      // Start speech recognition if enabled
      if (transcriptionEnabled && browserSupportsSpeechRecognition) {
        resetTranscript()
        startListening()
      }

      // Update UI state
      setRecordingState("recording")

      toast({
        title: "Recording Started",
        description: `Recording for ${patient.patient_code}`,
      })
    } catch (error) {
      console.error("Error starting recording:", error)

      if (error instanceof Error) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage("Failed to start recording")
      }

      setRecordingState("error")

      toast({
        title: "Recording Error",
        description: "Could not start recording. Please check microphone access.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle recording pause
  const handlePauseRecording = () => {
    if (recordingState !== "recording" || !mediaRecorder.current) return

    try {
      mediaRecorder.current.pause()
      setRecordingState("paused")

      // Pause speech recognition
      if (listening) {
        stopListening()
      }

      toast({
        title: "Recording Paused",
        description: "Your recording has been paused.",
      })
    } catch (error) {
      console.error("Error pausing recording:", error)

      toast({
        title: "Pause Error",
        description: "Could not pause recording.",
        variant: "destructive",
      })
    }
  }

  // Handle recording stop
  const handleStopRecording = () => {
    if ((recordingState !== "recording" && recordingState !== "paused") || !mediaRecorder.current) return

    try {
      mediaRecorder.current.stop()

      // Stop all tracks
      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
      }

      // Stop speech recognition
      if (listening) {
        stopListening()
      }

      // Set processing state while we handle the audio
      setRecordingState("processing")

      // Processing will be reset to idle when the onstop handler runs

      toast({
        title: "Recording Stopped",
        description: "Your recording is being processed.",
      })
    } catch (error) {
      console.error("Error stopping recording:", error)

      toast({
        title: "Stop Error",
        description: "Could not stop recording properly.",
        variant: "destructive",
      })

      setRecordingState("idle")
    }
  }

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
              disabled={recordingState === "recording" || recordingState === "processing"}
              className="flex-1"
            />

            <div className="flex items-center gap-2">
              <Label htmlFor="addendum-mode" className="text-sm whitespace-nowrap">
                Addendum
              </Label>
              <Switch
                id="addendum-mode"
                checked={isAddendum}
                onCheckedChange={setIsAddendum}
                disabled={
                  recordingState === "recording" || recordingState === "paused" || recordingState === "processing"
                }
              />
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-2 pb-2">
            <EnhancedRecordButton
              size={96}
              state={recordingState}
              onStart={handleStartRecording}
              onPause={handlePauseRecording}
              onStop={handleStopRecording}
              onLongPress={handleStopRecording}
              errorMessage={errorMessage || undefined}
              disabled={!hasMicAccess}
              className="mb-2"
            />
          </div>

          <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
            <SimpleAudioVisualizer
              isRecording={recordingState === "recording"}
              isPaused={recordingState === "paused"}
              height={64}
              barColor={
                recordingState === "recording" ? "#ef4444" : recordingState === "paused" ? "#f59e0b" : "#10b981"
              }
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
                disabled={recordingState === "recording" || recordingState === "processing"}
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
            <p>Voice commands: "start recording", "stop recording", "pause recording"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
