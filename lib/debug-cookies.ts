"use client"

export function logAllCookies() {
  if (typeof document === "undefined") return []

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim())
  console.log("All cookies:", cookies)
  return cookies
}

export function checkAuthCookies() {
  if (typeof document === "undefined") return null

  const cookies = document.cookie.split(";").map((cookie) => cookie.trim())

  const authCookies = cookies.filter(
    (cookie) => cookie.startsWith("sb-") || cookie.startsWith("supabase-") || cookie.startsWith("auth-"),
  )

  console.log("Auth cookies:", authCookies)
  return authCookies.length > 0 ? authCookies : null
}

export function clearAllCookies() {
  if (typeof document === "undefined") return

  const cookies = document.cookie.split(";")

  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i]
    const eqPos = cookie.indexOf("=")
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim()
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
  }

  console.log("All cookies cleared")
}
