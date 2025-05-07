"use client"

import type React from "react"

import { useRef, useState } from "react"
import { useTranscriptFeatures } from "@/hooks/use-transcript-features"
import type { Transcript as TranscriptType } from "@/types/types"
import { useCopyToClipboard } from "usehooks-ts"
import TranscriptSoap from "./TranscriptSoap"
import TranscriptTabs from "./TranscriptTabs"
import { Switch } from "@/components/ui/switch"
import type { TranscriptSummaryRef } from "./TranscriptSummary"

type Props = {
  transcript: TranscriptType
  recordingPatientMidUUID?: string
  uploadingPatientMidUUID?: string
}

interface ToggleButtonProps {
  label: string
  checked: boolean
  onCheckedChange: () => void
}

const ToggleButton = ({ label, checked, onCheckedChange }: ToggleButtonProps) => (
  <div className="flex items-center space-x-2">
    <span className="text-sm">{label}</span>
    <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-black" />
  </div>
)

const Transcript = ({ transcript, recordingPatientMidUUID, uploadingPatientMidUUID }: Props) => {
  const { features, toggleFeature } = useTranscriptFeatures()
  const [activeTab, setActiveTab] = useState<string>("consult")
  const [showDetail, setShowDetail] = useState<boolean>(true)
  const [_, copy] = useCopyToClipboard()

  // Safely handle undefined transcript
  if (!transcript) {
    return <div className="p-4">No transcript data available</div>
  }

  // Safely create summary map with type checking
  const createSummaryMap = () => {
    // Check if the summary exists and is valid
    const selectedSummary = showDetail ? transcript.ai_summary : transcript.ai_short_summary

    // If summary doesn't exist or isn't properly structured, return default map
    if (!selectedSummary) {
      return {
        "1": { number: 1, summary: "No summary available" },
        "2": { number: 2, summary: "No looper data available" },
        "3": { number: 3, summary: "No consult wizard data available" },
        "4": { number: 4, summary: "No task-go data available" },
        "5": { number: 5, summary: "No orders data available" },
        "6": { number: 6, summary: "No #-task data available" },
        "9": { number: 9, summary: "No assist patient data available" },
      }
    }

    try {
      // Try to parse the summary if it's a string
      const parsedSummary = typeof selectedSummary === "string" ? JSON.parse(selectedSummary) : selectedSummary

      // Check if the parsed summary has the expected structure
      if (!parsedSummary.arguments || !Array.isArray(parsedSummary.arguments.summaries)) {
        throw new Error("Invalid summary structure")
      }

      // Create map from valid summaries array
      const summaryMap = parsedSummary.arguments.summaries.reduce((acc: Record<string, any>, latest: any) => {
        // Make sure each summary entry has number and summary properties
        if (latest && typeof latest.number === "number") {
          acc[latest.number.toString()] = latest
        }
        return acc
      }, {})

      // Ensure all required summary types exist
      const requiredSummaries = ["1", "2", "3", "4", "5", "6", "9"]
      requiredSummaries.forEach((num) => {
        if (!summaryMap[num]) {
          summaryMap[num] = { number: Number.parseInt(num), summary: `No data available for summary type ${num}` }
        }
      })

      return summaryMap
    } catch (error) {
      console.error("Error parsing summary:", error)
      // Return default map if parsing fails
      return {
        "1": { number: 1, summary: "No summary available" },
        "2": { number: 2, summary: "No looper data available" },
        "3": { number: 3, summary: "No consult wizard data available" },
        "4": { number: 4, summary: "No task-go data available" },
        "5": { number: 5, summary: "No orders data available" },
        "6": { number: 6, summary: "No #-task data available" },
        "9": { number: 9, summary: "No assist patient data available" },
      }
    }
  }

  const summaryMap = createSummaryMap()

  // Create refs for each summary
  const summaryRefs: Record<string, React.RefObject<TranscriptSummaryRef>> = {
    "1": useRef(null),
    "2": useRef(null),
    "3": useRef(null),
    "4": useRef(null),
    "5": useRef(null),
    "6": useRef(null),
    "9": useRef(null),
  }

  const handleCopy = (ref: React.RefObject<TranscriptSummaryRef>) => {
    if (ref.current) {
      const text = ref.current.getSummary()
      copy(text)
    }
  }

  const handleMaximize = (ref: React.RefObject<TranscriptSummaryRef>) => {
    if (ref.current) {
      ref.current.toggleMaximize()
    }
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row overflow-hidden bg-white border rounded-lg">
      <TranscriptSoap
        transcript={transcript}
        summaryMap={summaryMap}
        showDetail={showDetail}
        setShowDetail={setShowDetail}
        summaryRef={summaryRefs["1"]}
        handleCopy={handleCopy}
        handleMaximize={handleMaximize}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex justify-end p-4 space-x-4 bg-gray-100">
          <ToggleButton label="looper" checked={features.looper} onCheckedChange={() => toggleFeature("looper")} />
          <ToggleButton
            label="assist patient"
            checked={features.assistPatient}
            onCheckedChange={() => toggleFeature("assistPatient")}
          />
          <ToggleButton label="task-go" checked={features.taskGo} onCheckedChange={() => toggleFeature("taskGo")} />
          <ToggleButton label="#task" checked={features.hashTask} onCheckedChange={() => toggleFeature("hashTask")} />
        </div>
        <TranscriptTabs
          transcript={transcript}
          summaryMap={summaryMap}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          summaryRefs={summaryRefs}
          handleCopy={handleCopy}
          handleMaximize={handleMaximize}
          features={features}
        />
      </div>
    </div>
  )
}

export default Transcript
