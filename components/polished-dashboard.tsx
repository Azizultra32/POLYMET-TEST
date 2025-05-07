"use client"

import { useState, useCallback } from "react"
import useTranscripts from "@/hooks/use-transcripts"
import useCreateTransript from "@/hooks/use-create-transcript"
import { useOnlineStatus } from "@/hooks/use-online-status"
import { useMediaQuery } from "@/hooks/use-mobile"
import type { Transcript, TranscriptData } from "@/types/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import EnhancedRecorder from "@/components/enhanced-recorder"
import TranscriptList from "@/components/TranscriptList"
import DashboardLayout from "@/components/dashboard-layout"
import { Skeleton } from "@/components/ui/skeleton"
import { FileText, Clock, CheckCircle2, AlertCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function PolishedDashboard() {
  const { data: onlineTranscripts, isLoading, error, refetch } = useTranscripts()
  const [clientTranscripts, setClientTranscripts] = useState<Transcript[]>([])
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [recordingPatientMidUUID, setRecordingPatientMidUUID] = useState<string>()
  const [uploadingPatientMidUUID, setUploadingPatientMidUUID] = useState<string>()
  const [offlineQueueCount, setOfflineQueueCount] = useState(0)
  const isMobile = useMediaQuery("(max-width: 768px)")
  const isDesktop = !isMobile
  const isOnline = useOnlineStatus()
  const { toast } = useToast()
  const { mutateAsync: createTranscript } = useCreateTransript()

  // Calculate patient tag for new transcripts
  const patientTag = 1 // Simplified for this example

  // Toggle sidebar
  const toggleSidebar = useCallback(() => {
    setShowSidebar((prev) => !prev)
  }, [])

  // Handle transcript selection
  const handleSelectTranscript = useCallback(
    (transcript: Transcript) => {
      setSelectedTranscript(transcript)
      if (!isDesktop) {
        toggleSidebar()
      }
    },
    [isDesktop, toggleSidebar],
  )

  // Handle transcript deletion
  const handleDeleteTranscript = useCallback(
    (transcript: TranscriptData) => {
      toast({
        title: "Transcript deleted",
        description: `Transcript for ${transcript.patient_code} has been deleted.`,
      })
    },
    [toast],
  )

  // Handle recording
  const handleRecording = useCallback((patient: TranscriptData) => {
    setRecordingPatientMidUUID(patient.mid)
  }, [])

  // Handle stop recording
  const handleStopRecording = useCallback(() => {
    setRecordingPatientMidUUID(undefined)
  }, [])

  // Handle upload complete
  const handleUploadComplete = useCallback(() => {
    setUploadingPatientMidUUID(undefined)
    refetch()
  }, [refetch])

  // Combine transcripts from online and client sources
  const allTranscripts = [...(onlineTranscripts || []), ...(clientTranscripts || [])]

  // Sidebar content
  const sidebarContent = (
    <TranscriptList
      transcripts={allTranscripts}
      selectedTranscript={selectedTranscript}
      onSelectTranscript={handleSelectTranscript}
      onDeleteTranscript={handleDeleteTranscript}
      recordingPatientMidUUID={recordingPatientMidUUID}
      uploadingPatientMidUUID={uploadingPatientMidUUID}
      offlineQueueCount={offlineQueueCount}
    />
  )

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
      <div className="p-4 h-full">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="record">Record</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 space-y-4 mt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Total Transcripts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isLoading ? <Skeleton className="h-8 w-16" /> : allTranscripts.length}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Completed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      allTranscripts.filter((t) => t.completed_at).length
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {isLoading ? (
                      <Skeleton className="h-8 w-16" />
                    ) : (
                      allTranscripts.filter((t) => !t.completed_at).length
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your recent transcripts and activity</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="text-destructive">Error loading transcripts</div>
                ) : allTranscripts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No transcripts yet</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {allTranscripts.slice(0, 5).map((transcript) => (
                        <div
                          key={transcript.mid}
                          className="p-3 border rounded-md hover:bg-accent cursor-pointer transition-colors"
                          onClick={() => handleSelectTranscript(transcript)}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{transcript.patient_code || "Unnamed Patient"}</h3>
                              <p className="text-sm text-muted-foreground">
                                {transcript.created_at ? new Date(transcript.created_at).toLocaleString() : "No date"}
                              </p>
                            </div>
                            <Badge variant={transcript.completed_at ? "default" : "outline"}>
                              {transcript.completed_at ? "Completed" : "Pending"}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="record" className="flex-1 mt-4">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Record New Transcript</CardTitle>
                <CardDescription>Record audio for a new transcript</CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedRecorder
                  newPatientData={{
                    patient_code: "New Patient",
                    patient_tag: patientTag,
                  }}
                  patientTag={patientTag}
                  onRecording={handleRecording}
                  onStopRecording={handleStopRecording}
                  onUploadComplete={handleUploadComplete}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
