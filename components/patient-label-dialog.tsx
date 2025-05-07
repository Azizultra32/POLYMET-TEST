"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { TranscriptData } from "@/types/types"

interface PatientLabelDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (patientLabel: string) => void
  patientData: TranscriptData
}

export function PatientLabelDialog({ isOpen, onClose, onConfirm, patientData }: PatientLabelDialogProps) {
  const [patientLabel, setPatientLabel] = useState("")

  // Reset the input when the dialog opens
  useEffect(() => {
    if (isOpen) {
      setPatientLabel(patientData.patient_code || "")
    }
  }, [isOpen, patientData.patient_code])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onConfirm(patientLabel || "Patient")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-background border-border">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-xl font-medium text-foreground">Patient Label</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="patientLabel" className="mb-2 block text-foreground/80 font-medium">
              Enter a label for this patient
            </Label>
            <Input
              id="patientLabel"
              value={patientLabel}
              onChange={(e) => setPatientLabel(e.target.value)}
              placeholder="Patient name or identifier"
              className="w-full border-input focus:ring-primary/30"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} className="border-input hover:bg-muted">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              Start Recording
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
