"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { uuidv4 } from "@/lib/utils"
import { initDB, saveAudioChunk, saveToOfflineQueue } from "@/lib/indexedDB"
// Use only useAuthState for simplicity
import { useAuthState } from "@/hooks/use-auth-state"
import type { TranscriptData } from "@/types/transcript"

// Import the ReactMic component from the components directory
import { ReactMic } from "@/components/ReactMic"
import { createTranscript, updateTranscript } from "@/app/actions/transcript"

interface AudioRecorderProps {
  patientData?: TranscriptData
  newPatientData?: TranscriptData
  patientTag: number
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  onSpeechCommand?: (commandType: number, data?: string) => void
  hasMicrophoneAccess?: boolean
  selectPatient?: (patientTag: number) => void
}

export default function AudioRecorder({
  patientData,
  newPatientData,
  patientTag,
  onRecording,
  onStopRecording,
  onUploadComplete,
  onSpeechCommand,
  hasMicrophoneAccess = true,
  selectPatient,
}: AudioRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [recordingPaused, setRecordingPaused] = useState(false)
  const [isAddendum, setIsAddendum] = useState(false)
  const [isRecordButtonDisabled, setRecordingButtonDisabled] = useState(false)
  const [chunkNumberWrapper, setChunkNumberWrapper] = useState({ chunkNumber: 0 })
  const [isDbReady, setIsDbReady] = useState(false)
  const [patientCode, setPatientCode] = useState("")

  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  // Use useAuthState directly
  const { isAuthenticated } = useAuthState()

  // Initialize IndexedDB
  useEffect(() => {
    const initializeDb = async () => {
      const dbInitialized = await initDB()
      setIsDbReady(dbInitialized)
    }

    initializeDb()
  }, [])

  // Create patient object based on props and state
  const patient = useMemo(() => {
    const pd = isAddendum ? patientData : newPatientData
    const result = {
      patient_code: pd?.patient_code ?? (patientCode || "Patient"),
      patient_tag: isAddendum ? pd?.patient_tag : patientTag,
      mid: pd?.mid ?? uuidv4(),
      language: pd?.language ?? "auto",
      token_count: pd?.token_count ?? 0,
    }
    return result
  }, [patientData, newPatientData, patientTag, isAddendum, patientCode])

  // Handle start recording
  const cStartRecording = useCallback(() => {
    console.log(`start recording`)

    if (!recordingPaused) {
      setChunkNumberWrapper({ chunkNumber: 0 })
    }

    setRecording(true)
    setRecordingButtonDisabled(true)
  }, [recordingPaused])

  // Handle pause recording
  const cPauseRecording = useCallback(() => {
    console.log(`pause recording`)
    setRecordingPaused(true)
    setRecording(false)
  }, [])

  // Handle stop recording
  const cStopRecording = useCallback(() => {
    console.log(`stop recording`)
    setRecording(false)
    setRecordingPaused(false)

    if (onStopRecording) {
      onStopRecording(patient)
    }
  }, [patient, onStopRecording])

  // Handle microphone permission failure
  const micPermissionFailed = useCallback(() => {
    toast({
      title: "Microphone Access Denied",
      description: "Please enable microphone access in your browser settings to use the recording feature.",
      variant: "destructive",
    })
  }, [toast])

  // Handle recording start callback
  const onStart = useCallback(async () => {
    if (!recordingPaused) {
      const patientMidUUID = patient.mid

      // Check if user is authenticated
      if (!isAuthenticated) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to record audio.",
          variant: "destructive",
        })
        setRecording(false)
        return
      }

      if (!isAddendum) {
        console.log(`creating patient ${patientMidUUID}...`)
        const initialPatient = {
          ...patient,
          patient_tag: patientTag,
        }
        console.log("initialPatient", JSON.stringify(initialPatient))

        if (onRecording) {
          onRecording(initialPatient)
        }

        if (isOnline) {
          try {
            // Make sure we're not directly rendering the result of createTranscript
            const result = await createTranscript(initialPatient)
            console.log("Transcript created:", result)
          } catch (error) {
            console.error("Error creating transcript:", error)
            toast({
              title: "Error",
              description: "Failed to create transcript. Will retry when online.",
              variant: "destructive",
            })

            if (isDbReady) {
              await saveToOfflineQueue({
                type: "create",
                data: initialPatient,
              })
            }
          }
        } else if (isDbReady) {
          await saveToOfflineQueue({
            type: "create",
            data: initialPatient,
          })

          toast({
            title: "Offline Mode",
            description: "Recording will be saved locally and uploaded when online.",
          })
        }
      } else {
        const initialPatient = {
          ...patient,
        }
        console.log("initialPatient", JSON.stringify(initialPatient))

        if (onRecording) {
          onRecording(initialPatient)
        }
      }
    }

    setRecordingButtonDisabled(false)
    setRecordingPaused(false)
  }, [patient, onRecording, recordingPaused, patientTag, isAddendum, isAuthenticated, isOnline, isDbReady, toast])

  // Handle audio data chunks
  const onData = useCallback(
    async (blob: Blob, soundDetected: boolean) => {
      if (!soundDetected || !isAuthenticated) {
        return
      }

      // Since we don't have direct access to user.id, we'll use a placeholder or
      // get the user ID from another source if available
      const userId = "current-user" // This should ideally come from a secure source
      const patientMidUUID = patient.mid

      let chunk = ++chunkNumberWrapper.chunkNumber
      if (isAddendum) {
        chunk = (patient.token_count || 0) + chunk
      }
      const path = `${userId}/${patientMidUUID}-${chunk}.mp3`

      console.log(`handling chunk ${path}, size ${blob.size} bytes`)

      if (isOnline) {
        // Upload to Supabase storage via API route
        const formData = new FormData()
        formData.append("file", blob, path)
        formData.append("path", path)

        try {
          const response = await fetch("/api/upload", {
            method: "POST",
            body: formData,
          })

          if (!response.ok) {
            throw new Error("Failed to upload audio chunk")
          }

          // Make sure we're not directly rendering the result of updateTranscript
          const result = await updateTranscript({ mid: patientMidUUID, token_count: chunk })
          console.log("Transcript updated:", result)
        } catch (error) {
          console.error("Error uploading audio chunk:", error)
          if (isDbReady) {
            await saveAudioChunk(patientMidUUID, chunk, blob)
            await saveToOfflineQueue({
              type: "upload",
              data: { patientId: patientMidUUID, chunkNumber: chunk },
            })
            await saveToOfflineQueue({
              type: "update",
              data: { mid: patientMidUUID, updates: { token_count: chunk } },
            })
          }
        }
      } else if (isDbReady) {
        // Store in IndexedDB for offline use
        try {
          await saveAudioChunk(patientMidUUID, chunk, blob)
          await saveToOfflineQueue({
            type: "update",
            data: { mid: patientMidUUID, updates: { token_count: chunk } },
          })
        } catch (error) {
          console.error("Error saving audio chunk:", error)
        }
      } else {
        console.error("IndexedDB is not ready. Unable to save audio chunk.")
      }

      setChunkNumberWrapper({ chunkNumber: chunk - (isAddendum ? patient.token_count || 0 : 0) })
    },
    [patient, chunkNumberWrapper, isOnline, isDbReady, isAddendum, isAuthenticated],
  )

  // Handle recording stop
  const onStop = useCallback(
    async (blob: Blob, soundDetected: boolean) => {
      console.log(`recording stopped, soundDetected: ${soundDetected}`)
      if (soundDetected) {
        await onData(blob, soundDetected)
      }
      if (onUploadComplete) {
        onUploadComplete(patient)
      }
    },
    [onData, patient, onUploadComplete],
  )

  // If user is not authenticated, show a message
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-background">
        <p className="text-center text-red-500">You must be logged in to use the recording feature.</p>
      </div>
    )
  }

  const patientDisplay = patient
    ? typeof patient.patient_code === "string"
      ? patient.patient_code
      : "Unknown Patient"
    : "No Patient"

  return (
    <div className="flex flex-col gap-2 p-2 border rounded-lg bg-background">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={
              hasMicrophoneAccess
                ? recording && !recordingPaused
                  ? cPauseRecording
                  : cStartRecording
                : micPermissionFailed
            }
            className="w-12 h-12 rounded-full flex items-center justify-center focus:outline-none"
            disabled={isRecordButtonDisabled}
            aria-label={recording ? "Pause recording" : "Start recording"}
          >
            {recording && !recordingPaused ? (
              <svg className="w-12 h-12" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill="#ef4444" />
                <rect x="20" y="20" width="8" height="24" fill="white" />
                <rect x="36" y="20" width="8" height="24" fill="white" />
              </svg>
            ) : (
              <svg className="w-12 h-12" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="30" fill={hasMicrophoneAccess ? "#10b981" : "#9ca3af"} />
                <polygon points="26,20 26,44 44,32" fill="white" />
              </svg>
            )}
          </button>

          {(recording || recordingPaused) && (
            <button
              onClick={cStopRecording}
              className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center focus:outline-none"
              aria-label="Stop recording"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                <rect x="6" y="6" width="12" height="12" fill="white" />
              </svg>
            </button>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {recording ? "Recording..." : recordingPaused ? "Paused" : !hasMicrophoneAccess ? "Mic required" : "Ready"}
        </div>
      </div>

      {!recording && !recordingPaused && (
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="New Patient Label"
            value={patientCode}
            onChange={(e) => setPatientCode(e.target.value)}
            disabled={recording || recordingPaused || isAddendum}
            className="flex-1 h-8 text-sm"
          />
        </div>
      )}

      <div className="w-full h-12 bg-gray-100 rounded-md overflow-hidden">
        <ReactMic
          record={recording}
          onStart={onStart}
          onStop={onStop}
          onData={onData}
          strokeColor="#10b981"
          backgroundColor="#f3f4f6"
          className="w-full h-full"
        />
      </div>
    </div>
  )
}
