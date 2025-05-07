"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"

interface AuthContextType {
  user: any
  login: (credentials: { phone: string; password: string }) => Promise<any>
  logout: () => Promise<void>
  changePassword: (data: { password: string }) => Promise<void>
  isLoading: boolean
  error: Error | null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  // Use the singleton Supabase client from our utility
  const supabase = getSupabaseClient()

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Check for existing session first
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          throw sessionError
        }

        console.log("Initial session check:", session ? "Found session" : "No session")
        setUser(session?.user || null)

        // If we have a session, store a backup in localStorage
        if (session) {
          localStorage.setItem(
            "auth-backup",
            JSON.stringify({
              authenticated: true,
              timestamp: Date.now(),
              userId: session.user.id,
            }),
          )
        }
      } catch (err) {
        console.error("Error getting user session:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setUser(null)

        // Try to recover from localStorage backup
        try {
          const authBackup = localStorage.getItem("auth-backup")
          if (authBackup) {
            const { authenticated, timestamp } = JSON.parse(authBackup)
            // Check if the backup is less than 24 hours old
            if (authenticated && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
              // We don't have the actual user object, but we can set a placeholder
              setUser({ id: "recovered-from-backup" })
            }
          }
        } catch (backupErr) {
          console.error("Error recovering from backup:", backupErr)
        }
      } finally {
        setIsLoading(false)
      }
    }

    getUser()

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session ? "Has session" : "No session")
      setUser(session?.user || null)

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

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase.auth])

  const login = async ({ phone, password }: { phone: string; password: string }) => {
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      })

      if (error) {
        setError(error)
        throw error
      }

      return data
    } catch (err) {
      console.error("Login error:", err)
      setError(err instanceof Error ? err : new Error("Unknown login error"))
      throw err
    }
  }

  const logout = async () => {
    try {
      await supabase.auth.signOut()
      localStorage.removeItem("auth-backup")
    } catch (err) {
      console.error("Logout error:", err)
      setError(err instanceof Error ? err : new Error("Unknown logout error"))
    }
  }

  const changePassword = async ({ password }: { password: string }) => {
    setError(null)
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) {
        setError(error)
        throw error
      }
    } catch (err) {
      console.error("Change password error:", err)
      setError(err instanceof Error ? err : new Error("Unknown change password error"))
      throw err
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, changePassword, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
