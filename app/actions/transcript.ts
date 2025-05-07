"use server"

import { createServerClient } from "@/lib/supabase/server"
import type { TranscriptData } from "@/types/transcript"

export async function createTranscript(transcript: TranscriptData) {
  const supabase = createServerClient()

  // Get the current user from the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("User not authenticated")
  }

  const userId = session.user.id

  try {
    const { data, error } = await supabase
      .from("transcripts2")
      .insert({
        patient_code: transcript.patient_code,
        patient_tag: transcript.patient_tag,
        mid: transcript.mid,
        language: transcript.language,
        token_count: transcript.token_count,
        user_id: userId, // Add the user_id from the authenticated session
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating transcript:", error)
      return {
        success: false,
        error: "Failed to create transcript",
      }
    }

    // Return a plain object, not a function or complex object
    return {
      success: true,
      data: data
        ? {
            id: data.id,
            mid: data.mid,
            patient_code: data.patient_code,
            patient_tag: data.patient_tag,
            language: data.language,
            token_count: data.token_count,
            created_at: data.created_at,
            completed_at: data.completed_at,
            queued_completed_at: data.queued_completed_at,
            is_paused: data.is_paused,
            ai_summary: data.ai_summary,
          }
        : null,
    }
  } catch (error) {
    console.error("Error in createTranscript:", error)
    // Return a plain error object
    return {
      success: false,
      error: "Failed to create transcript",
    }
  }
}

export async function updateTranscript({ mid, token_count }: { mid: string; token_count: number }) {
  const supabase = createServerClient()

  // Get the current user from the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("User not authenticated")
  }

  const userId = session.user.id

  try {
    // Include user_id in the query to ensure we're only updating the user's own records
    const { data, error } = await supabase
      .from("transcripts2")
      .update({ token_count })
      .eq("mid", mid)
      .eq("user_id", userId) // Add this to ensure we only update the user's own records
      .select()
      .single()

    if (error) {
      console.error("Error updating transcript:", error)
      throw new Error("Failed to update transcript")
    }

    // Return a plain object, not a function or complex object
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error("Error in updateTranscript:", error)
    // Return a plain error object
    return {
      success: false,
      error: "Failed to update transcript",
    }
  }
}

export async function getTranscripts() {
  const supabase = createServerClient()

  // Get the current user from the session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error("User not authenticated")
  }

  const userId = session.user.id

  try {
    // Only get transcripts for the current user
    const { data, error } = await supabase
      .from("transcripts2")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching transcripts:", error)
      throw new Error("Failed to fetch transcripts")
    }

    // Return a plain array, not a function or complex object
    return data || []
  } catch (error) {
    console.error("Error in getTranscripts:", error)
    // Return an empty array on error
    return []
  }
}
