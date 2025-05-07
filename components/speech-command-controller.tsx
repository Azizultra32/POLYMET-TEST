"use client"

import { useEffect, useState, useRef } from "react"
import useSpeechRecognition from "@/hooks/use-speech-recognition"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Mic } from "lucide-react"
import VoiceRecognitionStatus from "@/components/voice-recognition-status"

interface SpeechCommandControllerProps {
  onCommand: (command: string, param?: string) => void
  enabled?: boolean
  commands?: Array<{
    command: string
    description: string
  }>
}

export default function SpeechCommandController({
  onCommand,
  enabled = true,
  commands = [],
}: SpeechCommandControllerProps) {
  const [isInitialized, setIsInitialized] = useState(false)
  const [showPermissionButton, setShowPermissionButton] = useState(false)
  const { toast } = useToast()
  const hasStartedRef = useRef(false)
  const initTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const noSpeechToastRef = useRef<{ id: string } | null>(null)

  // Map of commands to callbacks
  const speechCommands = commands.map((cmd) => ({
    command: cmd.command,
    callback: (param?: string) => onCommand(cmd.command, param),
    matchInterim: false,
  }))

  // Add default commands
  const allCommands = [
    ...speechCommands,
    {
      command: "start recording",
      callback: () => onCommand("start recording"),
      matchInterim: false,
    },
    {
      command: "stop recording",
      callback: () => onCommand("stop recording"),
      matchInterim: false,
    },
    {
      command: "pause recording",
      callback: () => onCommand("pause recording"),
      matchInterim: false,
    },
    {
      command: "new patient *",
      callback: (patientName?: string) => onCommand("new patient", patientName),
      matchInterim: false,
    },
    {
      command: "select patient *",
      callback: (patientName?: string) => onCommand("select patient", patientName),
      matchInterim: false,
    },
    // New commands for better control
    {
      command: "save recording",
      callback: () => onCommand("save recording"),
      matchInterim: false,
    },
    {
      command: "discard recording",
      callback: () => onCommand("discard recording"),
      matchInterim: false,
    },
    {
      command: "show patients",
      callback: () => onCommand("show patients"),
      matchInterim: false,
    },
    {
      command: "help",
      callback: () => onCommand("help"),
      matchInterim: false,
    },
  ]

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    startListening,
    stopListening,
    resetTranscript,
    requestMicrophonePermission,
    noSpeechDetected,
  } = useSpeechRecognition({
    commands: allCommands,
    continuous: true,
    language: "en-US",
  })

  // Show/hide no speech indicator
  useEffect(() => {
    if (noSpeechDetected && listening) {
      // Show a toast if we haven't already
      if (!noSpeechToastRef.current) {
        noSpeechToastRef.current = toast({
          title: "No Speech Detected",
          description: "Please speak clearly or check your microphone.",
          duration: 5000,
        })
      }
    } else {
      noSpeechToastRef.current = null
    }
  }, [noSpeechDetected, listening, toast])

  // Request microphone permission manually
  const handleRequestPermission = async () => {
    const granted = await requestMicrophonePermission()
    if (granted) {
      toast({
        title: "Microphone Access Granted",
        description: "Voice commands are now available.",
      })
      setShowPermissionButton(false)
      // Try to start listening again
      if (enabled) {
        setTimeout(() => {
          startListening()
        }, 500)
      }
    } else {
      toast({
        title: "Microphone Access Denied",
        description: "Please enable microphone access in your browser settings.",
        variant: "destructive",
      })
    }
  }

  // Set initialization flag after component mounts
  useEffect(() => {
    // Use a timeout to ensure all hooks are properly initialized
    initTimeoutRef.current = setTimeout(() => {
      setIsInitialized(true)
    }, 1000) // Increased delay for better initialization

    return () => {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current)
      }
    }
  }, [])

  // Start/stop listening based on enabled prop
  useEffect(() => {
    // Only run this effect once the component is fully mounted and initialized
    if (!isInitialized) {
      return
    }

    if (enabled && browserSupportsSpeechRecognition) {
      if (isMicrophoneAvailable) {
        if (!listening && !hasStartedRef.current) {
          console.log("Starting speech recognition from controller")
          hasStartedRef.current = true
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            try {
              startListening()
            } catch (error) {
              console.error("Error starting speech recognition:", error)
            }
          }, 300) // Increased delay for better stability
        }
      } else {
        // Show permission button if microphone is not available
        setShowPermissionButton(true)
        console.log("Microphone not available, showing permission button")
      }
    } else if (listening) {
      console.log("Stopping speech recognition from controller")
      stopListening()
      hasStartedRef.current = false
    }

    return () => {
      if (listening) {
        console.log("Cleaning up speech recognition")
        stopListening()
        hasStartedRef.current = false
      }
    }
  }, [
    enabled,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    listening,
    startListening,
    stopListening,
    isInitialized,
  ])

  // Show a toast when speech recognition is not available
  useEffect(() => {
    if (!isInitialized) return

    if (enabled && !browserSupportsSpeechRecognition) {
      toast({
        title: "Speech Recognition Unavailable",
        description: "Your browser doesn't support voice commands.",
        variant: "destructive",
      })
    }
  }, [enabled, browserSupportsSpeechRecognition, toast, isInitialized])

  // If we need to show the permission button, render it
  if (showPermissionButton) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button onClick={handleRequestPermission} className="bg-blue-500 hover:bg-blue-600 text-white">
          <Mic className="mr-2 h-4 w-4" />
          Enable Voice Commands
        </Button>
      </div>
    )
  }

  // Show voice recognition status
  return (
    <VoiceRecognitionStatus
      listening={listening && enabled}
      transcript={transcript}
      noSpeechDetected={noSpeechDetected}
      microphoneAvailable={isMicrophoneAvailable}
    />
  )
}
