"use client"

import { useEffect, useState } from "react"
import { MicOff, Volume2, AlertTriangle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface SpeechRecognitionStatusProps {
  listening: boolean
  transcript: string
  noSpeechDetected: boolean
  microphoneAvailable: boolean
}

export default function SpeechRecognitionStatus({
  listening,
  transcript,
  noSpeechDetected,
  microphoneAvailable,
}: SpeechRecognitionStatusProps) {
  const [lastWords, setLastWords] = useState("")

  // Extract the last few words from the transcript
  useEffect(() => {
    if (transcript && transcript.length > 0) {
      const words = transcript.split(" ")
      const lastFewWords = words.slice(-5).join(" ")
      setLastWords(lastFewWords)
    }
  }, [transcript])

  if (!microphoneAvailable) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-md shadow-md border border-red-200"
        >
          <MicOff className="h-4 w-4" />
          <span className="text-sm font-medium">Microphone unavailable</span>
        </motion.div>
      </div>
    )
  }

  if (noSpeechDetected && listening) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-md shadow-md border border-yellow-200"
        >
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">No speech detected</span>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {listening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-green-100 text-green-800 px-4 py-2 rounded-md shadow-md border border-green-200"
          >
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4 animate-pulse" />
              <span className="text-sm font-medium">{lastWords ? `"${lastWords}"` : "Listening..."}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
