"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export function useAuthState() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Create Supabase client
        const supabase = createClientComponentClient()
        console.log("Checking auth state...")

        // First check localStorage backup (in case cookies are not working)
        const authBackup = localStorage.getItem("auth-backup")
        if (authBackup) {
          try {
            const { authenticated, timestamp } = JSON.parse(authBackup)
            // Check if the backup is less than 24 hours old
            if (authenticated && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              console.log("Auth state restored from localStorage backup")
              setIsAuthenticated(true)
              setIsLoading(false)
              return
            }
          } catch (backupErr) {
            console.error("Error parsing auth backup:", backupErr)
          }
        }

        // Then check Supabase session
        const { data, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        const hasSession = !!data.session
        console.log("Supabase session check:", hasSession ? "Found session" : "No session")
        setIsAuthenticated(hasSession)

        // If authenticated, update the backup
        if (hasSession) {
          localStorage.setItem(
            "auth-backup",
            JSON.stringify({
              authenticated: true,
              timestamp: Date.now(),
              userId: data.session?.user.id,
            }),
          )
        }
      } catch (err) {
        console.error("Error checking auth state:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setIsAuthenticated(false)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()

    // Set up auth state change listener
    let subscription: { unsubscribe: () => void } | null = null

    try {
      const supabase = createClientComponentClient()
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event)
        setIsAuthenticated(!!session)

        // Update backup on sign in
        if (event === "SIGNED_IN" && session) {
          localStorage.setItem(
            "auth-backup",
            JSON.stringify({
              authenticated: true,
              timestamp: Date.now(),
              userId: session.user.id,
            }),
          )
        }

        // Clear backup on sign out
        if (event === "SIGNED_OUT") {
          localStorage.removeItem("auth-backup")
        }
      })

      subscription = data.subscription
    } catch (err) {
      console.error("Error setting up auth state listener:", err)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  return { isAuthenticated, isLoading, error }
}
