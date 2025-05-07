"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { supabaseClient } from "@/lib/supabase/client" // Import the singleton client

export default function DebugAuth() {
  const [authState, setAuthState] = useState<any>(null)
  const [cookies, setCookies] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [envVarsAvailable, setEnvVarsAvailable] = useState(false)

  // Check if environment variables are available
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    setEnvVarsAvailable(!!supabaseUrl && !!supabaseKey)
  }, [])

  // Function to check auth state
  const checkAuth = async () => {
    setLoading(true)
    try {
      if (!envVarsAvailable) {
        throw new Error("Supabase environment variables are not available")
      }

      // Get session using the singleton client
      const { data, error } = await supabaseClient.auth.getSession()

      if (error) {
        throw error
      }

      setAuthState(data)

      // Get cookies
      const cookiesStr = document.cookie
      const cookiesArr = cookiesStr.split(";").map((c) => c.trim())
      setCookies(cookiesArr)
    } catch (err: any) {
      console.error("Auth check error:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Check auth on mount
  useEffect(() => {
    if (envVarsAvailable) {
      checkAuth()
    } else {
      setLoading(false)
      setError("Supabase environment variables are not available")
    }
  }, [envVarsAvailable])

  // Function to clear cookies
  const clearCookies = () => {
    const cookies = document.cookie.split(";")

    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i]
      const eqPos = cookie.indexOf("=")
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/"
    }

    // Refresh the cookies list
    const cookiesStr = document.cookie
    const cookiesArr = cookiesStr.split(";").map((c) => c.trim())
    setCookies(cookiesArr)

    // Clear local storage
    localStorage.clear()

    // Update auth state
    setAuthState(null)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Auth Debugging</CardTitle>
        <CardDescription>Check your authentication state</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {!envVarsAvailable && (
              <div className="bg-amber-100 border border-amber-300 text-amber-800 p-4 rounded-md">
                <h3 className="font-semibold mb-1">Environment Variables Missing</h3>
                <p>
                  The Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are
                  not available. Auth debugging features are limited.
                </p>
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold mb-2">Auth State</h3>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-xs">
                {authState ? JSON.stringify(authState, null, 2) : "No auth state available"}
              </pre>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Cookies</h3>
              {cookies.length > 0 ? (
                <ul className="bg-gray-100 p-4 rounded-md overflow-auto max-h-40 text-xs">
                  {cookies.map((cookie, index) => (
                    <li key={index} className="mb-1">
                      {cookie}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">No cookies found</p>
              )}
            </div>

            {error && (
              <div className="bg-red-100 border border-red-300 text-red-800 p-4 rounded-md">
                <h3 className="font-semibold mb-1">Error</h3>
                <p>{error}</p>
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={checkAuth} disabled={!envVarsAvailable}>
                Refresh Auth State
              </Button>
              <Button variant="destructive" onClick={clearCookies}>
                Clear Auth Cookies
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
