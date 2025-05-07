import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class values into a single className string
 * using clsx and tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Theme configuration options
 */
export type ThemeConfig = {
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
}

/**
 * Available themes
 */
export const themes: Record<string, ThemeConfig> = {
  default: {
    name: "Default",
    colors: {
      primary: "hsl(220, 70%, 50%)",
      secondary: "hsl(210, 40%, 96.1%)",
      accent: "hsl(210, 40%, 96.1%)",
      background: "hsl(0, 0%, 100%)",
    },
  },
  blue: {
    name: "Blue",
    colors: {
      primary: "hsl(217.2, 91.2%, 59.8%)",
      secondary: "hsl(214.3, 31.8%, 91.4%)",
      accent: "hsl(210, 40%, 96.1%)",
      background: "hsl(210, 40%, 98%)",
    },
  },
  dark: {
    name: "Dark",
    colors: {
      primary: "hsl(217.2, 91.2%, 59.8%)",
      secondary: "hsl(217.2, 32.6%, 17.5%)",
      accent: "hsl(217.2, 32.6%, 17.5%)",
      background: "hsl(222.2, 84%, 4.9%)",
    },
  },
}
