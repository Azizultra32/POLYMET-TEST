"use client"

import { useQuery } from "@tanstack/react-query"
import { supabaseClient } from "@/lib/supabase/client"
import type { Transcript } from "@/types/transcript"

export default function useTranscripts() {
  return useQuery<Transcript[]>({
    queryKey: ["transcripts"],
    queryFn: async () => {
      const { data, error } = await supabaseClient
        .from("transcripts2")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error fetching transcripts:", error)
        throw new Error("Failed to fetch transcripts")
      }

      return data || []
    },
  })
}
