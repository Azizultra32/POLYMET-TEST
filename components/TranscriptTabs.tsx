"use client"

import type React from "react"
import { useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Transcript } from "@/types/types"
import TranscriptConsultWizard from "./TranscriptConsultWizard"
import TranscriptOrders from "./TranscriptOrders"
import TranscriptLooper from "./TranscriptLooper"
import TranscriptAssistPatient from "./TranscriptAssistPatient"
import TranscriptTaskGo from "./TranscriptTaskGo"
import TranscriptHashTask from "./TranscriptHashTask"
import type { TranscriptSummaryRef } from "./TranscriptSummary"

interface TranscriptTabsProps {
  transcript: Transcript
  summaryMap: Record<string, any>
  activeTab: string
  setActiveTab: (tab: string) => void
  summaryRefs: {
    [key: string]: React.RefObject<TranscriptSummaryRef>
  }
  handleCopy: (ref: React.RefObject<TranscriptSummaryRef>) => void
  handleMaximize: (ref: React.RefObject<TranscriptSummaryRef>) => void
  features: {
    looper: boolean
    assistPatient: boolean
    taskGo: boolean
    hashTask: boolean
  }
}

const TranscriptTabs: React.FC<TranscriptTabsProps> = ({
  transcript,
  summaryMap,
  activeTab,
  setActiveTab,
  summaryRefs,
  handleCopy,
  handleMaximize,
  features,
}) => {
  // Switch to consult tab if current tab becomes invisible
  useEffect(() => {
    const isCurrentTabVisible =
      activeTab === "consult" ||
      activeTab === "orders" ||
      (activeTab === "looper" && features.looper) ||
      (activeTab === "assist" && features.assistPatient) ||
      (activeTab === "taskgo" && features.taskGo) ||
      (activeTab === "hashtask" && features.hashTask)

    if (!isCurrentTabVisible) {
      setActiveTab("consult")
    }
  }, [activeTab, features, setActiveTab])

  return (
    <div className="flex-1 flex flex-col bg-muted/30">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow min-h-0 flex flex-col">
        <div className="px-6 pt-6">
          <TabsList className="w-full h-auto flex flex-wrap gap-2 bg-muted/50">
            <TabsTrigger
              value="consult"
              className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Consult Wizard
            </TabsTrigger>
            <TabsTrigger
              value="orders"
              className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
            >
              Orders
            </TabsTrigger>
            {features.looper && (
              <TabsTrigger
                value="looper"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Looper
              </TabsTrigger>
            )}
            {features.assistPatient && (
              <TabsTrigger
                value="assist"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Assist Patient
              </TabsTrigger>
            )}
            {features.taskGo && (
              <TabsTrigger
                value="taskgo"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                Task-GO
              </TabsTrigger>
            )}
            {features.hashTask && (
              <TabsTrigger
                value="hashtask"
                className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm"
              >
                #-Task
              </TabsTrigger>
            )}
          </TabsList>
        </div>

        <div className="flex-grow min-h-0 p-6 pt-4 bg-background rounded-b-lg mx-6 mb-6 shadow-sm">
          <TabsContent value="consult" className="h-full m-0">
            {summaryRefs["3"] &&
            summaryMap &&
            typeof summaryMap["3"] === "object" &&
            summaryMap["3"] !== null &&
            !Array.isArray(summaryMap["3"]) ? (
              <TranscriptConsultWizard
                transcript={transcript}
                summaryMap={summaryMap || {}}
                onCopy={handleCopy}
                onMaximize={handleMaximize}
                summaryRef={summaryRefs["3"]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                No consult wizard data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders" className="h-full m-0">
            {summaryRefs["5"] &&
            summaryMap &&
            typeof summaryMap["5"] === "object" &&
            summaryMap["5"] !== null &&
            !Array.isArray(summaryMap["5"]) ? (
              <TranscriptOrders
                transcript={transcript}
                summaryMap={summaryMap || {}}
                onCopy={handleCopy}
                onMaximize={handleMaximize}
                summaryRef={summaryRefs["5"]}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                No orders data available
              </div>
            )}
          </TabsContent>

          {features.looper && (
            <TabsContent value="looper" className="h-full m-0">
              {summaryRefs["2"] &&
              summaryMap &&
              typeof summaryMap["2"] === "object" &&
              summaryMap["2"] !== null &&
              !Array.isArray(summaryMap["2"]) ? (
                <TranscriptLooper
                  transcript={transcript}
                  summaryMap={summaryMap || {}}
                  onCopy={handleCopy}
                  onMaximize={handleMaximize}
                  summaryRef={summaryRefs["2"]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                  No looper data available
                </div>
              )}
            </TabsContent>
          )}

          {features.assistPatient && (
            <TabsContent value="assist" className="h-full m-0">
              {summaryRefs["9"] &&
              summaryMap &&
              typeof summaryMap["9"] === "object" &&
              summaryMap["9"] !== null &&
              !Array.isArray(summaryMap["9"]) ? (
                <TranscriptAssistPatient
                  transcript={transcript}
                  summaryMap={summaryMap || {}}
                  onCopy={handleCopy}
                  onMaximize={handleMaximize}
                  summaryRef={summaryRefs["9"]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                  No assist patient data available
                </div>
              )}
            </TabsContent>
          )}

          {features.taskGo && (
            <TabsContent value="taskgo" className="h-full m-0">
              {summaryRefs["4"] &&
              summaryMap &&
              typeof summaryMap["4"] === "object" &&
              summaryMap["4"] !== null &&
              !Array.isArray(summaryMap["4"]) ? (
                <TranscriptTaskGo
                  transcript={transcript}
                  summaryMap={summaryMap || {}}
                  onCopy={handleCopy}
                  onMaximize={handleMaximize}
                  summaryRef={summaryRefs["4"]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                  No task-go data available
                </div>
              )}
            </TabsContent>
          )}

          {features.hashTask && (
            <TabsContent value="hashtask" className="h-full m-0">
              {summaryRefs["6"] &&
              summaryMap &&
              typeof summaryMap["6"] === "object" &&
              summaryMap["6"] !== null &&
              !Array.isArray(summaryMap["6"]) ? (
                <TranscriptHashTask
                  transcript={transcript}
                  summaryMap={summaryMap || {}}
                  onCopy={handleCopy}
                  onMaximize={handleMaximize}
                  summaryRef={summaryRefs["6"]}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground bg-muted/10 rounded-lg p-8">
                  No #-task data available
                </div>
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  )
}

export default TranscriptTabs
