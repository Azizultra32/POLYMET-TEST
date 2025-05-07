"use client"

import { useMemo } from "react"

import type React from "react"

import type { Transcript, TranscriptData } from "@/types/types"
import moment from "moment"
import { Trash, Mic, ShieldAlert, Upload, Activity, Wifi, WifiOff, ChevronUp, ChevronDown } from "lucide-react"
import { ScrollArea } from "./ui/scroll-area"
import { useState, useEffect, useRef, useCallback } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "./ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { disableBodyScroll, clearAllBodyScrollLocks } from "body-scroll-lock"

type Props = {
  transcripts: Transcript[]
  selectedTranscript: Transcript | null
  onSelectTranscript: (transcript: Transcript) => void
  onDeleteTranscript: (patient: TranscriptData) => void
  recordingPatientMidUUID?: string
  uploadingPatientMidUUID?: string
  offlineQueueCount?: number
  isOnline?: boolean
}

const TranscriptList = ({
  transcripts,
  selectedTranscript,
  onSelectTranscript,
  onDeleteTranscript,
  recordingPatientMidUUID = "",
  uploadingPatientMidUUID = "",
  offlineQueueCount = 0,
  isOnline = true,
}: Props) => {
  const [unlock, setUnlock] = useState<Record<string, boolean>>({})
  const [patientName, setPatientName] = useState<string>("")
  const [showGrayShades, setShowGrayShades] = useState(false)
  const [deleteTimer, setDeleteTimer] = useState<NodeJS.Timeout | null>(null)
  const [deleteProgress, setDeleteProgress] = useState<number>(0)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [filter, setFilter] = useState<string>("")
  const [deletingMid, setDeletingMid] = useState<string | null>(null)
  const selectedRef = useRef<HTMLButtonElement>(null)
  const supabaseRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollPositionRef = useRef(0)

  // Initialize Supabase client
  useEffect(() => {
    if (typeof window !== "undefined") {
      supabaseRef.current = createClientComponentClient()
    }
  }, [])

  // Handle body scroll locking
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      disableBodyScroll(container, {
        reserveScrollBarGap: true,
        allowTouchMove: (el) => {
          let currentEl = el as HTMLElement
          while (currentEl && currentEl !== document.body) {
            if (currentEl === container) {
              return true
            }
            currentEl = currentEl.parentElement as HTMLElement
          }
          return false
        },
      })
    }
    return () => clearAllBodyScrollLocks()
  }, [])

  // Restore scroll position after selection
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.scrollTop = scrollPositionRef.current
    }
  })

  // Scroll selected item into view
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [selectedTranscript?.mid])

  const handleRename = async (editedText: string, mid: string) => {
    if (!supabaseRef.current) {
      console.error("Supabase client not initialized")
      return null
    }

    try {
      const { data, error } = await supabaseRef.current
        .from("transcripts2")
        .update({ patient_code: editedText })
        .eq("mid", mid)
        .select()

      if (error) {
        console.error("Error updating transcript:", error)
        throw new Error(error.message)
      }

      return data
    } catch (error) {
      console.error("Error in handleRename:", error)
      return null
    }
  }

  const isFinal = useCallback((transcript: Transcript) => {
    if (!transcript) return false

    return (
      transcript.completed_at != null &&
      new Date(transcript.completed_at).getTime() >= new Date(transcript.queued_completed_at || 0).getTime() &&
      transcript.token_count > 0 &&
      transcript.is_paused === false
    )
  }, [])

  // Get status icon based on transcript state
  const getStatusIcon = useCallback(
    (patient: Transcript) => {
      const iconClass = "h-6 w-6 md:h-[18px] md:w-[18px]"

      if (patient.mid === recordingPatientMidUUID) return <Mic className={`${iconClass} text-primary animate-pulse`} />

      if (patient.mid === uploadingPatientMidUUID) return <Upload className={`${iconClass} text-primary`} />

      if (isFinal(patient)) return <div className={`${iconClass} rounded-full bg-green-500`} />

      if (patient.error) return <ShieldAlert className={`${iconClass} text-orange-500`} />

      return <Activity className={`${iconClass} text-muted-foreground`} />
    },
    [recordingPatientMidUUID, uploadingPatientMidUUID, isFinal],
  )

  // Get background color based on date and selection
  const getBackgroundColor = useCallback(
    (date: string, isSelected: boolean) => {
      if (isSelected) return "var(--background-secondary)"
      if (!showGrayShades) return "var(--background)"

      const daysAgo = moment().diff(moment(date), "days")
      const maxDays = 30
      const shade = Math.min(daysAgo / maxDays, 1)
      const grayValue = Math.floor(255 - shade * 30)

      return `rgb(${grayValue}, ${grayValue}, ${grayValue})`
    },
    [showGrayShades],
  )

  // Handle unlock switch change
  const handleSwitchChange = useCallback((mid: string, checked: boolean) => {
    setUnlock((prev) => ({ ...prev, [mid]: checked }))
  }, [])

  // Start delete countdown
  const startDelete = useCallback(
    (e: React.MouseEvent | React.TouchEvent, patient: Transcript) => {
      e.preventDefault()
      e.stopPropagation()

      if (unlock[patient.mid]) {
        setDeletingMid(patient.mid)
        setDeleteProgress(0)

        const timer = setInterval(() => {
          setDeleteProgress((prev) => {
            if (prev >= 100) {
              clearInterval(timer)
              return 100
            }
            return prev + (100 / 3000) * 100
          })
        }, 100)

        setDeleteTimer(timer)
      }
    },
    [unlock],
  )

  // Cancel delete operation
  const cancelDelete = useCallback(() => {
    if (deleteTimer) {
      clearInterval(deleteTimer)
      setDeleteTimer(null)
    }
    setDeleteProgress(0)
    setDeletingMid(null)
  }, [deleteTimer])

  // Confirm delete operation
  const confirmDelete = useCallback(
    (patient: Transcript) => {
      if (deleteProgress === 100 && unlock[patient.mid]) {
        onDeleteTranscript(patient)
      }
      cancelDelete()
    },
    [deleteProgress, unlock, onDeleteTranscript, cancelDelete],
  )

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
  }, [])

  // Handle transcript selection
  const handleSelectTranscript = useCallback(
    (patient: Transcript) => {
      if (containerRef.current) {
        scrollPositionRef.current = containerRef.current.scrollTop
      }
      onSelectTranscript(patient)
    },
    [onSelectTranscript],
  )

  // Filter and sort transcripts
  const filteredAndSortedTranscripts = useMemo(() => {
    return transcripts
      .filter((t) => {
        if (!filter) return true
        const searchTerm = filter.toLowerCase()
        return (
          (t.patient_code || "").toLowerCase().includes(searchTerm) ||
          (t.patient_tag || "").toString().toLowerCase().includes(searchTerm)
        )
      })
      .sort((a, b) => {
        const dateA = new Date(a.created_at).getTime()
        const dateB = new Date(b.created_at).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
      })
  }, [transcripts, filter, sortOrder])

  // Handle edge cases
  if (!Array.isArray(transcripts)) {
    return (
      <div className="w-full md:w-[500px] lg:w-[550px] flex flex-col h-full border-r border-gray-200">
        <div className="flex justify-between items-center px-4 py-2 bg-muted">
          <h2 className="font-semibold">Patient List</h2>
        </div>
        <div className="p-4">No transcripts available</div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full md:w-[500px] lg:w-[550px] flex flex-col h-screen overflow-y-auto bg-sidebar"
    >
      <Card className="flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 bg-sidebar-accent border-b border-sidebar-border">
          <h2 className="font-semibold text-xl text-sidebar-foreground">Patient List</h2>
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <span className="text-xs text-sidebar-foreground/70">Age</span>
              <Switch
                checked={showGrayShades}
                onCheckedChange={setShowGrayShades}
                className="data-[state=checked]:bg-sidebar-primary"
              />
            </div>
            {offlineQueueCount > 0 && <Badge variant="secondary">{offlineQueueCount}</Badge>}
            <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
              {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
              <span>{isOnline ? "Online" : "Offline"}</span>
            </Badge>
          </div>
        </div>

        {/* Search filter */}
        <div className="p-3 border-b border-sidebar-border">
          <input
            type="text"
            placeholder="Filter patients..."
            className="w-full px-3 py-2 text-sm rounded-md bg-background border border-sidebar-border focus:outline-none focus:ring-2 focus:ring-sidebar-primary"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>

        {/* Sort controls */}
        <div className="flex justify-between items-center px-4 py-2 bg-sidebar-accent border-b border-sidebar-border">
          <span className="text-sm font-medium text-sidebar-foreground">Sort by Date</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSortOrder}
            className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/80"
          >
            {sortOrder === "asc" ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {filteredAndSortedTranscripts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No patients found</div>
            ) : (
              filteredAndSortedTranscripts.map((patient) => {
                if (!patient || !patient.mid) return null

                const isSelected = selectedTranscript?.mid === patient.mid
                const isDeleting = deletingMid === patient.mid

                return (
                  <Card
                    key={patient.mid}
                    className={cn(
                      "transition-all duration-200 ease-in-out border border-sidebar-border mb-2",
                      isSelected && "ring-2 ring-sidebar-primary border-sidebar-primary bg-sidebar-accent",
                    )}
                    style={{ backgroundColor: getBackgroundColor(patient.created_at, isSelected) }}
                  >
                    <Button
                      ref={isSelected ? selectedRef : null}
                      variant={isSelected ? "secondary" : "ghost"}
                      className="w-full justify-start h-auto p-0 rounded-none"
                      onClick={() => handleSelectTranscript(patient)}
                    >
                      <div className="w-full px-3.5 py-4">
                        <div className="flex items-center">
                          {/* Lock/Delete controls */}
                          <div className="flex flex-col items-center mr-4">
                            <div className="relative">
                              <Switch
                                checked={unlock[patient.mid] || false}
                                onCheckedChange={(checked) => handleSwitchChange(patient.mid, checked)}
                                className="data-[state=checked]:bg-yellow-500 w-10 h-4 [&>span]:h-3.5 [&>span]:w-3.5 [&>span]:translate-x-0.5 data-[state=checked]:[&>span]:translate-x-[22px] rotate-180"
                                onClick={(e) => e.stopPropagation()}
                              />
                              {isDeleting && deleteProgress > 0 && unlock[patient.mid] && (
                                <div
                                  className={cn(
                                    "absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center font-bold rounded z-20",
                                    isSelected ? "bg-secondary" : showGrayShades ? "bg-white/80" : "bg-background",
                                  )}
                                >
                                  {deleteProgress < 100 ? (
                                    <span className="text-2xl text-red-500">
                                      {Math.ceil(3 - (deleteProgress / 100) * 3)}
                                    </span>
                                  ) : (
                                    <div className="text-sm text-center leading-tight text-red-500">
                                      <span>release</span>
                                      <br />
                                      <span className="px-2">to</span>
                                      <br />
                                      <span>delete</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                            <div
                              className="relative mt-2"
                              onMouseDown={(e) => startDelete(e, patient)}
                              onMouseUp={() => confirmDelete(patient)}
                              onMouseLeave={cancelDelete}
                              onTouchStart={(e) => startDelete(e, patient)}
                              onTouchEnd={() => confirmDelete(patient)}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Trash
                                className={cn(
                                  "h-4 w-4",
                                  unlock[patient.mid] ? "text-destructive cursor-pointer" : "text-muted-foreground",
                                )}
                              />
                            </div>
                          </div>

                          {/* Patient info */}
                          <div className="flex-1 flex flex-col items-start justify-center">
                            <div className="flex items-center space-x-1">
                              <span
                                className={cn(
                                  "font-medium text-base leading-tight",
                                  isSelected
                                    ? "text-accent-foreground"
                                    : showGrayShades
                                      ? "text-gray-800"
                                      : "text-foreground",
                                )}
                                contentEditable={unlock[patient.mid]}
                                style={unlock[patient.mid] ? { outline: "none", boxShadow: "0 -2px 0 #fff inset" } : {}}
                                spellCheck={false}
                                onClick={(e: React.MouseEvent) => {
                                  if (unlock[patient.mid]) {
                                    e.stopPropagation()
                                  }
                                }}
                                onKeyDown={(e: React.KeyboardEvent) => {
                                  if (e.key === "Enter") {
                                    e.preventDefault()
                                    setUnlock({ ...unlock, [patient.mid]: false })
                                    const target = e.currentTarget as HTMLSpanElement
                                    handleRename(target.textContent || "", patient.mid || "")
                                  } else if (
                                    e.key !== "Backspace" &&
                                    e.currentTarget.textContent &&
                                    e.currentTarget.textContent.length >= 12
                                  ) {
                                    e.preventDefault()
                                  }
                                }}
                                onKeyUp={(e: React.KeyboardEvent) => {
                                  const target = e.currentTarget as HTMLSpanElement
                                  setPatientName(target.textContent || "")
                                }}
                              >
                                {patient.patient_code || "Unnamed Patient"}
                              </span>
                              <span
                                className={cn(
                                  "text-base leading-tight",
                                  isSelected
                                    ? "text-accent-foreground"
                                    : showGrayShades
                                      ? "text-gray-800"
                                      : "text-foreground",
                                )}
                              >
                                {patient.patient_tag || ""}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "text-sm leading-tight mt-1",
                                isSelected
                                  ? "text-accent-foreground/70"
                                  : showGrayShades
                                    ? "text-gray-600"
                                    : "text-muted-foreground",
                              )}
                            >
                              {moment(patient.created_at).format("DD-MMM-YY | HH:mm")}
                            </span>
                          </div>

                          {/* Status indicators */}
                          <div className="flex items-center gap-2.5">
                            {getStatusIcon(patient)}
                            {isFinal(patient) ? (
                              <Badge variant="default">Final</Badge>
                            ) : (
                              <Badge variant="secondary">In Progress</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Button>
                  </Card>
                )
              })
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Selected patient details */}
      {selectedTranscript && (
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent">
          <h3 className="font-medium text-xl text-sidebar-foreground mb-1">{selectedTranscript.patient_code}</h3>
          <div className="text-sm text-sidebar-foreground/70">
            {moment(selectedTranscript.created_at).format("MMMM DD, YYYY | h:mm A")}
          </div>
          <div className="mt-2 flex items-center gap-2">
            {isFinal(selectedTranscript) ? (
              <Badge variant="default" className="bg-sidebar-primary text-sidebar-primary-foreground">
                Final
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-sidebar-accent text-sidebar-accent-foreground">
                In Progress
              </Badge>
            )}
            {selectedTranscript.token_count > 0 && (
              <Badge variant="outline" className="border-sidebar-border text-sidebar-foreground">
                {selectedTranscript.token_count} chunks
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TranscriptList
