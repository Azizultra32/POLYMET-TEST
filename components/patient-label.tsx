"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Check, Edit, User } from "lucide-react"
import { cn } from "@/lib/utils"

interface PatientLabelProps {
  patientCode: string
  patientTag?: number
  onChange: (newPatientCode: string) => void
  disabled?: boolean
  className?: string
}

export default function PatientLabel({
  patientCode,
  patientTag,
  onChange,
  disabled = false,
  className,
}: PatientLabelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(patientCode)

  const handleSave = () => {
    onChange(value)
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave()
    } else if (e.key === "Escape") {
      setValue(patientCode)
      setIsEditing(false)
    }
  }

  if (isEditing) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-8 border-primary/30 focus:ring-primary/20"
          maxLength={20}
        />
        <Button size="icon" variant="ghost" onClick={handleSave} className="h-8 w-8 text-primary hover:bg-primary/10">
          <Check className="h-4 w-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md border border-primary/20">
        <User className="h-3.5 w-3.5 text-primary/70" />
        <span className="font-medium text-primary/90">
          {patientCode}
          {patientTag && <span className="ml-1 text-primary/60">#{patientTag}</span>}
        </span>
      </div>
      {!disabled && (
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-8 w-8 text-primary/70 hover:text-primary hover:bg-primary/10"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
