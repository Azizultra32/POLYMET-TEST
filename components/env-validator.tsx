"use client"

import { useEffect, useState } from "react"
import { checkRequiredEnvVars } from "@/lib/env-check"

export function EnvironmentValidator() {
  // Still check for missing vars in case we need this data elsewhere
  const [missingVars, setMissingVars] = useState<string[]>([])

  useEffect(() => {
    const missing = checkRequiredEnvVars()
    setMissingVars(missing)
  }, [])

  // Always return null, effectively removing the popup completely
  return null
}
