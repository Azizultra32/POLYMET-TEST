"use client"

import { useState, useEffect } from "react"

/**
 * Custom hook that returns whether a media query matches
 * @param query The media query to check
 * @returns A boolean indicating whether the media query matches
 */
export function useMediaQuery(query: string): boolean {
  // Initialize with a default value to avoid hydration mismatch
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    // Check if window is defined (client-side only)
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia(query)

      // Set the initial value
      setMatches(mediaQuery.matches)

      // Define a callback function to handle changes
      const handleChange = (event: MediaQueryListEvent) => {
        setMatches(event.matches)
      }

      // Add the event listener
      mediaQuery.addEventListener("change", handleChange)

      // Clean up the event listener when the component unmounts
      return () => {
        mediaQuery.removeEventListener("change", handleChange)
      }
    }

    // Return false for SSR
    return () => {}
  }, [query])

  return matches
}

/**
 * Custom hook that returns whether the viewport is mobile-sized
 * @returns A boolean indicating whether the viewport is mobile-sized
 */
export function useMobile(): boolean {
  return useMediaQuery("(max-width: 768px)")
}

/**
 * Custom hook that returns whether the viewport is tablet-sized
 * @returns A boolean indicating whether the viewport is tablet-sized
 */
export function useTablet(): boolean {
  return useMediaQuery("(min-width: 769px) and (max-width: 1024px)")
}

/**
 * Custom hook that returns whether the viewport is desktop-sized
 * @returns A boolean indicating whether the viewport is desktop-sized
 */
export function useDesktop(): boolean {
  return useMediaQuery("(min-width: 1025px)")
}
