"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorFallbackProps {
  error: Error | null
  resetErrorBoundary?: () => void
}

export default function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const [errorDetails, setErrorDetails] = useState<string | null>(null)

  useEffect(() => {
    // Log the error to console for debugging
    if (error) {
      console.error("Error caught by ErrorFallback:", error)

      // Extract useful information from the error
      let details = error.message
      if (error.stack) {
        // Get the first few lines of the stack trace
        const stackLines = error.stack.split("\n").slice(0, 3).join("\n")
        details += `\n\nStack trace:\n${stackLines}`
      }

      setErrorDetails(details)
    }
  }, [error])

  const handleRefresh = () => {
    if (resetErrorBoundary) {
      resetErrorBoundary()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50 text-red-800 max-w-md mx-auto my-8">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
      <p className="mb-4 text-center">{error?.message || "An unexpected error occurred"}</p>
      {errorDetails && (
        <details className="mb-4 w-full">
          <summary className="cursor-pointer text-sm">Technical details</summary>
          <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">{errorDetails}</pre>
        </details>
      )}
      <Button
        variant="outline"
        className="border-red-300 hover:bg-red-100 flex items-center gap-2"
        onClick={handleRefresh}
      >
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  )
}
