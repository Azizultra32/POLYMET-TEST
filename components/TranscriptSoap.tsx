"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Copy, Maximize2, FileText } from "lucide-react"
import { Button } from "./ui/button"
import TranscriptSummary, { type TranscriptSummaryRef } from "./TranscriptSummary"
import type { Transcript } from "@/types/types"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface TranscriptSoapProps {
  transcript: Transcript
  summaryMap: Record<string, any>
  showDetail: boolean
  setShowDetail: (show: boolean) => void
  summaryRef: React.RefObject<TranscriptSummaryRef>
  handleCopy: (ref: React.RefObject<TranscriptSummaryRef>) => void
  handleMaximize: (ref: React.RefObject<TranscriptSummaryRef>) => void
}

const TranscriptSoap: React.FC<TranscriptSoapProps> = ({
  transcript,
  summaryMap,
  showDetail,
  setShowDetail,
  summaryRef,
  handleCopy,
  handleMaximize,
}) => {
  return (
    <div className="w-full md:w-[45%] p-4 border-r border-border overflow-hidden max-h-[calc(100vh-100px)] bg-neutral-50 dark:bg-neutral-900/50">
      <Card className="h-full flex flex-col shadow-sm">
        <CardHeader className="p-4 pb-2 bg-card">
          <div className="flex justify-between items-center border-b pb-2">
            <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-primary-600">
              <FileText className="h-5 w-5 text-primary-500" />
              S.O.A.P <sup className="text-sm">MD</sup>
            </CardTitle>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(summaryRef)}
                        className="h-8 w-8 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/20"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Copy to clipboard</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMaximize(summaryRef)}
                        className="h-8 w-8 rounded-full hover:bg-primary-100 dark:hover:bg-primary-900/20"
                      >
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Maximize view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Detail</span>
                <Switch
                  checked={showDetail}
                  onCheckedChange={setShowDetail}
                  className="data-[state=checked]:bg-primary-600"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-grow min-h-0 pt-2 px-4 pb-4 overflow-hidden">
          <ScrollArea className="h-full pr-2">
            {summaryMap && summaryMap["1"] ? (
              <TranscriptSummary ref={summaryRef} summary={summaryMap["1"]} transcript={transcript} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center p-4">
                <div className="rounded-full bg-primary-100 dark:bg-primary-900/20 p-3 mb-4">
                  <FileText className="h-6 w-6 text-primary-500" />
                </div>
                <p className="text-muted-foreground mb-2">No summary available yet</p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Record a patient session to generate a SOAP note summary
                </p>
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

export default TranscriptSoap
