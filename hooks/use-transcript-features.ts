"use client"

import { useState, useEffect } from "react"

interface TranscriptFeatures {
  looper: boolean
  assistPatient: boolean
  taskGo: boolean
  hashTask: boolean
}

export function useTranscriptFeatures() {
  const [features, setFeatures] = useState<TranscriptFeatures>({
    looper: true,
    assistPatient: true,
    taskGo: true,
    hashTask: true,
  })

  // Load saved features from localStorage on component mount
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      const savedFeatures = localStorage.getItem("transcriptFeatures")
      if (savedFeatures) {
        setFeatures(JSON.parse(savedFeatures))
      }
    } catch (error) {
      console.error("Error loading transcript features:", error)
    }
  }, [])

  // Save features to localStorage when they change
  useEffect(() => {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem("transcriptFeatures", JSON.stringify(features))
    } catch (error) {
      console.error("Error saving transcript features:", error)
    }
  }, [features])

  // Toggle a specific feature
  const toggleFeature = (featureName: keyof TranscriptFeatures) => {
    setFeatures((prev) => ({
      ...prev,
      [featureName]: !prev[featureName],
    }))
  }

  return { features, toggleFeature }
}
