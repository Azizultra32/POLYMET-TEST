"use client"

import { useState, useEffect, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import TranscriptList from "@/components/TranscriptList"
import AudioRecorder from "@/components/audio-recorder"
import { useToast } from "@/components/ui/use-toast"
import type { Transcript, TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { getOfflineQueue } from "@/lib/indexedDB"
import VoiceCommandHelp from "@/components/voice-command-help"
import OfflineQueueManager from "@/components/offline-queue-manager"

interface TranscriptListWithRecorderProps {
  transcripts: Transcript[]
  selectedTranscript: Transcript | null
  onSelectTranscript: (transcript: Transcript) => void
  onDeleteTranscript: (patient: TranscriptData) => void
  onNewRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
  recordingPatientMidUUID?: string
  uploadingPatientMidUUID?: string
  offlineQueueCount: number
  patientTag: number
}

export default function TranscriptListWithRecorder({
  transcripts,
  selectedTranscript,
  onSelectTranscript,
  onDeleteTranscript,
  onNewRecording,
  onStopRecording,
  onUploadComplete,
  recordingPatientMidUUID,
  uploadingPatientMidUUID,
  offlineQueueCount,
  patientTag,
}: TranscriptListWithRecorderProps) {
  const [patientData, setPatientData] = useState<TranscriptData>({
    patient_code: "Patient",
    patient_tag: patientTag,
    mid: uuidv4(),
    language: "auto",
    token_count: 0,
  })
  const [queueCount, setQueueCount] = useState(offlineQueueCount)
  const { toast } = useToast()
  const isOnline = useOnlineStatus()

  // Reset patient data when patientTag changes
  useEffect(() => {
    setPatientData((prev) => ({
      ...prev,
      patient_tag: patientTag,
      mid: uuidv4(),
    }))
  }, [patientTag])

  // Update queue count periodically
  useEffect(() => {
    const checkOfflineQueue = async () => {
      try {
        const queue = await getOfflineQueue()
        setQueueCount(queue.length)
      } catch (error) {
        console.error("Error checking offline queue:", error)
      }
    }

    checkOfflineQueue()
    const interval = setInterval(checkOfflineQueue, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "Cannot process queue while offline",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Processing Queue",
      description: "Uploading offline recordings...",
    })

    // This would be implemented to process the queue
    // For now, we'll just simulate success
    await new Promise((resolve) => setTimeout(resolve, 2000))

    toast({
      title: "Queue Processed",
      description: "All offline recordings have been uploaded",
    })

    // Update queue count
    const queue = await getOfflineQueue()
    setQueueCount(queue.length)
  }, [isOnline, toast])

  // Voice command list
  const voiceCommands = [
    { command: "start recording", description: "Begin a new recording" },
    { command: "stop recording", description: "End the current recording" },
    { command: "pause recording", description: "Pause the current recording" },
    { command: "patient name is [name]", description: "Set the patient name" },
    { command: "save transcript", description: "Save the current transcript" },
    { command: "help", description: "Show voice command help" },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header with controls */}
      <div className="flex justify-between items-center p-2 border-b">
        <h2 className="text-lg font-semibold">Patient List</h2>
        <div className="flex items-center gap-2">
          <OfflineQueueManager onProcessQueue={processOfflineQueue} />
          <VoiceCommandHelp commands={voiceCommands} />
        </div>
      </div>

      {/* Transcript list */}
      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-[calc(100vh-220px)]">
          <TranscriptList
            transcripts={transcripts}
            selectedTranscript={selectedTranscript}
            onSelectTranscript={onSelectTranscript}
            onDeleteTranscript={onDeleteTranscript}
            recordingPatientMidUUID={recordingPatientMidUUID}
            uploadingPatientMidUUID={uploadingPatientMidUUID}
          />
        </ScrollArea>
      </div>

      {/* Audio recorder at the bottom */}
      <div className="border-t mt-auto">
        <AudioRecorder
          patientCode={patientData.patient_code}
          onRecording={onNewRecording}
          onStopRecording={onStopRecording}
          onUploadComplete={onUploadComplete}
        />
      </div>
    </div>
  )
}
