"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  CornerDownLeft,
  Terminal,
  Mic,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Minimize2,
  Maximize2,
  Save,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/hooks/use-auth"
import { uuidv4 } from "@/lib/utils"
import dynamic from "next/dynamic"
import useSpeechRecognition from "@/hooks/use-speech-recognition"

// Dynamically import framer-motion to avoid SSR issues
const Motion = dynamic(
  () =>
    import("framer-motion").then((mod) => ({
      default: mod.motion.div,
    })),
  { ssr: false },
)

interface FloatingAfterscribeProps {
  initialText?: string
  errorTrigger?: boolean
  onSave?: (text: string) => void
  onError?: (error: Error) => void
}

const mockGrammarCheck = async (text: string): Promise<string> => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))
  // This is a very basic mock correction. A real API would provide much more sophisticated corrections.
  return text.replace(/\bi\b/g, "I").replace(/\s+/g, " ").trim()
}

export default function FloatingAfterscribe({
  initialText = "",
  errorTrigger = false,
  onSave,
  onError,
}: FloatingAfterscribeProps) {
  const [inputValue, setInputValue] = useState(initialText)
  const [isActive, setIsActive] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [showNotification, setShowNotification] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isMinimized, setIsMinimized] = useState(false)
  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isSaving, setIsSaving] = useState(false)
  const [sessionId, setSessionId] = useState<string>(uuidv4())

  const { toast } = useToast()
  const { user } = useAuth()
  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })

  // Use the custom speech recognition hook
  const { transcript, listening, startListening, stopListening, resetTranscript, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  // Simulate an error if errorTrigger is true (for demo purposes)
  useEffect(() => {
    if (errorTrigger) {
      const timer = setTimeout(() => {
        const error = new Error("This is a simulated error for demonstration purposes")
        if (onError) {
          onError(error)
        } else {
          throw error
        }
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [errorTrigger, onError])

  useEffect(() => {
    // Update input value when transcript changes, but only if active
    if (transcript && isActive) {
      setInputValue((prev) => prev + " " + transcript)
    }
  }, [transcript, isActive])

  // Initialize with initial text if provided
  useEffect(() => {
    if (initialText) {
      setInputValue(initialText)
    }
  }, [initialText])

  const toggleActive = () => {
    if (!isActive) {
      // Starting new transcription
      resetTranscript()
      if (browserSupportsSpeechRecognition) {
        startListening()
      }
    } else {
      if (browserSupportsSpeechRecognition) {
        stopListening()
      }
    }
    setIsActive(!isActive)
  }

  const handleSubmit = useCallback(async () => {
    if (inputValue.trim()) {
      // Add to history
      setHistory((prev) => {
        const newHistory = [inputValue, ...prev.slice(0, 4)]
        return newHistory
      })
      setHistoryIndex(-1)

      // Save to database if user is logged in
      if (user) {
        try {
          setIsSaving(true)
          const { error } = await supabase.from("afterscribe_notes").insert({
            user_id: user.id,
            content: inputValue,
            session_id: sessionId,
          })

          if (error) {
            throw error
          }

          toast({
            title: "Note saved",
            description: "Your note has been saved successfully.",
          })

          // Call onSave callback if provided
          if (onSave) {
            onSave(inputValue)
          }
        } catch (error) {
          console.error("Error saving note:", error)
          toast({
            title: "Error",
            description: "Failed to save your note. Please try again.",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }

      // Clear input and reset
      setInputValue("")
      resetTranscript()
      setIsActive(false)
      if (listening) {
        stopListening()
      }
    }
  }, [inputValue, resetTranscript, listening, stopListening, user, supabase, sessionId, toast, onSave])

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleCopy = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard
        .writeText(inputValue)
        .then(() => {
          setIsCopied(true)
          setShowNotification(true)
          setTimeout(() => {
            setIsCopied(false)
            setShowNotification(false)
          }, 2000)
        })
        .catch((err) => {
          console.error("Failed to copy text: ", err)
          toast({
            title: "Copy failed",
            description: "Failed to copy text to clipboard.",
            variant: "destructive",
          })
        })
    }
  }, [inputValue, toast])

  const navigateHistory = (direction: "back" | "forward") => {
    if (direction === "back" && historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setInputValue(history[newIndex])
    } else if (direction === "forward" && historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setInputValue(history[newIndex])
    } else if (direction === "forward" && historyIndex === 0) {
      setHistoryIndex(-1)
      setInputValue("")
    }
  }

  const handleGrammarCheck = async () => {
    setIsChecking(true)
    try {
      // Call OpenAI API to check grammar
      const response = await fetch("/api/grammar-check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputValue }),
      })

      if (!response.ok) {
        throw new Error("Grammar check failed")
      }

      const data = await response.json()
      setInputValue(data.correctedText)

      toast({
        title: "Grammar checked",
        description: "Text has been checked and corrected.",
      })
    } catch (error) {
      console.error("Error during grammar check:", error)
      toast({
        title: "Grammar check failed",
        description: "Could not check grammar at this time.",
        variant: "destructive",
      })
    } finally {
      setIsChecking(false)
    }
  }

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  // Render a div instead of Motion when SSR
  const MotionComponent = typeof window !== "undefined" ? Motion : "div"

  return (
    <MotionComponent
      drag
      dragMomentum={false}
      initial={position}
      animate={position}
      onDragEnd={(_, info: any) =>
        setPosition({
          x: info?.point?.x || position.x,
          y: info?.point?.y || position.y,
        })
      }
      className="fixed z-50"
    >
      <Card
        className={`w-[453px] ${isMinimized ? "h-12" : "h-[214px]"} bg-gradient-to-br from-primary/10 to-primary/5 overflow-hidden pt-1.5 px-4 pb-4 flex flex-col relative transition-all duration-300 ease-in-out border border-primary/20 shadow-md`}
      >
        <div className="h-[4px]" />
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-semibold text-primary flex items-start">
            Afterscribe
            <span className="text-[0.6em] align-top ml-0.5 -mt-1">TM</span>
          </h2>
          <div className="flex-grow flex justify-start ml-16 space-x-2">
            {!isMinimized && (
              <>
                <Button
                  onClick={() => navigateHistory("back")}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-primary/80 hover:bg-primary/10"
                  disabled={historyIndex >= history.length - 1}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span className="sr-only">Previous entry</span>
                </Button>
                <Button
                  onClick={toggleActive}
                  disabled={!browserSupportsSpeechRecognition}
                  variant="ghost"
                  size="icon"
                  className={`h-8 w-8 rounded-full ${isActive ? "bg-red-500 text-white" : "text-primary/80 hover:bg-primary/10"}`}
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">{isActive ? "Stop transcribing" : "Start transcribing"}</span>
                </Button>
                <Button
                  onClick={() => navigateHistory("forward")}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-primary/80 hover:bg-primary/10"
                  disabled={historyIndex <= 0}
                >
                  <ChevronRight className="h-5 w-5" />
                  <span className="sr-only">Next entry</span>
                </Button>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            {!isMinimized && (
              <>
                <Button
                  onClick={handleGrammarCheck}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-primary/80 hover:bg-primary/10"
                  disabled={isChecking || !inputValue.trim()}
                >
                  {isChecking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  <span className="sr-only">Check grammar</span>
                </Button>
                <Button
                  onClick={handleCopy}
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full text-primary/80 hover:bg-primary/10"
                  disabled={!inputValue.trim()}
                >
                  {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  <span className="sr-only">Copy to clipboard</span>
                </Button>
                {user && (
                  <Button
                    onClick={handleSubmit}
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-full text-primary/80 hover:bg-primary/10"
                    disabled={isSaving || !inputValue.trim()}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span className="sr-only">Save note</span>
                  </Button>
                )}
              </>
            )}
            <Button
              onClick={toggleMinimize}
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full text-primary/80 hover:bg-primary/10"
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              <span className="sr-only">{isMinimized ? "Maximize" : "Minimize"}</span>
            </Button>
          </div>
        </div>
        {!isMinimized && (
          <>
            <div className="flex-grow flex items-start relative">
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value)
                  setHistoryIndex(-1)
                }}
                onKeyPress={handleKeyPress}
                className="w-full h-full resize-none bg-transparent border-none focus:outline-none focus:ring-0 text-foreground text-sm pl-6 pt-0.5"
                style={{ minHeight: "5em" }}
                readOnly={isActive}
                placeholder="Start typing or click the microphone to begin dictation..."
              />
              <Terminal className="absolute left-0 top-1.5 h-4 w-4 text-primary/60" />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSubmit}
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-primary/80 hover:text-primary hover:bg-primary/10"
                disabled={isSaving || !inputValue.trim()}
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
                <span className="sr-only">Submit</span>
              </Button>
            </div>
          </>
        )}
        {showNotification && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-md text-sm">
            Copied to clipboard
          </div>
        )}
      </Card>
    </MotionComponent>
  )
}
