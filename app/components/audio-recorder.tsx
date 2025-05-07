"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useAuth } from "@/app/context/auth-context"
import { supabaseClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { ReactMic } from "@/lib/react-mic"
import { getWakeLock } from "@/lib/wake-lock"

interface AudioRecorderProps {
  onRecording: (patient: any) => void
  onStopRecording?: (patient: any) => void
  onUploadComplete?: (patient: any) => void
  patientCode?: string
  className?: string
}

export default function AudioRecorder({
  onRecording,
  onStopRecording,
  onUploadComplete,
  patientCode = "Patient",
  className = "",
}: AudioRecorderProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [recording, setRecording] = useState(false)
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false)
  const [chunkNumber, setChunkNumber] = useState(0)
  const [patient, setPatient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Reference to our wake lock instance
  const wakeLockRef = useRef(getWakeLock())

  // Check for microphone access
  useEffect(() => {
    const checkMicrophoneAccess = async () => {
      if (typeof navigator === "undefined" || !navigator.mediaDevices) {
        return
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setHasMicrophoneAccess(true)
        // Release the stream immediately
        stream.getTracks().forEach((track) => track.stop())
      } catch (err) {
        console.error("Microphone permission denied:", err)
        setHasMicrophoneAccess(false)
        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access in your browser settings.",
          variant: "destructive",
        })
      }
    }

    checkMicrophoneAccess()
  }, [toast])

  // Clean up wake lock on unmount
  useEffect(() => {
    return () => {
      wakeLockRef.current.disable().catch((err) => {
        console.warn("Error disabling wake lock on unmount:", err)
      })
    }
  }, [])

  // Start recording
  const startRecording = useCallback(async () => {
    // Check if user is authenticated
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to record audio.",
        variant: "destructive",
      })
      return
    }

    if (!hasMicrophoneAccess) {
      toast({
        title: "Microphone Access Required",
        description: "Please enable microphone access to record.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Try to enable wake lock - but don't block recording if it fails
    try {
      await wakeLockRef.current.enable()
    } catch (error) {
      console.warn("Wake lock could not be enabled, continuing anyway:", error)
      // Non-blocking - continue with recording even if wake lock fails
    }

    // Create new patient record
    const newPatient = {
      patient_code: patientCode,
      patient_tag: 1, // You might want to determine this dynamically
      mid: crypto.randomUUID(),
      user_id: user.id,
      language: "auto",
      token_count: 0,
    }

    setPatient(newPatient)
    setChunkNumber(0)

    // Create transcript in database
    try {
      const { error } = await supabaseClient.from("transcripts2").insert({
        patient_code: newPatient.patient_code,
        patient_tag: newPatient.patient_tag,
        mid: newPatient.mid,
        language: newPatient.language,
        token_count: 0,
        user_id: user.id,
      })

      if (error) {
        console.error("Error creating transcript:", error)
        toast({
          title: "Error",
          description: "Failed to create transcript record.",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // Notify parent component
      onRecording(newPatient)

      // Start recording
      setRecording(true)

      toast({
        title: "Recording Started",
        description: "Your audio is now being recorded.",
      })
    } catch (error) {
      console.error("Error starting recording:", error)
      toast({
        title: "Error",
        description: "Failed to start recording.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [user, hasMicrophoneAccess, patientCode, onRecording, toast])

  // Stop recording
  const stopRecording = useCallback(() => {
    setRecording(false)

    // Disable wake lock
    wakeLockRef.current.disable().catch((err) => {
      console.warn("Error disabling wake lock:", err)
      // Non-blocking - continue even if wake lock disable fails
    })

    if (patient && onStopRecording) {
      const updatedPatient = {
        ...patient,
        token_count: chunkNumber,
      }
      onStopRecording(updatedPatient)
    }

    toast({
      title: "Recording Stopped",
      description: "Your recording has been saved.",
    })
  }, [patient, chunkNumber, onStopRecording, toast])

  // Handle audio data chunks
  const handleData = useCallback(
    async (blob: Blob, soundDetected: boolean) => {
      if (!soundDetected || !user || !patient) return

      const userId = user.id
      const patientMidUUID = patient.mid

      const newChunkNumber = chunkNumber + 1
      const path = `${userId}/${patientMidUUID}-${newChunkNumber}.mp3`

      console.log(`Handling chunk ${path}, size ${blob.size} bytes`)

      try {
        // Upload to Supabase storage
        const { error: uploadError } = await supabaseClient.storage.from("audio-chunks").upload(path, blob, {
          cacheControl: "3600",
          upsert: true,
        })

        if (uploadError) {
          console.error("Upload error:", uploadError)
          toast({
            title: "Upload Error",
            description: "Failed to upload audio chunk. Please try again.",
            variant: "destructive",
          })
          return
        }

        // Update transcript token count
        const { error: updateError } = await supabaseClient
          .from("transcripts2")
          .update({ token_count: newChunkNumber })
          .eq("mid", patientMidUUID)
          .eq("user_id", userId)

        if (updateError) {
          console.error("Update error:", updateError)
          toast({
            title: "Update Error",
            description: "Failed to update transcript record.",
            variant: "destructive",
          })
          return
        }

        setChunkNumber(newChunkNumber)
      } catch (err) {
        console.error("Error handling audio chunk:", err)
        toast({
          title: "Processing Error",
          description: "An error occurred while processing the audio.",
          variant: "destructive",
        })
      }
    },
    [chunkNumber, patient, user, toast],
  )

  // Handle recording start
  const handleStart = useCallback(() => {
    console.log("Recording started")
  }, [])

  // Handle recording stop
  const handleStop = useCallback(
    (blob: Blob, soundDetected: boolean) => {
      console.log("Recording stopped, soundDetected:", soundDetected)

      if (soundDetected) {
        handleData(blob, soundDetected)
      }

      if (patient && onUploadComplete) {
        setTimeout(() => {
          onUploadComplete({
            ...patient,
            token_count: chunkNumber,
          })
        }, 1000)
      }
    },
    [handleData, patient, chunkNumber, onUploadComplete],
  )

  // If user is not authenticated, show a message
  if (!user) {
    return (
      <div className="flex flex-col gap-4 p-4 border rounded-lg bg-background">
        <p className="text-center text-red-500">You must be logged in to use the recording feature.</p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col gap-4 p-4 border rounded-lg bg-background ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={!hasMicrophoneAccess || isLoading}
            className={`w-16 h-16 rounded-full flex items-center justify-center focus:outline-none ${
              isLoading
                ? "bg-gray-400"
                : recording
                  ? "bg-red-500 hover:bg-red-600"
                  : hasMicrophoneAccess
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-400"
            }`}
            aria-label={recording ? "Stop recording" : "Start recording"}
          >
            {isLoading ? (
              <div className="animate-spin h-8 w-8 border-4 border-white rounded-full border-t-transparent"></div>
            ) : recording ? (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="6" y="6" width="12" height="12" fill="white" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" fill="white" />
                <polygon points="10,8 10,16 16,12" fill={hasMicrophoneAccess ? "#10b981" : "#9ca3af"} />
              </svg>
            )}
          </button>
        </div>

        <div className="text-sm text-gray-500">
          {isLoading
            ? "Initializing..."
            : recording
              ? `Recording in progress (${chunkNumber} chunks)`
              : !hasMicrophoneAccess
                ? "Microphone access required"
                : "Ready to record"}
        </div>
      </div>

      <div className="w-full h-24 bg-gray-100 rounded-md overflow-hidden">
        <ReactMic
          record={recording}
          onStart={handleStart}
          onStop={handleStop}
          onData={handleData}
          strokeColor="#10b981"
          backgroundColor="#f3f4f6"
          className="w-full h-full"
          audioBitsPerSecond={128000}
          mimeType="audio/mp3"
        />
      </div>
    </div>
  )
}
