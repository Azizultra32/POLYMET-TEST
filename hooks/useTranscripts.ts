"use client"

import { useQuery } from "@tanstack/react-query"
import { supabaseClient } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"

export default function useTranscripts() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ["transcripts2"],
    queryFn: async () => {
      // Don't attempt to fetch if user is not authenticated
      if (!user) {
        console.log("User not authenticated, returning empty transcripts array")
        return []
      }

      try {
        console.log("Fetching transcripts for user:", user.id)
        const { data, error } = await supabaseClient
          .from("transcripts2")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) {
          console.error("Error fetching transcripts:", error)
          throw new Error(`Failed to fetch transcripts: ${error.message}`)
        }

        console.log(`Successfully fetched ${data?.length || 0} transcripts`)
        return data || []
      } catch (err) {
        console.error("Error in transcript query:", err)
        // Return empty array instead of throwing to prevent fatal renderer errors
        return []
      }
    },
    // Only enable the query when user is authenticated
    enabled: !!user,
    // Add retry and error handling options
    retry: 1,
    retryDelay: 1000,
    // Return empty array on error instead of throwing
    throwOnError: false,
  })
}
