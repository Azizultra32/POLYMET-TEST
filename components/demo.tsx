"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ErrorBoundary } from "./error-boundary"
import FloatingAfterscribe from "./floating-afterscribe"
import { RenderCountTracker } from "./render-count-tracker"
import { ExternalContentLoader } from "./external-content-loader"

export function Demo() {
  const [renderKey, setRenderKey] = useState(0)
  const forceRerender = () => setRenderKey((prev) => prev + 1)

  return (
    <Tabs defaultValue="component" className="w-full">
      <TabsList className="grid grid-cols-4 mb-8">
        <TabsTrigger value="component">Basic Component</TabsTrigger>
        <TabsTrigger value="render-tracking">Render Tracking</TabsTrigger>
        <TabsTrigger value="error-handling">Error Handling</TabsTrigger>
        <TabsTrigger value="data-fetching">Data Fetching</TabsTrigger>
      </TabsList>

      <TabsContent value="component" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>FloatingAfterscribe Component</CardTitle>
            <CardDescription>Basic component rendering with state management</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <FloatingAfterscribe />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="render-tracking" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Render Count Tracking</CardTitle>
            <CardDescription>Monitoring component re-renders to ensure efficient rendering</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <RenderCountTracker key={renderKey}>
              <FloatingAfterscribe />
            </RenderCountTracker>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="error-handling" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Error Boundary</CardTitle>
            <CardDescription>Demonstrating error handling with Error Boundary</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-2">
                This demo will trigger an error after 2 seconds to show how Error Boundaries catch and handle errors.
              </p>
            </div>
            <ErrorBoundary>
              <FloatingAfterscribe errorTrigger />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="data-fetching" className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Data Fetching Pattern</CardTitle>
            <CardDescription>Loading external content with proper error handling</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            <ExternalContentLoader />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
