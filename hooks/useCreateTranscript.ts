"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import type { TranscriptData } from "@/types/transcript"
import { supabaseClient } from "@/lib/supabase/client"

export async function createTranscriptAsync(transcript: TranscriptData) {
  const { data, error } = await supabaseClient
    .from("transcripts2")
    .insert({
      mid: transcript.mid,
      patient_code: transcript.patient_code,
      patient_tag: transcript.patient_tag,
      language: transcript.language || "auto",
      token_count: transcript.token_count,
      is_paused: false,
    })
    .select()
    .single()

  if (error) {
    console.error("Error creating transcript:", error)
    throw new Error("Failed to create transcript")
  }

  return data
}

export async function updateTranscriptAsync(mid: string, updates: Partial<TranscriptData>) {
  const { data, error } = await supabaseClient.from("transcripts2").update(updates).eq("mid", mid).select().single()

  if (error) {
    console.error("Error updating transcript:", error)
    throw new Error("Failed to update transcript")
  }

  return data
}

export async function deleteTranscriptAsync(mid: string) {
  const { error } = await supabaseClient.from("transcripts2").delete().eq("mid", mid)

  if (error) {
    console.error("Error deleting transcript:", error)
    throw new Error("Failed to delete transcript")
  }

  return true
}

export function realtimeTranscripts(callback: (payload: any) => void) {
  return supabaseClient
    .channel("transcripts-changes")
    .on("postgres_changes", { event: "*", schema: "public", table: "transcripts2" }, (payload) => callback(payload))
    .subscribe()
}

export default function useCreateTransript() {
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: createTranscriptAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcripts"] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ mid, updates }: { mid: string; updates: Partial<TranscriptData> }) =>
      updateTranscriptAsync(mid, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcripts"] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteTranscriptAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transcripts"] })
    },
  })

  return {
    mutateAsync: createMutation.mutateAsync,
    updateAsync: updateMutation.mutateAsync,
    deleteAsync: deleteMutation.mutateAsync,
    isLoading: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
    error: createMutation.error || updateMutation.error || deleteMutation.error,
  }
}
