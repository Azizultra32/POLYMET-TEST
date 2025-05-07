"use client"

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/supabase"

// Create a singleton instance of the Supabase client
let supabaseClientInstance: ReturnType<typeof createClientComponentClient<Database>> | null = null

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing Supabase environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.",
  )
}

export const supabaseClient = (() => {
  // Only create a new instance if we're in the browser and don't already have one
  if (!supabaseClientInstance && typeof window !== "undefined") {
    console.log("Creating new Supabase client instance")

    if (!supabaseUrl || !supabaseKey) {
      console.error("Cannot initialize Supabase client: Missing environment variables")
      // Return a dummy client that will throw helpful errors when methods are called
      return {
        auth: {
          getSession: () =>
            Promise.reject(new Error("Supabase client not properly initialized: Missing environment variables")),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
          signInWithPassword: () =>
            Promise.reject(new Error("Supabase client not properly initialized: Missing environment variables")),
          signOut: () =>
            Promise.reject(new Error("Supabase client not properly initialized: Missing environment variables")),
          updateUser: () =>
            Promise.reject(new Error("Supabase client not properly initialized: Missing environment variables")),
        },
      } as any
    }

    supabaseClientInstance = createClientComponentClient<Database>({
      supabaseUrl,
      supabaseKey,
      options: {
        auth: {
          persistSession: true,
          storageKey: "supabase-auth-token",
          storage: {
            getItem: (key) => {
              if (typeof window === "undefined") {
                return null
              }
              return JSON.parse(window.localStorage.getItem(key) || "null")
            },
            setItem: (key, value) => {
              if (typeof window !== "undefined") {
                window.localStorage.setItem(key, JSON.stringify(value))
              }
            },
            removeItem: (key) => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(key)
              }
            },
          },
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      },
    })
  }
  return supabaseClientInstance!
})()

// Export a function to get the client, which ensures we always use the same instance
export function getSupabaseClient() {
  return supabaseClient
}
