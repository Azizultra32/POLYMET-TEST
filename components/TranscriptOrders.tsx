"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Maximize2 } from "lucide-react"
import { Button } from "./ui/button"
import TranscriptSummary, { type TranscriptSummaryRef } from "./TranscriptSummary"
import type { Transcript } from "@/types/types"

interface TranscriptOrdersProps {
  transcript: Transcript
  summaryMap: Record<string, any>
  onCopy: (ref: React.RefObject<TranscriptSummaryRef>) => void
  onMaximize: (ref: React.RefObject<TranscriptSummaryRef>) => void
  summaryRef: React.RefObject<TranscriptSummaryRef>
}

const TranscriptOrders: React.FC<TranscriptOrdersProps> = ({
  transcript,
  summaryMap,
  onCopy,
  onMaximize,
  summaryRef,
}) => {
  // Add proper type checking before rendering
  const hasSummary =
    summaryMap && typeof summaryMap["5"] === "object" && summaryMap["5"] !== null && !Array.isArray(summaryMap["5"])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-center border-b pb-2">
          <CardTitle className="text-xl font-semibold text-primary-600">Orders</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => onCopy(summaryRef)}>
              <Copy className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onMaximize(summaryRef)}>
              <Maximize2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow min-h-0 pt-2 px-4 pb-4">
        {hasSummary ? (
          <TranscriptSummary ref={summaryRef} summary={summaryMap["5"]} transcript={transcript} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">No summary available</div>
        )}
      </CardContent>
    </Card>
  )
}

export default TranscriptOrders
