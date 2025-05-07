import { createServerComponentClient, createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"
import { getEnvVar, validateFeatureEnv } from "@/lib/env-check"

// Create a server component client (for use in Server Components)
export function createServerSupabaseClient() {
  if (!validateFeatureEnv("supabase")) {
    throw new Error("Cannot initialize Supabase server client: Missing required Supabase environment variables")
  }

  return createServerComponentClient<Database>({
    cookies,
    supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL") as string,
    supabaseKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") as string,
  })
}

// Create a server action client (for use in Server Actions)
export function createActionSupabaseClient() {
  if (!validateFeatureEnv("supabase")) {
    throw new Error("Cannot initialize Supabase action client: Missing required Supabase environment variables")
  }

  return createServerActionClient<Database>({
    cookies,
    supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL") as string,
    supabaseKey: getEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY") as string,
  })
}

// Create an admin client with service role for privileged operations
export function createAdminSupabaseClient() {
  if (!validateFeatureEnv("supabase")) {
    throw new Error("Cannot initialize Supabase admin client: Missing required Supabase environment variables")
  }

  return createServerComponentClient<Database>({
    cookies,
    supabaseUrl: getEnvVar("NEXT_PUBLIC_SUPABASE_URL") as string,
    supabaseKey: getEnvVar("SUPABASE_SERVICE_ROLE_KEY") as string,
  })
}
