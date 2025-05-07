"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { cn } from "@/lib/utils"
import { Mic, AlertCircle, RefreshCw } from "lucide-react"
import { useMicrophonePermission } from "@/hooks/use-microphone-permission"
import type { TranscriptData } from "@/types/types"
import useSpeechRecognition from "@/hooks/use-speech-recognition"
import { uuidv4 } from "@/lib/utils"
import SimpleAudioVisualizer from "@/components/simple-audio-visualizer"
import EnhancedRecordButton from "@/components/enhanced-record-button"

interface AudioRecorderProps {
  patientCode?: string
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  onSpeechCommand?: (command: number, text?: string) => void
  className?: string
  useEnhancedUI?: boolean
}

export default function AudioRecorder({
  patientCode = "Patient",
  onRecording,
  onStopRecording,
  onUploadComplete,
  onSpeechCommand = () => {},
  className = "",
  useEnhancedUI = false,
}: AudioRecorderProps) {
  // State
  const [recording, setRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [isAddendum, setIsAddendum] = useState(false)
  const [transcriptText, setTranscriptText] = useState("")
  const [soundDetected, setSoundDetected] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [patient, setPatient] = useState<TranscriptData>({
    mid: uuidv4(),
    patient_code: patientCode,
    token_count: 0,
    patient_tag: 1,
  })
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Refs
  const mediaRecorder = useRef<MediaRecorder | null>(null)
  const audioChunks = useRef<Blob[]>([])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrame = useRef<number>()
  const mediaStream = useRef<MediaStream | null>(null)
  const chunkNumberRef = useRef<number>(0)
  const resetInProgressRef = useRef(false)

  // Custom hooks
  const { toast } = useToast()
  const { hasMicAccess, isRequesting, error: micError, requestAccess, releaseStream } = useMicrophonePermission()

  // Determine the recording state for enhanced UI
  const getRecordingState = () => {
    if (!hasMicAccess) return "error"
    if (recording && !recordingPaused) return "recording"
    if (recordingPaused) return "paused"
    return "idle"
  }

  // Define these functions first, before creating the commands array
  const startRecording = useCallback(async () => {
    console.log("startRecording called")
    try {
      if (!hasMicAccess) {
        const stream = await requestAccess()
        if (!stream) {
          throw new Error("Could not access microphone")
        }
        mediaStream.current = stream
      } else {
        // Get media stream if we already have permission
        mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true })
      }

      if (!mediaStream.current) {
        throw new Error("Failed to initialize media stream")
      }

      // Create media recorder
      const mimeType = "audio/webm"
      mediaRecorder.current = new MediaRecorder(mediaStream.current, { mimeType })
      audioChunks.current = []
      chunkNumberRef.current = 0

      // Set up event handlers
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.current.push(event.data)
          chunkNumberRef.current++

          // Update patient token count
          setPatient((prev) => ({
            ...prev,
            token_count: chunkNumberRef.current,
          }))

          // Signal sound detection
          setSoundDetected(true)
          setTimeout(() => setSoundDetected(false), 500)
        }
      }

      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length === 0) return

        const finalBlob = new Blob(audioChunks.current, { type: mimeType })

        if (onStopRecording) {
          onStopRecording(patient)
        }

        if (onUploadComplete) {
          setTimeout(() => {
            onUploadComplete(patient)
          }, 1000)
        }
      }

      // Start recording
      mediaRecorder.current.start(1000) // Chunk every second

      setRecording(true)
      setRecordingPaused(false)
      setErrorMessage(null)

      // Notify parent component
      onRecording(patient)
      if (onSpeechCommand) {
        onSpeechCommand(1)
      }

      console.log("Recording started successfully")
    } catch (error) {
      console.error("Error starting recording:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to start recording")

      toast({
        title: "Recording Error",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }, [hasMicAccess, onRecording, onStopRecording, onUploadComplete, onSpeechCommand, patient, requestAccess, toast])

  // Stop recording
  const stopRecording = useCallback(() => {
    console.log("stopRecording called")
    try {
      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop()
        console.log("MediaRecorder stopped")
      }

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
        console.log("MediaStream tracks stopped")
      }

      setRecording(false)
      setRecordingPaused(false)
      if (onSpeechCommand) {
        onSpeechCommand(3)
      }

      console.log("Recording stopped successfully")
    } catch (error) {
      console.error("Error stopping recording:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to stop recording")
    }
  }, [onSpeechCommand])

  // Pause recording
  const pauseRecording = useCallback(() => {
    console.log("pauseRecording called")
    try {
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.pause()
        console.log("MediaRecorder paused")

        setRecordingPaused(true)
        if (onSpeechCommand) {
          onSpeechCommand(2)
        }

        console.log("Recording paused successfully")
      }
    } catch (error) {
      console.error("Error pausing recording:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to pause recording")
    }
  }, [onSpeechCommand])

  // Resume recording
  const resumeRecording = useCallback(() => {
    console.log("resumeRecording called")
    try {
      if (mediaRecorder.current && mediaRecorder.current.state === "paused") {
        mediaRecorder.current.resume()
        console.log("MediaRecorder resumed")

        setRecordingPaused(false)
        if (onSpeechCommand) {
          onSpeechCommand(5)
        }

        console.log("Recording resumed successfully")
      }
    } catch (error) {
      console.error("Error resuming recording:", error)
      setErrorMessage(error instanceof Error ? error.message : "Failed to resume recording")
    }
  }, [onSpeechCommand])

  // Speech recognition setup
  const { transcript, listening, browserSupportsSpeechRecognition, startListening, stopListening, resetTranscript } =
    useSpeechRecognition({
      continuous: true,
      autoStart: true, // Start listening immediately
    })

  // Function to reset speech recognition
  const resetSpeechRecognition = useCallback(() => {
    if (resetInProgressRef.current) return

    resetInProgressRef.current = true
    console.log("Resetting speech recognition")

    // Stop listening
    stopListening()

    // Clear the transcript
    resetTranscript()

    // Restart listening after a short delay
    setTimeout(() => {
      startListening()
      resetInProgressRef.current = false
      console.log("Speech recognition reset complete")
    }, 300)
  }, [stopListening, startListening, resetTranscript])

  // Process commands with automatic reset after execution
  const processCommand = useCallback(
    (command: string) => {
      console.log(`Processing command: ${command}`)
      let commandExecuted = false

      // Process the command based on the transcript
      const lowerCommand = command.toLowerCase().trim()

      // Start recording commands
      if ((lowerCommand === "start recording" || lowerCommand === "start") && !recording) {
        startRecording()
        commandExecuted = true
      }
      // Stop recording commands
      else if ((lowerCommand === "stop recording" || lowerCommand === "stop") && recording) {
        stopRecording()
        commandExecuted = true
      }
      // Pause recording commands
      else if ((lowerCommand === "pause recording" || lowerCommand === "pause") && recording && !recordingPaused) {
        pauseRecording()
        commandExecuted = true
      }
      // Resume recording commands
      else if ((lowerCommand === "resume recording" || lowerCommand === "resume") && recordingPaused) {
        resumeRecording()
        commandExecuted = true
      }
      // Patient name command
      else if (lowerCommand.startsWith("patient name")) {
        const patientName = lowerCommand.replace("patient name", "").trim()
        if (patientName) {
          setPatient((prev) => ({ ...prev, patient_code: patientName }))
          if (onSpeechCommand) {
            onSpeechCommand(4, patientName)
          }
          commandExecuted = true
        }
      }

      // Reset speech recognition if a command was executed
      if (commandExecuted) {
        resetSpeechRecognition()
      }

      return commandExecuted
    },
    [
      recording,
      recordingPaused,
      startRecording,
      stopRecording,
      pauseRecording,
      resumeRecording,
      onSpeechCommand,
      resetSpeechRecognition,
    ],
  )

  // Update transcript from speech recognition and process commands
  useEffect(() => {
    if (transcript) {
      setTranscriptText(transcript)

      // Only process commands when we have a final transcript (not interim)
      // and we're not currently resetting
      if (!resetInProgressRef.current) {
        processCommand(transcript)
      }
    }
  }, [transcript, processCommand])

  // Track if we're client-side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Initialize
  useEffect(() => {
    if (!isClient) return

    // Check online status
    const handleOnlineStatusChange = () => {
      setIsOnline(navigator.onLine)
    }

    window.addEventListener("online", handleOnlineStatusChange)
    window.addEventListener("offline", handleOnlineStatusChange)
    setIsOnline(navigator.onLine)
    setIsInitialized(true)

    // Cleanup
    return () => {
      window.removeEventListener("online", handleOnlineStatusChange)
      window.removeEventListener("offline", handleOnlineStatusChange)

      if (mediaStream.current) {
        mediaStream.current.getTracks().forEach((track) => track.stop())
        mediaStream.current = null
      }

      if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
        mediaRecorder.current.stop()
      }

      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current)
      }

      // Use the releaseStream function from the hook
      if (releaseStream) {
        releaseStream()
      }
    }
  }, [isClient, releaseStream])

  // Update patient code when prop changes
  useEffect(() => {
    setPatient((prev) => ({
      ...prev,
      patient_code: patientCode,
    }))
  }, [patientCode])

  // Handle record button click for traditional UI
  const handleRecordButtonClick = () => {
    if (recording && !recordingPaused) {
      pauseRecording()
    } else if (recordingPaused) {
      resumeRecording()
    } else {
      startRecording()
    }
  }

  // Handle enhanced UI actions
  const handleRecordStart = useCallback(() => {
    if (recordingPaused) {
      resumeRecording()
    } else {
      startRecording()
    }
  }, [recordingPaused, resumeRecording, startRecording])

  // Update the render logic to show either the enhanced or classic UI
  if (!isClient) {
    return null
  }

  // Permission request view
  if (!hasMicAccess) {
    return (
      <div
        className={`flex flex-col items-center gap-4 p-6 border border-yellow-200 rounded-md bg-yellow-50 ${className}`}
      >
        <div className="flex items-center gap-2 text-yellow-800">
          <Mic className="h-5 w-5" />
          <span className="font-medium">Microphone access required</span>
        </div>

        <p className="text-sm text-yellow-700 text-center">
          Please allow microphone access to use the recording features.
        </p>

        <Button
          onClick={requestAccess}
          disabled={isRequesting}
          className="mt-2 bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {isRequesting ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Requesting access...
            </>
          ) : (
            <>
              <Mic className="h-4 w-4 mr-2" />
              Allow Microphone Access
            </>
          )}
        </Button>

        {micError && (
          <div className="flex items-center gap-2 text-red-600 text-sm mt-2">
            <AlertCircle className="h-4 w-4" />
            <span>{micError.message}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`flex flex-col items-center gap-4 p-4 ${className}`}>
      {useEnhancedUI ? (
        // Enhanced UI layout
        <>
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium">
              Status:{" "}
              {isOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-red-500">Offline</span>
              )}
            </span>
          </div>

          <div className="w-full border border-gray-300 rounded-md p-3 bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="patientLabel" className="text-sm font-medium text-gray-700">
                  Patient Label:
                </label>
                <input
                  id="patientLabel"
                  type="text"
                  value={patient.patient_code}
                  onChange={(e) => setPatient((prev) => ({ ...prev, patient_code: e.target.value }))}
                  className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter patient name/ID"
                  disabled={recording || recordingPaused}
                />
              </div>
              <div className="mt-2 p-2 min-h-[40px] bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  {transcriptText || "Voice recognition will appear here..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center pt-4 pb-2">
            <EnhancedRecordButton
              size={100}
              state={getRecordingState()}
              onStart={handleRecordStart}
              onPause={pauseRecording}
              onStop={stopRecording}
              onLongPress={stopRecording}
              errorMessage={errorMessage || undefined}
              className="mb-2"
            />
          </div>

          <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative">
            <SimpleAudioVisualizer
              isRecording={recording}
              isPaused={recordingPaused}
              height={64}
              barColor={recording && !recordingPaused ? "#ef4444" : recordingPaused ? "#f59e0b" : "#10b981"}
              className="w-full h-full"
            />
          </div>
        </>
      ) : (
        // Original UI code
        <>
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium">
              Status:{" "}
              {isOnline ? (
                <span className="text-green-500">Online</span>
              ) : (
                <span className="text-red-500">Offline</span>
              )}
            </span>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "px-2 py-1 text-xs rounded-full",
                  soundDetected ? "bg-green-500 text-white" : "bg-gray-200",
                )}
              >
                {soundDetected ? "Sound Detected" : "Silent"}
              </span>
              <span
                className={cn("px-2 py-1 text-xs rounded-full", listening ? "bg-blue-500 text-white" : "bg-gray-200")}
              >
                {listening ? "Voice Recognition Active" : "Voice Recognition Inactive"}
              </span>
            </div>
          </div>

          <div className="w-full border border-gray-300 rounded-md p-3 bg-white">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label htmlFor="patientLabel" className="text-sm font-medium text-gray-700">
                  Patient Label:
                </label>
                <input
                  id="patientLabel"
                  type="text"
                  value={patient.patient_code}
                  onChange={(e) => setPatient((prev) => ({ ...prev, patient_code: e.target.value }))}
                  className="flex-1 ml-2 px-2 py-1 border border-gray-300 rounded-md text-sm"
                  placeholder="Enter patient name/ID"
                  disabled={recording || recordingPaused}
                />
              </div>
              <div className="mt-2 p-2 min-h-[40px] bg-gray-50 rounded border border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  {transcriptText || "Voice recognition will appear here..."}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col w-full gap-2">
            <div className="flex items-center justify-between">
              <span>
                Patient: <strong>{patient.patient_code || "Not selected"}</strong>
              </span>
              {isAddendum && (
                <span className="px-2 py-1 text-xs bg-blue-500 text-white rounded-full">Addendum Mode</span>
              )}
            </div>

            <div className="flex flex-col gap-2 p-2 border border-gray-200 rounded-md">
              <div className="flex items-center justify-between">
                <span>Addendum Mode</span>
                <Switch checked={isAddendum} onCheckedChange={setIsAddendum} disabled={recording || recordingPaused} />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleRecordButtonClick}
              disabled={!isInitialized}
              className="record-button w-16 h-16 rounded-full flex items-center justify-center relative transition-all"
              style={{
                backgroundColor: "#009B33",
                border: recording ? "2px solid red" : "none",
                opacity: isInitialized ? 1 : 0.5,
              }}
              aria-label={recording && !recordingPaused ? "Pause recording" : "Start recording"}
            >
              {recording && !recordingPaused ? (
                // Pause icon
                <div className="flex gap-1">
                  <div className="w-2 h-8 bg-red-500"></div>
                  <div className="w-2 h-8 bg-red-500"></div>
                </div>
              ) : (
                // Record icon
                <div className="w-8 h-8 rounded-full bg-white" />
              )}
            </button>

            {(recording || recordingPaused) && (
              <button
                onClick={stopRecording}
                className="stop-button w-16 h-16 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: "#FF4444",
                  border: "2px solid red",
                }}
                aria-label="Stop recording"
              >
                <div className="w-8 h-8 bg-white" />
              </button>
            )}
          </div>

          {!isInitialized && <p className="text-sm text-amber-500 mt-2">Initializing system...</p>}

          {recordingPaused && (
            <Button onClick={resumeRecording} className="mt-2">
              Resume Recording
            </Button>
          )}

          <div className="w-full h-16 bg-gray-100 rounded-md overflow-hidden relative mt-2">
            <SimpleAudioVisualizer
              isRecording={recording}
              isPaused={recordingPaused}
              height={64}
              barColor="#4CAF50"
              className="w-full h-full"
            />
          </div>
        </>
      )}

      <div className="text-xs text-gray-500 mt-2">
        <p>Voice commands: "start recording", "stop recording", "pause recording", "patient name [name]"</p>
      </div>
    </div>
  )
}
