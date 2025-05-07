"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/components/ui/use-toast"
import type { AfterscribeNote } from "@/types/types"

export function useAfterscribe(sessionId?: string) {
  const [notes, setNotes] = useState<AfterscribeNote[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const supabase = createClientComponentClient({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
  const { user } = useAuth()
  const { toast } = useToast()

  // Fetch notes for the current user and session
  const fetchNotes = async () => {
    if (!user) return

    setIsLoading(true)
    setError(null)

    try {
      let query = supabase
        .from("afterscribe_notes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (sessionId) {
        query = query.eq("session_id", sessionId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setNotes(data || [])
    } catch (err) {
      console.error("Error fetching afterscribe notes:", err)
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to fetch notes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Save a new note
  const saveNote = async (content: string, noteSessionId: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to save notes.",
        variant: "destructive",
      })
      return null
    }

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("afterscribe_notes")
        .insert({
          user_id: user.id,
          content,
          session_id: noteSessionId,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update local state
      setNotes((prev) => [data, ...prev])

      toast({
        title: "Note saved",
        description: "Your note has been saved successfully.",
      })

      return data
    } catch (err) {
      console.error("Error saving afterscribe note:", err)
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to save your note. Please try again.",
        variant: "destructive",
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // Delete a note
  const deleteNote = async (noteId: string) => {
    if (!user) return false

    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.from("afterscribe_notes").delete().eq("id", noteId).eq("user_id", user.id)

      if (error) {
        throw error
      }

      // Update local state
      setNotes((prev) => prev.filter((note) => note.id !== noteId))

      toast({
        title: "Note deleted",
        description: "Your note has been deleted successfully.",
      })

      return true
    } catch (err) {
      console.error("Error deleting afterscribe note:", err)
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to delete your note. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update a note
  const updateNote = async (noteId: string, content: string) => {
    if (!user) return false

    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase
        .from("afterscribe_notes")
        .update({ content })
        .eq("id", noteId)
        .eq("user_id", user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update local state
      setNotes((prev) => prev.map((note) => (note.id === noteId ? data : note)))

      toast({
        title: "Note updated",
        description: "Your note has been updated successfully.",
      })

      return true
    } catch (err) {
      console.error("Error updating afterscribe note:", err)
      setError(err as Error)
      toast({
        title: "Error",
        description: "Failed to update your note. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch notes when the component mounts or when user/sessionId changes
  useEffect(() => {
    if (user) {
      fetchNotes()
    }
  }, [user, sessionId])

  return {
    notes,
    isLoading,
    error,
    fetchNotes,
    saveNote,
    deleteNote,
    updateNote,
    setNotes,
  }
}
