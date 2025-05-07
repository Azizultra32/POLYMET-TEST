// Environment variable validation utility

export function checkRequiredEnvVars() {
  const requiredVars = [
    { name: "NEXT_PUBLIC_SUPABASE_URL", value: process.env.NEXT_PUBLIC_SUPABASE_URL },
    { name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { name: "SUPABASE_SERVICE_ROLE_KEY", value: process.env.SUPABASE_SERVICE_ROLE_KEY },
    { name: "OPENAI_API_KEY", value: process.env.OPENAI_API_KEY },
  ]

  const missing = requiredVars.filter((v) => !v.value).map((v) => v.name)

  if (missing.length > 0) {
    console.warn(`Missing environment variables: ${missing.join(", ")}`)
    return missing
  }

  return []
}

// Check environment variables during initialization
export function validateEnvironment() {
  const missing = checkRequiredEnvVars()

  if (missing.length > 0) {
    console.error(`Application may not function correctly. Missing: ${missing.join(", ")}`)
    return false
  }

  return true
}

// Get a specific environment variable with validation
export function getEnvVar(name: string, required = true): string | undefined {
  const value = process.env[name]

  if (required && !value) {
    console.error(`Required environment variable ${name} is missing`)
  }

  return value
}

// Validate specific feature requirements
export function validateFeatureEnv(feature: "supabase" | "openai" | "all"): boolean {
  switch (feature) {
    case "supabase":
      return Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
          process.env.SUPABASE_SERVICE_ROLE_KEY,
      )
    case "openai":
      return Boolean(process.env.OPENAI_API_KEY)
    case "all":
      return validateEnvironment()
    default:
      return false
  }
}
