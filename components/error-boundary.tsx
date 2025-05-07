"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, RefreshCw } from "lucide-react"

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // You can log the error to an error reporting service here
    console.error("Error caught by error boundary:", error, errorInfo)

    // Check for common errors and provide more context
    if (error.message.includes("useAuth must be used inside AuthProvider")) {
      console.error("Authentication context error: Make sure your component tree is properly wrapped with AuthProvider")
    }
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-red-200 rounded-lg bg-red-50 text-red-800 max-w-md mx-auto my-8">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4 text-center">{this.state.error?.message || "An unexpected error occurred"}</p>
          {this.state.error && (
            <details className="mb-4 w-full">
              <summary className="cursor-pointer text-sm">Technical details</summary>
              <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto max-h-40">
                {this.state.error.message}
                {this.state.error.stack && (
                  <>
                    {"\n\nStack trace:\n"}
                    {this.state.error.stack.split("\n").slice(0, 3).join("\n")}
                  </>
                )}
              </pre>
            </details>
          )}
          <Button
            variant="outline"
            className="border-red-300 hover:bg-red-100 flex items-center gap-2"
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
