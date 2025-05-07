"use client"

import { useState, useCallback, useEffect } from "react"
import { useAuthState } from "@/hooks/use-auth-state"
import { useToast } from "@/components/ui/use-toast"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useMediaQuery } from "@/hooks/use-mobile"
import DashboardLayout from "@/components/dashboard-layout"
import TranscriptListWithRecorder from "@/components/transcript-list-with-recorder"
import Transcript from "@/components/transcript"
import useTranscripts from "@/hooks/useTranscripts"
import useCreateTransript from "@/hooks/useCreateTranscript"
import type { Transcript as TranscriptType, TranscriptData } from "@/types/types"

export default function TranscriptDashboard() {
  // State
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptType | null>(null)
  const [clientTranscripts, setClientTranscripts] = useState<TranscriptType[]>([])
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [recordingPatientMidUUID, setRecordingPatientMidUUID] = useState<string>("")
  const [uploadingPatientMidUUID, setUploadingPatientMidUUID] = useState<string>("")
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)

  // Hooks
  const { data: onlineTranscripts, isLoading: isLoadingTranscripts, error: transcriptsError } = useTranscripts()
  const { toast } = useToast()
  const isOnline = useOnlineStatus()
  const isDesktop = useMediaQuery("(min-width: 1024px)")
  const { mutateAsync: createTranscript } = useCreateTransript()
  const { isAuthenticated } = useAuthState()

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      try {
        // Any initialization logic
        // We'll keep this minimal since most of the initialization is now in the EnhancedRecorder
      } catch (error) {
        console.error("Error during initialization:", error)
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [])

  // Handle transcripts error
  useEffect(() => {
    if (transcriptsError) {
      console.error("Error loading transcripts:", transcriptsError)
      toast({
        title: "Error loading transcripts",
        description: "There was a problem loading your transcripts. Please try again later.",
        variant: "destructive",
      })
    }
  }, [transcriptsError, toast])

  // Calculate patient tag (highest tag number + 1)
  const patientTag = useCallback(() => {
    // Combine online and local transcripts, removing duplicates by mid
    const allTranscripts = [...(onlineTranscripts || []), ...(clientTranscripts || [])]
    const uniqueTranscripts = Array.from(new Map(allTranscripts.map((t) => [t.mid, t])).values())

    // Get the highest tag number
    const tags = uniqueTranscripts.map((t) => t.patient_tag || 0)
    if (!tags.length) return 1

    return Math.max(...tags) + 1
  }, [onlineTranscripts, clientTranscripts])

  // Merge online and client transcripts
  const mergedTranscripts = useCallback(() => {
    if (!onlineTranscripts && !clientTranscripts) return []

    const merged = [...(onlineTranscripts || []), ...(clientTranscripts || [])]
    return merged
      .filter((transcript, index, self) => index === self.findIndex((t) => t.mid === transcript.mid))
      .sort((a: any, b: any) => +new Date(b.created_at || 0) - +new Date(a.created_at || 0))
  }, [onlineTranscripts, clientTranscripts])

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev)
  }, [])

  // Select transcript
  const selectTranscript = useCallback(
    (transcript: TranscriptType) => {
      setSelectedTranscript(transcript)

      if (!isDesktop) {
        setShowSidebar(false)
      }
    },
    [isDesktop],
  )

  // Delete transcript
  const deleteTranscript = useCallback(
    (transcript: TranscriptData) => {
      // Implementation depends on your delete functionality
      console.log("Delete transcript:", transcript)
      toast({
        title: "Transcript Deleted",
        description: `Transcript for ${transcript.patient_code} has been deleted.`,
      })
    },
    [toast],
  )

  // Recording handlers
  const onRecording = useCallback((patient: TranscriptData) => {
    console.log("Recording started for patient:", patient)
    setRecordingPatientMidUUID(patient.mid!)

    // Add to client transcripts if not already there
    setClientTranscripts((prev) => {
      // Check if this patient already exists
      const existingIndex = prev.findIndex((t) => t.mid === patient.mid)

      if (existingIndex === -1) {
        // This is a new patient, add it to the list
        const newTranscript: TranscriptType = {
          ...patient,
          created_at: new Date(),
          is_paused: false,
          ai_summary: null,
        }
        return [newTranscript, ...prev]
      } else {
        // This is an existing patient, update it
        return prev.map((t) => (t.mid === patient.mid ? ({ ...t, ...patient } as TranscriptType) : t))
      }
    })

    // Select the current transcript
    const currentTranscript = {
      ...patient,
      created_at: new Date(),
      is_paused: false,
      ai_summary: null,
    } as TranscriptType

    setSelectedTranscript(currentTranscript)
  }, [])

  const onStopRecording = useCallback((patient: TranscriptData) => {
    console.log("Recording stopped for patient:", patient)
    setRecordingPatientMidUUID("")
    setUploadingPatientMidUUID(patient.mid!)

    // Update patient in client transcripts
    setClientTranscripts((prev) =>
      prev.map((t) => (t.mid === patient.mid ? ({ ...t, token_count: patient.token_count } as TranscriptType) : t)),
    )
  }, [])

  const onUploadComplete = useCallback((patient: TranscriptData) => {
    setUploadingPatientMidUUID("")
  }, [])

  // Sidebar content
  const sidebarContent = (
    <TranscriptListWithRecorder
      transcripts={mergedTranscripts()}
      selectedTranscript={selectedTranscript}
      onSelectTranscript={selectTranscript}
      onDeleteTranscript={deleteTranscript}
      onNewRecording={onRecording}
      onStopRecording={onStopRecording}
      onUploadComplete={onUploadComplete}
      recordingPatientMidUUID={recordingPatientMidUUID}
      uploadingPatientMidUUID={uploadingPatientMidUUID}
      offlineQueueCount={offlineQueueCount}
      patientTag={patientTag()}
    />
  )

  // Main content
  const mainContent = (
    <div className="flex-1 overflow-auto p-4">
      {selectedTranscript ? (
        <div className="space-y-4">
          {/* Transcript component that integrates all transcript-related components */}
          <Transcript
            transcript={selectedTranscript}
            recordingPatientMidUUID={recordingPatientMidUUID}
            uploadingPatientMidUUID={uploadingPatientMidUUID}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-card border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-2">No Transcript Selected</h3>
            <p className="text-muted-foreground">
              Select a transcript from the sidebar or create a new recording using the recorder below the patient list.
            </p>
          </div>
        </div>
      )}
    </div>
  )

  // If initializing or loading, show loading state
  if (isInitializing || (isLoadingTranscripts && !clientTranscripts.length)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Authentication Required</h2>
          <p className="mb-4">Please log in to access this page.</p>
          <a href="/login" className="text-blue-500 hover:underline">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout
      sidebar={sidebarContent}
      selectedTranscript={selectedTranscript}
      showSidebar={showSidebar}
      isDesktop={isDesktop}
      toggleSidebar={toggleSidebar}
      recording={!!recordingPatientMidUUID}
      onlineTranscripts={onlineTranscripts}
      clientTranscripts={clientTranscripts}
    >
      {mainContent}
    </DashboardLayout>
  )
}
