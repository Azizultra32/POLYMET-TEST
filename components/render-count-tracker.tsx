"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface RenderCountTrackerProps {
  children: React.ReactNode
}

export function RenderCountTracker({ children }: RenderCountTrackerProps) {
  const [componentRenderCount, setComponentRenderCount] = useState(0)
  const [trackerRenderCount, setTrackerRenderCount] = useState(1)
  const childRef = useRef<HTMLDivElement>(null)

  // Force a re-render of the tracker component
  const forceTrackerRerender = () => {
    setTrackerRenderCount((prev) => prev + 1)
  }

  // Monitor renders in the target component
  useEffect(() => {
    // Use MutationObserver to detect DOM changes in the child component
    if (childRef.current) {
      const observer = new MutationObserver(() => {
        setComponentRenderCount((prev) => prev + 1)
      })

      observer.observe(childRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true,
      })

      return () => observer.disconnect()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 mb-4">
        <Badge variant="outline" className="bg-blue-50">
          Tracker Renders: {trackerRenderCount}
        </Badge>
        <Badge variant="outline" className="bg-green-50">
          Component Renders: {componentRenderCount}
        </Badge>
        <Button size="sm" variant="outline" onClick={forceTrackerRerender}>
          Force Tracker Re-render
        </Button>
      </div>

      <div ref={childRef} className="border p-4 rounded-md">
        {children}
      </div>
    </div>
  )
}
