"use client"

import { useState, useEffect } from "react"
import { useAuthState } from "@/hooks/use-auth-state"

// This hook provides a simplified auth interface that works consistently
export function useCombinedAuth() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Use the auth state hook as the primary source of truth
  const authState = useAuthState()

  useEffect(() => {
    if (authState.isAuthenticated === true) {
      // If authenticated but no user object, create a minimal user object
      setUser({ id: "authenticated-user" })
    } else {
      setUser(null)
    }
    setIsLoading(authState.isLoading)
  }, [authState.isAuthenticated, authState.isLoading])

  return {
    user,
    isAuthenticated: !!user || authState.isAuthenticated === true,
    isLoading,
    // We don't have access to these methods from authState
    // but we include them for API compatibility
    login: async () => {
      console.warn("Login method not available in combined auth")
      return { error: new Error("Login method not available") }
    },
    logout: async () => {
      console.warn("Logout method not available in combined auth")
    },
    error: authState.error,
  }
}
