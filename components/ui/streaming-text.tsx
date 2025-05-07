"use client"

import { useEffect, useRef } from "react"

interface StreamingTextProps {
  text: string
  isLoading?: boolean
  className?: string
}

export function StreamingText({ text, isLoading = false, className = "" }: StreamingTextProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when text changes
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [text])

  return (
    <div ref={containerRef} className={`relative overflow-y-auto whitespace-pre-wrap text-foreground ${className}`}>
      {text}
      {isLoading && <span className="inline-block animate-pulse text-primary">▋</span>}
    </div>
  )
}
