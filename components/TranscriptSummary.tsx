"use client"

import { useCallback, useEffect, useState, useMemo, useRef, useImperativeHandle, forwardRef } from "react"
import { useCopyToClipboard } from "usehooks-ts"
import { ScrollArea } from "./ui/scroll-area"
import { Switch } from "./ui/switch"
import type { Transcript } from "@/types/types"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import moment from "moment"

// Define a proper type for the summary
interface Summary {
  number: number
  summary: string
  [key: string]: any // Allow for additional properties
}

type Props = {
  summary: Summary
  transcript: Transcript
}

// Define the ref type
export interface TranscriptSummaryRef {
  toggleMaximize: () => void
  getSummary: () => string
}

const TranscriptSummary = forwardRef<TranscriptSummaryRef, Props>(({ summary, transcript }: Props, ref) => {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const editableRef = useRef<HTMLParagraphElement>(null)
  const [editedText, setEditedText] = useState<string | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [summaryCopy, setSummaryCopy] = useState<Summary>(summary)

  // Initialize Supabase client
  const supabase = createClientComponentClient()

  useImperativeHandle(ref, () => ({
    toggleMaximize: () => setIsMaximized((prev) => !prev),
    getSummary: () => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 500)
      return summaryCopy.summary || ""
    },
  }))

  const [_, copy] = useCopyToClipboard()

  const handleCopy = useCallback(
    (value: string) => {
      copy(value)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 500)
    },
    [copy],
  )

  const saveEdit = useCallback(() => {
    if (editMode && editableRef.current) {
      // Save changes when toggling edit mode off
      const newContent = editableRef.current.innerText
      setSummaryCopy((prev) => ({
        ...prev,
        summary: newContent,
      }))
      setEditedText(newContent)

      if (typeof window !== "undefined" && transcript.mid) {
        localStorage.setItem(`summary-${transcript.mid}-${summary.number}`, newContent)
      }
    }
  }, [editMode, transcript.mid, summary])

  const toggleEdit = useCallback(() => {
    if (editMode) {
      saveEdit()
    }
    setEditMode(!editMode)
  }, [editMode, saveEdit])

  useEffect(() => {
    if (isMaximized) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMaximized])

  // Effect to handle patient changes and edit mode
  useEffect(() => {
    if (typeof window === "undefined" || !transcript.mid || !summary || typeof summary.number !== "number") return

    const storedEdit = localStorage.getItem(`summary-${transcript.mid}-${summary.number}`)
    setEditedText(storedEdit)

    if (editMode) {
      if (storedEdit) {
        setSummaryCopy((prev) => ({
          ...prev,
          summary: storedEdit,
        }))
      } else {
        setSummaryCopy((prev) => ({
          ...prev,
          summary: summary.summary || "",
        }))
      }
    } else {
      setSummaryCopy((prev) => ({
        ...prev,
        summary: summary.summary || "",
      }))
    }
  }, [editMode, summary, transcript.mid])

  useEffect(() => {
    if (typeof window === "undefined" || !transcript.mid || !summary || typeof summary.number !== "number") return

    const storedEdit = localStorage.getItem(`summary-${transcript.mid}-${summary.number}`)
    setEditMode(storedEdit !== null)
  }, [summary, transcript.mid])

  const process = useCallback(
    (text: string) => {
      if (!text) return ""

      const isFinal =
        transcript.completed_at != null &&
        (transcript.completed_at ?? new Date()) >= (transcript.queued_completed_at ?? new Date()) &&
        transcript.token_count > 0 &&
        (transcript.is_paused ?? false) === false

      const momentOfVisit = moment(transcript.created_at || new Date())
      const dateOfVisit = momentOfVisit.format("DD-MMM-YY")
      const timeOfVisit = momentOfVisit.format("HH:mm")

      const statusColor = isFinal ? "#0B9E0E" : "#FFA500"
      const headerColor = isFinal ? statusColor : "#0141C8"

      if (summaryCopy.number === 1 && (editedText === null || !editMode)) {
        return (
          <>
            <span style={{ color: headerColor }}>Armada Provider Assist</span>
            <br />
            <span style={{ color: statusColor }}>
              <b>{isFinal ? "Summary: Finalized" : "Summary In Progress"}</b>
            </span>
            <br />
            <br />
            <span>Date of visit: {dateOfVisit}</span>
            <br />
            <span>Time: {timeOfVisit}</span>
            <br />
            <br />
            <span>{text}</span>
            <br />
            <br />
            <b style={{ color: "#8c8c8c" }}>
              CoPilot: Armada AssistMD & AssistPRO
              <br />
              With Ambient Scribe and Evolved Solutions (AS|ES) (TM)
              <br />
              {"{MPE-ARM-P24.1}"}
            </b>
          </>
        )
      }
      return text
    },
    [summaryCopy.number, transcript, editMode, editedText],
  )

  // Make sure summary.summary exists and is a string
  const processedText = useMemo(() => process(summaryCopy.summary || ""), [process, summaryCopy])

  // Determine if this summary should show edit toggle
  const showEditToggle = summary && typeof summary.number === "number" && ![2, 4, 6, 9].includes(summary.number)

  if (isMaximized) {
    return (
      <>
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setIsMaximized(false)} />
        <div className="fixed inset-4 left-64 z-50 bg-background rounded-lg shadow-lg flex flex-col">
          <div className="flex justify-between items-center p-4 border-b">
            <div className="flex-1" />
            <div className="flex items-center gap-2">
              {showEditToggle && (
                <>
                  <span className="text-sm">edit</span>
                  <Switch
                    checked={editMode}
                    onCheckedChange={toggleEdit}
                    className="data-[state=checked]:bg-orange-500"
                  />
                </>
              )}
            </div>
          </div>
          <ScrollArea className="flex-grow p-4">
            <p
              ref={editableRef}
              className="whitespace-pre-line"
              contentEditable={editMode}
              suppressContentEditableWarning={true}
              onBlur={saveEdit}
              onClick={() => handleCopy(summaryCopy.summary || "")}
              style={isCopied ? { backgroundColor: "#CF9FFF" } : {}}
            >
              {processedText}
            </p>
          </ScrollArea>
        </div>
      </>
    )
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-end mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          {showEditToggle && (
            <>
              <span className="text-sm">edit</span>
              <Switch checked={editMode} onCheckedChange={toggleEdit} className="data-[state=checked]:bg-orange-500" />
            </>
          )}
        </div>
      </div>
      <ScrollArea className="flex-grow">
        <p
          ref={editableRef}
          className="whitespace-pre-line"
          contentEditable={editMode}
          suppressContentEditableWarning={true}
          onBlur={saveEdit}
          onClick={() => handleCopy(summaryCopy.summary || "")}
          style={isCopied ? { backgroundColor: "#CF9FFF" } : {}}
        >
          {processedText}
        </p>
      </ScrollArea>
    </div>
  )
})

TranscriptSummary.displayName = "TranscriptSummary"

export default TranscriptSummary
