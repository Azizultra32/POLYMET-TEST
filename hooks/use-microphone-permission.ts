"use client"

import { useState, useEffect, useCallback, useRef } from "react"

export function useMicrophonePermission() {
  const [hasMicAccess, setHasMicAccess] = useState<boolean>(false)
  const [isRequesting, setIsRequesting] = useState<boolean>(false)
  const [error, setError] = useState<Error | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Check initial permission state
  useEffect(() => {
    if (!isBrowser) return

    const checkPermission = async () => {
      try {
        // Try to check permission using the Permissions API
        if (navigator.permissions) {
          try {
            const permissionStatus = await navigator.permissions.query({
              name: "microphone" as PermissionName,
            })

            if (permissionStatus.state === "granted") {
              setHasMicAccess(true)
              return
            }
          } catch (err) {
            // Permissions API might not be fully supported, continue to fallback
            console.warn("Permissions API not fully supported:", err)
          }
        }

        // Fallback: Try to get user media to check if we have access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

        // Store the stream to prevent garbage collection in Safari
        streamRef.current = stream

        // Also store a global reference for Safari
        if (typeof window !== "undefined") {
          // @ts-ignore - Add to window for Safari
          window.microphoneStream = stream
        }

        setHasMicAccess(true)
      } catch (err) {
        // If getUserMedia fails, we don't have permission
        console.log("No initial microphone permission:", err)
        setHasMicAccess(false)
      }
    }

    // Only run if mediaDevices is available
    if (navigator.mediaDevices) {
      checkPermission()
    }

    return () => {
      // Clean up the stream when the component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [isBrowser])

  // Function to request microphone access
  const requestAccess = useCallback(async () => {
    if (!isBrowser || !navigator.mediaDevices) {
      return null
    }

    setIsRequesting(true)
    setError(null)

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      // Store the stream to prevent garbage collection in Safari
      streamRef.current = stream

      // Also store a global reference for Safari
      // @ts-ignore - Add to window for Safari
      window.microphoneStream = stream

      setHasMicAccess(true)
      return stream
    } catch (err) {
      console.error("Error requesting microphone access:", err)
      setError(err as Error)
      setHasMicAccess(false)
      return null
    } finally {
      setIsRequesting(false)
    }
  }, [isBrowser])

  // Function to release the stream
  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  return {
    hasMicAccess,
    isRequesting,
    error,
    requestAccess,
    releaseStream,
  }
}
