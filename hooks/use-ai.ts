"use client"

import type React from "react"

import { useState, useCallback } from "react"

export function useAI() {
  const [input, setInput] = useState("")
  const [completion, setCompletion] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const controller = new AbortController()

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
  }, [])

  const complete = useCallback(
    async (prompt: string, context?: string) => {
      setIsLoading(true)
      setCompletion("")

      try {
        const response = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, context }),
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(response.statusText)
        }

        // This data is a ReadableStream
        const data = response.body
        if (!data) {
          throw new Error("No data")
        }

        const reader = data.getReader()
        const decoder = new TextDecoder()
        let done = false
        let text = ""

        setIsProcessing(true)
        setIsLoading(false)

        while (!done) {
          const { value, done: doneReading } = await reader.read()
          done = doneReading
          const chunkValue = decoder.decode(value)
          text += chunkValue
          setCompletion(text)
        }

        setIsProcessing(false)
        return text
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request aborted")
        } else {
          console.error("Error:", error)
        }
        setIsLoading(false)
        setIsProcessing(false)
        return ""
      }
    },
    [controller],
  )

  const stop = useCallback(() => {
    controller.abort()
    setIsLoading(false)
    setIsProcessing(false)
  }, [controller])

  return {
    input,
    completion,
    isLoading,
    isProcessing,
    handleInputChange,
    complete,
    stop,
  }
}
