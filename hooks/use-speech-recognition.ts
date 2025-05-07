"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import "regenerator-runtime/runtime" // Required for speech recognition in some browsers

interface Command {
  command: string
  callback: (param?: string) => void
  matchInterim?: boolean
}

interface SpeechRecognitionOptions {
  commands?: Command[]
  continuous?: boolean
  language?: string
  autoStart?: boolean // New option to start listening immediately
}

interface SpeechRecognitionHook {
  transcript: string
  listening: boolean
  browserSupportsSpeechRecognition: boolean
  isMicrophoneAvailable: boolean
  resetTranscript: () => void
  startListening: () => void
  stopListening: () => void
  requestMicrophonePermission: () => Promise<boolean>
}

// Create a type for the SpeechRecognition object
interface SpeechRecognitionType extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: (event: any) => void
  onerror: (event: any) => void
  onend: (event: any) => void
}

// Initialize SpeechRecognition with proper polyfills
const initSpeechRecognition = () => {
  if (typeof window !== "undefined") {
    // Set up browser polyfills for speech recognition
    window.SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition
    window.SpeechGrammarList = window.SpeechGrammarList || (window as any).webkitSpeechGrammarList
    window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || (window as any).webkitSpeechRecognitionEvent
  }
}

export default function useSpeechRecognition({
  commands = [],
  continuous = false,
  language = "en-US",
  autoStart = false, // Default to false for backward compatibility
}: SpeechRecognitionOptions = {}): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("")
  const [listening, setListening] = useState(false)
  const [browserSupportsSpeechRecognition, setBrowserSupportsSpeechRecognition] = useState(false)
  const [isMicrophoneAvailable, setIsMicrophoneAvailable] = useState(false)

  const recognition = useRef<SpeechRecognitionType | null>(null)
  const micPermissionCheckedRef = useRef(false)
  const lastResultTimestampRef = useRef<number>(0)

  // Initialize speech recognition polyfills
  useEffect(() => {
    initSpeechRecognition()
  }, [])

  // Function to check microphone permission
  const checkMicrophonePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      // Release the stream immediately
      stream.getTracks().forEach((track) => track.stop())
      setIsMicrophoneAvailable(true)
      return true
    } catch (error) {
      console.error("Microphone permission denied:", error)
      setIsMicrophoneAvailable(false)
      return false
    }
  }, [])

  // Function to request microphone permission explicitly
  const requestMicrophonePermission = useCallback(async () => {
    const result = await checkMicrophonePermission()
    return result
  }, [checkMicrophonePermission])

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript("")
  }, [])

  // Start listening
  const startListening = useCallback(() => {
    if (!recognition.current || !browserSupportsSpeechRecognition || !isMicrophoneAvailable) {
      console.log("Cannot start speech recognition: missing requirements")
      return
    }

    // Don't try to start if already listening
    if (listening) {
      console.log("Speech recognition is already active")
      return
    }

    try {
      recognition.current.start()
      setListening(true)
      console.log("Speech recognition started")
    } catch (error) {
      console.error("Error starting speech recognition:", error)
      // If we get an error about recognition already started, update our state to match
      if (error instanceof DOMException && error.message.includes("already started")) {
        setListening(true)
      } else {
        setListening(false)
      }
    }
  }, [recognition, browserSupportsSpeechRecognition, isMicrophoneAvailable, listening])

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognition.current) return

    try {
      if (listening) {
        recognition.current.stop()
        console.log("Speech recognition stopped")
      }
    } catch (error) {
      console.error("Error stopping speech recognition:", error)
    }

    setListening(false)
  }, [recognition, listening])

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setBrowserSupportsSpeechRecognition(true)

        const recognitionInstance = new SpeechRecognition() as SpeechRecognitionType
        recognitionInstance.continuous = continuous
        recognitionInstance.interimResults = true
        recognitionInstance.lang = language

        recognition.current = recognitionInstance

        // Check for microphone access if not already checked
        if (!micPermissionCheckedRef.current) {
          checkMicrophonePermission()
          micPermissionCheckedRef.current = true
        }
      }
    }

    return () => {
      if (recognition.current) {
        try {
          if (listening) {
            recognition.current.stop()
          }
        } catch (e) {
          console.error("Error stopping speech recognition during cleanup:", e)
        }
      }
    }
  }, [continuous, language, listening, checkMicrophonePermission])

  // Set up recognition event handlers
  useEffect(() => {
    if (!recognition.current) return

    recognition.current.onresult = (event: any) => {
      let interimTranscript = ""
      let finalTranscript = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript

        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      // Update transcript
      const newTranscript = finalTranscript || interimTranscript
      setTranscript(newTranscript)

      // Update the last result timestamp
      lastResultTimestampRef.current = Date.now()

      // Process commands if provided
      if (commands.length > 0 && (finalTranscript || interimTranscript)) {
        const isInterim = !finalTranscript

        commands.forEach(({ command, callback, matchInterim = false }) => {
          // Skip if we're only matching final results and this is interim
          if (isInterim && !matchInterim) return

          // Convert to lowercase for case-insensitive matching
          const lowerTranscript = (finalTranscript || interimTranscript).toLowerCase().trim()
          const lowerCommand = command.toLowerCase()

          // Check for exact match
          if (lowerTranscript === lowerCommand) {
            console.log(`Command matched exactly: "${command}"`)
            callback()
            return
          }

          // Check if the transcript contains the command
          if (!command.includes("*") && lowerTranscript.includes(lowerCommand)) {
            console.log(`Command found in transcript: "${command}" in "${lowerTranscript}"`)
            callback()
            return
          }

          // Check for wildcard match
          if (command.includes("*")) {
            const parts = lowerCommand.split("*")

            if (parts.length === 2) {
              const [prefix, suffix] = parts

              if (lowerTranscript.startsWith(prefix)) {
                const parameter = lowerTranscript.substring(prefix.length).trim()
                if (parameter) {
                  console.log(`Wildcard command matched: "${command}" with parameter "${parameter}"`)
                  callback(parameter)
                }
              }
            }
          }
        })
      }
    }

    recognition.current.onerror = (event: any) => {
      console.log("Speech recognition error:", event.error)

      if (event.error === "not-allowed") {
        setIsMicrophoneAvailable(false)
      }
    }

    recognition.current.onend = () => {
      console.log("Speech recognition ended")

      // Only update state if we're not trying to restart immediately
      if (!continuous) {
        setListening(false)
      }

      // If we were supposed to be listening continuously but it stopped,
      // try to restart after a delay
      if (continuous && isMicrophoneAvailable) {
        console.log("Attempting to restart continuous speech recognition")
        // Set a short delay before restarting
        setTimeout(() => {
          try {
            // Only restart if we're not already listening
            if (recognition.current && !listening) {
              recognition.current.start()
              setListening(true)
              console.log("Speech recognition restarted successfully")
            }
          } catch (error) {
            console.error("Error restarting speech recognition:", error)
            setListening(false)
          }
        }, 300)
      }
    }
  }, [recognition, commands, continuous, isMicrophoneAvailable, listening])

  // Add this effect to auto-start listening if autoStart is true
  useEffect(() => {
    if (autoStart && browserSupportsSpeechRecognition && isMicrophoneAvailable && !listening) {
      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        startListening()
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [autoStart, browserSupportsSpeechRecognition, isMicrophoneAvailable, listening, startListening])

  // Add this effect to ensure speech recognition stays active
  useEffect(() => {
    if (!autoStart || !browserSupportsSpeechRecognition || !isMicrophoneAvailable) return

    // Create a watchdog timer to check if speech recognition is  return;

    // Create a watchdog timer to check if speech recognition is active and responsive
    const watchdogInterval = setInterval(() => {
      if (!listening && recognition.current) {
        console.log("Watchdog detected speech recognition inactive, restarting...")
        try {
          recognition.current.start()
          setListening(true)
        } catch (error) {
          console.error("Watchdog error restarting speech recognition:", error)
        }
      }

      // Also check if we haven't received results for a while (possible stalled recognition)
      const now = Date.now()
      if (listening && lastResultTimestampRef.current > 0 && now - lastResultTimestampRef.current > 10000) {
        // 10 seconds without results
        console.log("Speech recognition appears stalled, resetting...")
        try {
          recognition.current?.stop()
          setTimeout(() => {
            recognition.current?.start()
            console.log("Speech recognition restarted after stall")
          }, 300)
        } catch (error) {
          console.error("Error resetting stalled speech recognition:", error)
        }

        // Reset the timestamp
        lastResultTimestampRef.current = now
      }
    }, 5000) // Check every 5 seconds

    return () => clearInterval(watchdogInterval)
  }, [autoStart, browserSupportsSpeechRecognition, isMicrophoneAvailable, listening, recognition])

  return {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
    startListening,
    stopListening,
    requestMicrophonePermission,
  }
}
