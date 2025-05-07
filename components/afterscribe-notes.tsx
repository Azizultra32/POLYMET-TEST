"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Edit, Save, X, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { useAfterscribe } from "@/hooks/use-afterscribe"
import { Textarea } from "@/components/ui/textarea"
import { formatDistanceToNow } from "date-fns"

interface AfterscribeNotesProps {
  sessionId?: string
  className?: string
}

export default function AfterscribeNotes({ sessionId, className = "" }: AfterscribeNotesProps) {
  const { notes, isLoading, deleteNote, updateNote } = useAfterscribe(sessionId)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const handleEdit = (id: string, content: string) => {
    setEditingId(id)
    setEditContent(content)
  }

  const handleSave = async (id: string) => {
    if (editContent.trim() === "") return

    // Update the note using the hook function
    const success = await updateNote(id, editContent)

    if (success) {
      setEditingId(null)
    }
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditContent("")
  }

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Loading your notes...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (notes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>You haven't created any notes yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Use the Afterscribe tool to create notes during your sessions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
        <CardDescription>Your saved notes from Afterscribe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {notes.map((note) => (
          <Card key={note.id} className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => toggleExpand(note.id)}>
                    {expanded[note.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-blue-500"
                    onClick={() => handleEdit(note.id, note.content)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-red-500"
                    onClick={() => deleteNote(note.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button variant="default" size="sm" onClick={() => handleSave(note.id)}>
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <div className={expanded[note.id] ? "" : "line-clamp-3"}>{note.content}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  )
}
