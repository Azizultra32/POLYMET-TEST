"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { HelpCircle, Mic } from "lucide-react"
import { cn } from "@/lib/utils"

interface VoiceCommandHelpProps {
  commands: Array<{
    command: string
    description: string
  }>
  className?: string
}

export default function VoiceCommandHelp({ commands, className }: VoiceCommandHelpProps) {
  const [open, setOpen] = useState(false)

  // Default commands if none provided
  const defaultCommands = [
    { command: "start recording", description: "Begin a new recording" },
    { command: "stop recording", description: "End the current recording" },
    { command: "pause recording", description: "Pause the current recording" },
    { command: "new patient [name]", description: "Create a new patient with the specified name" },
    { command: "select patient [name]", description: "Select an existing patient by name" },
    { command: "save recording", description: "Save the current recording" },
    { command: "discard recording", description: "Discard the current recording" },
    { command: "show patients", description: "Show the patient list" },
    { command: "help", description: "Show this help dialog" },
  ]

  const allCommands = commands.length > 0 ? commands : defaultCommands

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className={cn("rounded-full h-8 w-8", className)}>
          <HelpCircle className="h-4 w-4" />
          <span className="sr-only">Voice Command Help</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-primary" />
            Voice Commands
          </DialogTitle>
          <DialogDescription>Available voice commands</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="rounded-md border overflow-hidden">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Command
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-muted-foreground">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {allCommands.map((cmd, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-muted/20" : ""}>
                    <td className="px-3 py-1.5 text-xs font-medium text-primary">"{cmd.command}"</td>
                    <td className="px-3 py-1.5 text-xs text-foreground">{cmd.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
