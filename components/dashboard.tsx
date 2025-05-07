"use client"

import { useState, useCallback, useEffect, useMemo, useRef } from "react"
import { useAuthState } from "@/hooks/use-auth-state"
import { useToast } from "@/components/ui/use-toast"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useMediaQuery } from "@/hooks/use-mobile"
import AudioRecorder from "@/components/ui/recorder"
import TranscriptList from "@/components/TranscriptList"
import useTranscripts from "@/hooks/useTranscripts"
import useCreateTransript from "@/hooks/useCreateTranscript"
import { uuidv4 } from "@/lib/utils"
import type { Transcript, TranscriptData } from "@/types/transcript"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Mic, FileText, Info, Plus, Menu, X, Clock, User, Calendar, Loader2, ChevronRight } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

export default function Dashboard() {
  // State
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | undefined>()
  const [clientTranscripts, setClientTranscripts] = useState<Transcript[]>([])
  const [showSidebar, setShowSidebar] = useState<boolean>(true)
  const [patientData, setPatientData] = useState<TranscriptData>({
    patient_code: "Patient",
    patient_tag: 1,
    mid: uuidv4(),
    language: "auto",
    token_count: 0,
  })
  const [recordingPatientMidUUID, setRecordingPatientMidUUID] = useState<string>("")
  const [uploadingPatientMidUUID, setUploadingPatientMidUUID] = useState<string>("")
  const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState<boolean>(false)
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const [isInitializing, setIsInitializing] = useState(true)
  const [activeTab, setActiveTab] = useState("transcript")

  // Refs
  const contentRef = useRef<HTMLDivElement>(null)

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
        // Check microphone permissions
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach((track) => track.stop())
          setHasMicrophoneAccess(true)
        } catch (err) {
          console.error("Microphone permission denied:", err)
          setHasMicrophoneAccess(false)
          toast({
            title: "Microphone access denied",
            description: "Please enable microphone access to use recording features.",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error("Error during initialization:", error)
      } finally {
        setIsInitializing(false)
      }
    }

    initialize()
  }, [toast])

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

  // Scroll to top when changing tabs
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [activeTab])

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
  const mergedTranscripts = useMemo(() => {
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
    (transcript: Transcript) => {
      setSelectedTranscript(transcript)
      setPatientData(transcript)
      setActiveTab("transcript")

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
        const newTranscript: Transcript = {
          ...patient,
          created_at: new Date(),
          is_paused: false,
          ai_summary: null,
        }
        return [newTranscript, ...prev]
      } else {
        // This is an existing patient, update it
        return prev.map((t) => (t.mid === patient.mid ? ({ ...t, ...patient } as Transcript) : t))
      }
    })

    // Select the current transcript
    const currentTranscript = {
      ...patient,
      created_at: new Date(),
      is_paused: false,
      ai_summary: null,
    } as Transcript

    setSelectedTranscript(currentTranscript)
  }, [])

  const onStopRecording = useCallback(
    (patient: TranscriptData) => {
      console.log("Recording stopped for patient:", patient)
      setRecordingPatientMidUUID("")
      setUploadingPatientMidUUID(patient.mid!)

      // Update patient in client transcripts
      setClientTranscripts((prev) =>
        prev.map((t) => (t.mid === patient.mid ? ({ ...t, token_count: patient.token_count } as Transcript) : t)),
      )

      // Reset patient data for new recording
      setPatientData({
        patient_code: "Patient",
        patient_tag: patientTag(),
        mid: uuidv4(),
        language: patient.language,
        token_count: 0,
      })
    },
    [patientTag],
  )

  const onUploadComplete = useCallback((patient: TranscriptData) => {
    setUploadingPatientMidUUID("")
  }, [])

  // Format date for display
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "Unknown date"
    const d = new Date(date)
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // If initializing or loading, show loading state
  if (isInitializing || (isLoadingTranscripts && !clientTranscripts.length)) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-t-2 border-primary animate-pulse"></div>
          </div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // Check authentication
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <Card className="w-full max-w-md shadow-lg border-primary/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
            <CardDescription>Please log in to access your dashboard and patient records.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild size="lg" className="w-full">
              <a href="/login" className="flex items-center justify-center gap-2">
                Go to Login
                <ChevronRight className="h-4 w-4" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "translate-x-0" : "-translate-x-full"
        } fixed inset-y-0 left-0 z-20 w-72 bg-card border-r shadow-sm transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold">Transcripts</h2>
          {!isDesktop && (
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>

        <ScrollArea className="h-[calc(100vh-65px)]">
          <TranscriptList
            transcripts={mergedTranscripts}
            selectedTranscript={selectedTranscript}
            onSelectTranscript={selectTranscript}
            onDeleteTranscript={deleteTranscript}
            recordingPatientMidUUID={recordingPatientMidUUID}
            uploadingPatientMidUUID={uploadingPatientMidUUID}
            offlineQueueCount={offlineQueueCount}
          />
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b py-3 px-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>

            <div className="flex flex-col">
              <h1 className="text-xl font-bold line-clamp-1">
                {selectedTranscript ? selectedTranscript.patient_code : "Medical Transcription"}
              </h1>
              {selectedTranscript && (
                <p className="text-xs text-muted-foreground">Created: {formatDate(selectedTranscript.created_at)}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online status indicator */}
            <Badge
              variant="outline"
              className={`${
                isOnline
                  ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
                  : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full mr-1.5 ${isOnline ? "bg-green-500 animate-pulse" : "bg-amber-500"}`}
              ></span>
              {isOnline ? "Online" : "Offline"}
            </Badge>

            {/* Recording status indicators with improved styling */}
            {recordingPatientMidUUID && (
              <div className="flex items-center gap-2 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 px-3 py-1 rounded-full animate-pulse">
                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                <span className="text-sm font-medium">Recording</span>
              </div>
            )}
            {uploadingPatientMidUUID && (
              <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-3 py-1 rounded-full">
                <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
                <span className="text-sm font-medium">Uploading</span>
              </div>
            )}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6" ref={contentRef}>
          {selectedTranscript ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList className="bg-muted/60">
                  <TabsTrigger value="transcript" className="flex items-center gap-2 data-[state=active]:bg-background">
                    <FileText className="h-4 w-4" />
                    <span>Transcript</span>
                  </TabsTrigger>
                  <TabsTrigger value="info" className="flex items-center gap-2 data-[state=active]:bg-background">
                    <Info className="h-4 w-4" />
                    <span>Details</span>
                  </TabsTrigger>
                  <TabsTrigger value="record" className="flex items-center gap-2 data-[state=active]:bg-background">
                    <Mic className="h-4 w-4" />
                    <span>Record</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="transcript" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Card className="border shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Transcript Content
                    </CardTitle>
                    <CardDescription>
                      {selectedTranscript.token_count
                        ? `Audio chunks: ${selectedTranscript.token_count}`
                        : "No content recorded yet"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="min-h-[300px] bg-card rounded-md">
                      {selectedTranscript.ai_summary ? (
                        <div className="whitespace-pre-wrap p-4 text-base leading-relaxed">
                          {selectedTranscript.ai_summary}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
                          <div className="rounded-full bg-primary/10 p-3 mb-4">
                            <FileText className="h-6 w-6 text-primary" />
                          </div>
                          <p className="text-muted-foreground mb-2">
                            {selectedTranscript.token_count ? "Processing transcript..." : "No content available yet"}
                          </p>
                          {!selectedTranscript.token_count && (
                            <Button variant="outline" size="sm" onClick={() => setActiveTab("record")} className="mt-2">
                              Start Recording
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="info" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Patient Information
                    </CardTitle>
                    <CardDescription>Details about this transcript</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient Code</h3>
                            <p className="text-lg font-medium">{selectedTranscript.patient_code}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                            <Info className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Patient Tag</h3>
                            <p className="text-lg font-medium">{selectedTranscript.patient_tag}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Language</h3>
                            <p className="text-lg font-medium">{selectedTranscript.language || "auto"}</p>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                            <Calendar className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Created</h3>
                            <p className="text-lg font-medium">{formatDate(selectedTranscript.created_at)}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 rounded-md bg-primary/10 p-1.5">
                            <Mic className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-1">Audio Chunks</h3>
                            <p className="text-lg font-medium">{selectedTranscript.token_count || 0}</p>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-muted-foreground mb-1">ID</h3>
                          <p className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto">
                            {selectedTranscript.mid}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="record" className="mt-0 focus-visible:outline-none focus-visible:ring-0">
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Mic className="h-5 w-5 text-primary" />
                      Add to Recording
                    </CardTitle>
                    <CardDescription>Record additional audio for this transcript</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AudioRecorder
                      patientData={selectedTranscript}
                      patientTag={selectedTranscript.patient_tag || 1}
                      onRecording={onRecording}
                      onStopRecording={onStopRecording}
                      onUploadComplete={onUploadComplete}
                      hasMicrophoneAccess={hasMicrophoneAccess}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <Card className="border shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-primary" />
                    New Recording
                  </CardTitle>
                  <CardDescription>Start a new patient recording session</CardDescription>
                </CardHeader>
                <CardContent>
                  <AudioRecorder
                    newPatientData={patientData}
                    patientTag={patientTag()}
                    onRecording={onRecording}
                    onStopRecording={onStopRecording}
                    onUploadComplete={onUploadComplete}
                    hasMicrophoneAccess={hasMicrophoneAccess}
                  />
                </CardContent>
              </Card>

              {mergedTranscripts.length > 0 ? (
                <Card className="border shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Recent Transcripts
                    </CardTitle>
                    <CardDescription>Select a transcript from the list to view or edit</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mergedTranscripts.slice(0, 6).map((transcript) => (
                        <Card
                          key={transcript.mid}
                          className="cursor-pointer hover:border-primary/50 transition-colors hover:shadow-md"
                          onClick={() => selectTranscript(transcript)}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <User className="h-3 w-3 text-primary" />
                              </div>
                              {transcript.patient_code}
                            </CardTitle>
                            <CardDescription className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(transcript.created_at)}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                {transcript.token_count || 0} audio chunks
                              </span>
                              <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                                View
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                  {mergedTranscripts.length > 6 && (
                    <CardFooter className="flex justify-center border-t pt-4">
                      <Button variant="outline" size="sm" onClick={() => {}} className="w-full md:w-auto">
                        View All Transcripts
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ) : (
                <Card className="border shadow-sm">
                  <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                    <div className="rounded-full bg-primary/10 p-4 mb-4">
                      <Mic className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-medium mb-2">No Transcripts Yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-md">
                      Start by creating your first recording. Use the recorder above to begin a new patient session.
                    </p>
                    <Button className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Create First Recording</span>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
