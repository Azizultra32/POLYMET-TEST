"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface EnvStatusProps {
  requiredVars: string[]
}

export function EnvStatus({ requiredVars }: EnvStatusProps) {
  const [missingVars, setMissingVars] = useState<string[]>([])
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    // We can only check public env vars on the client
    // For server-only vars, this will always show as missing
    const missing = requiredVars.filter((name) => name.startsWith("NEXT_PUBLIC_")).filter((name) => !process.env[name])

    setMissingVars(missing)
    setChecked(true)
  }, [requiredVars])

  if (!checked || missingVars.length === 0) {
    return null
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Environment Configuration Issue</AlertTitle>
      <AlertDescription>The following environment variables are missing: {missingVars.join(", ")}</AlertDescription>
    </Alert>
  )
}
