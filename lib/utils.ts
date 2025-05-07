"use client"

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function uuidv4() {
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (Number(c) ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (Number(c) / 4)))).toString(16),
  )
}

export function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
}

export async function checkMicrophonePermissions(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((track) => track.stop())
    return true
  } catch (error) {
    console.error("Microphone permission check failed:", error)
    return false
  }
}

export function getAudioMimeType(): string {
  // Check for browser support of various audio formats
  const audioElement = document.createElement("audio")

  if (MediaRecorder.isTypeSupported("audio/webm")) {
    return "audio/webm"
  } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
    return "audio/mp4"
  } else if (MediaRecorder.isTypeSupported("audio/ogg")) {
    return "audio/ogg"
  }

  // Default to WAV if we can't determine support
  return "audio/wav"
}

export function truncate(str: string, n: number, useWordBoundary: boolean): string {
  if (!str || str.length <= n) return str || ""
  const subString = str.slice(0, n - 1)
  return useWordBoundary ? subString.slice(0, subString.lastIndexOf(" ")) : subString
}
