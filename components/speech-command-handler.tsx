"use client"

import { useEffect, useCallback, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import useSpeechRecognition from "@/hooks/use-speech-recognition"
import { checkMicrophonePermissions } from "@/lib/utils"

interface SpeechCommandHandlerProps {
  onSpeechCommand: (command: number, text: string) => void
}

export default function SpeechCommandHandler({ onSpeechCommand }: SpeechCommandHandlerProps) {
  const { toast } = useToast()
  const hasMicrophoneAccessRef = useRef(false)
  const speechCommandActivatedRef = useRef(0)

  // Initialize speech recognition
  const { transcript, listening, startListening, stopListening, browserSupportsSpeechRecognition } =
    useSpeechRecognition()

  // Check for microphone permissions
  useEffect(() => {
    const checkMic = async () => {
      const hasMicAccess = await checkMicrophonePermissions()
      hasMicrophoneAccessRef.current = hasMicAccess
    }

    checkMic()
  }, [])

  // Process speech commands
  const processSpeechCommand = useCallback(
    (text: string) => {
      if (!text) return

      const lowerText = text.toLowerCase().trim()

      // Command 1: Start recording
      if (lowerText.includes("start recording") || lowerText.includes("begin recording")) {
        speechCommandActivatedRef.current = 1
        onSpeechCommand(1, text)
        return
      }

      // Command 2: Pause recording
      if (lowerText.includes("pause recording") || lowerText.includes("pause")) {
        speechCommandActivatedRef.current = 2
        onSpeechCommand(2, text)
        return
      }

      // Command 3: Stop recording
      if (lowerText.includes("stop recording") || lowerText.includes("end recording")) {
        speechCommandActivatedRef.current = 3
        onSpeechCommand(3, text)
        return
      }

      // Command 4: Set patient name
      const patientNameMatch = lowerText.match(/patient name (is |)(.*)/i)
      if (patientNameMatch && patientNameMatch[2]) {
        const patientName = patientNameMatch[2].trim()
        speechCommandActivatedRef.current = 4
        onSpeechCommand(4, patientName)
        return
      }

      // Command 5: Save transcript
      if (lowerText.includes("save transcript") || lowerText.includes("save recording")) {
        speechCommandActivatedRef.current = 5
        onSpeechCommand(5, text)
        return
      }

      // Command 6: Show help
      if (lowerText.includes("show help") || lowerText === "help") {
        speechCommandActivatedRef.current = 6
        onSpeechCommand(6, text)
        return
      }
    },
    [onSpeechCommand],
  )

  // Process transcript when it changes
  useEffect(() => {
    if (transcript && transcript.length > 3) {
      processSpeechCommand(transcript)
    }
  }, [transcript, processSpeechCommand])

  // Start/stop listening based on enabled prop
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      console.log("Browser doesn't support speech recognition")
      return
    }

    if (hasMicrophoneAccessRef.current) {
      if (!listening) {
        startListening()
      }
    } else if (listening) {
      stopListening()
    }

    return () => {
      if (listening) {
        stopListening()
      }
    }
  }, [listening, startListening, stopListening, browserSupportsSpeechRecognition])

  // Show warning if speech recognition is not supported
  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      toast({
        title: "Speech Recognition Not Supported",
        description: "Your browser doesn't support speech recognition. Voice commands will not work.",
        variant: "destructive",
      })
    }
  }, [browserSupportsSpeechRecognition, toast])

  // This is a UI-less component
  return null
}
