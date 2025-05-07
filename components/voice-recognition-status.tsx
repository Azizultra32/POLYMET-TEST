"use client"

import { useState, useEffect } from "react"
import { Volume2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface VoiceRecognitionStatusProps {
  transcript?: string
  className?: string
}

export default function VoiceRecognitionStatus({ transcript = "", className }: VoiceRecognitionStatusProps) {
  const [lastWords, setLastWords] = useState("")
  const [isVisible, setIsVisible] = useState(false)

  // Extract the last few words from the transcript for display
  useEffect(() => {
    if (transcript && transcript.length > 0) {
      const words = transcript.split(" ")
      const lastFewWords = words.slice(-3).join(" ")
      setLastWords(lastFewWords)

      // Show the status briefly when new words are detected
      setIsVisible(true)
      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [transcript])

  // Only show when there's active speech being processed
  if (!isVisible || !lastWords) return null

  return (
    <div className={cn("fixed bottom-4 right-4 z-50", className)}>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-50 text-emerald-800 border-emerald-200 flex items-center gap-2 px-3 py-1.5 rounded-full shadow-sm border"
        >
          <Volume2 className="h-3.5 w-3.5 text-emerald-500 animate-pulse" />
          <span className="text-xs font-medium truncate max-w-[150px]">"{lastWords}"</span>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
