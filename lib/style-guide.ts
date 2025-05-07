/**
 * POLYMET Design System Style Guide
 *
 * This style guide provides consistent design tokens and patterns
 * for use across the POLYMET application.
 */

export const styleGuide = {
  /**
   * Color System
   * Primary colors use a blue palette for the main brand identity
   * Secondary colors provide accent and supporting elements
   * Semantic colors convey status and feedback
   */
  colors: {
    // Primary brand colors - blue palette
    primary: {
      50: "hsl(220, 70%, 95%)", // Lightest - backgrounds, hover states
      100: "hsl(220, 70%, 90%)", // Very light - subtle backgrounds
      200: "hsl(220, 70%, 80%)", // Light - borders, dividers
      300: "hsl(220, 70%, 70%)", // Medium light - secondary buttons
      400: "hsl(220, 70%, 60%)", // Medium - hover states
      500: "hsl(220, 70%, 50%)", // Base primary color - buttons, active states
      600: "hsl(220, 70%, 45%)", // Medium dark - pressed states
      700: "hsl(220, 70%, 40%)", // Dark - focus states
      800: "hsl(220, 70%, 30%)", // Very dark - text on light backgrounds
      900: "hsl(220, 70%, 20%)", // Darkest - headings
      950: "hsl(220, 70%, 15%)", // Extra dark - special cases
    },

    // Neutral colors for text, backgrounds, etc.
    neutral: {
      50: "hsl(220, 20%, 98%)", // Lightest - page backgrounds
      100: "hsl(220, 15%, 95%)", // Very light - card backgrounds
      200: "hsl(220, 15%, 90%)", // Light - borders, dividers
      300: "hsl(220, 10%, 80%)", // Medium light - disabled states
      400: "hsl(220, 10%, 70%)", // Medium - placeholder text
      500: "hsl(220, 10%, 50%)", // Base neutral - secondary text
      600: "hsl(220, 15%, 40%)", // Medium dark - body text
      700: "hsl(220, 15%, 30%)", // Dark - primary text
      800: "hsl(220, 20%, 20%)", // Very dark - headings
      900: "hsl(220, 25%, 10%)", // Darkest - emphasized text
      950: "hsl(220, 30%, 5%)", // Extra dark - special cases
    },

    // Semantic colors for status and feedback
    semantic: {
      success: {
        light: "hsl(145, 65%, 90%)",
        base: "hsl(145, 65%, 42%)",
        dark: "hsl(145, 65%, 32%)",
      },
      warning: {
        light: "hsl(38, 92%, 90%)",
        base: "hsl(38, 92%, 50%)",
        dark: "hsl(38, 92%, 40%)",
      },
      error: {
        light: "hsl(0, 84%, 90%)",
        base: "hsl(0, 84%, 60%)",
        dark: "hsl(0, 84%, 50%)",
      },
      info: {
        light: "hsl(200, 85%, 90%)",
        base: "hsl(200, 85%, 47%)",
        dark: "hsl(200, 85%, 37%)",
      },
    },
  },

  /**
   * Typography System
   * Defines font families, sizes, weights, and line heights
   */
  typography: {
    // Font families
    fontFamily: {
      sans: "Inter, system-ui, -apple-system, sans-serif",
      mono: "JetBrains Mono, monospace",
    },

    // Font sizes (with corresponding line heights)
    fontSize: {
      xs: { size: "0.75rem", lineHeight: "1rem" }, // 12px
      sm: { size: "0.875rem", lineHeight: "1.25rem" }, // 14px
      base: { size: "1rem", lineHeight: "1.5rem" }, // 16px
      lg: { size: "1.125rem", lineHeight: "1.75rem" }, // 18px
      xl: { size: "1.25rem", lineHeight: "1.75rem" }, // 20px
      "2xl": { size: "1.5rem", lineHeight: "2rem" }, // 24px
      "3xl": { size: "1.875rem", lineHeight: "2.25rem" }, // 30px
      "4xl": { size: "2.25rem", lineHeight: "2.5rem" }, // 36px
      "5xl": { size: "3rem", lineHeight: "1" }, // 48px
    },

    // Font weights
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },

    // Line heights
    lineHeight: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
  },

  /**
   * Spacing System
   * Consistent spacing values for margins, padding, and layout
   */
  spacing: {
    px: "1px",
    0: "0",
    0.5: "0.125rem", // 2px
    1: "0.25rem", // 4px
    1.5: "0.375rem", // 6px
    2: "0.5rem", // 8px
    2.5: "0.625rem", // 10px
    3: "0.75rem", // 12px
    3.5: "0.875rem", // 14px
    4: "1rem", // 16px
    5: "1.25rem", // 20px
    6: "1.5rem", // 24px
    8: "2rem", // 32px
    10: "2.5rem", // 40px
    12: "3rem", // 48px
    16: "4rem", // 64px
    20: "5rem", // 80px
    24: "6rem", // 96px
    32: "8rem", // 128px
  },

  /**
   * Border Radius
   * Consistent border radius values for UI elements
   */
  borderRadius: {
    none: "0",
    sm: "0.125rem", // 2px
    DEFAULT: "0.25rem", // 4px
    md: "0.375rem", // 6px
    lg: "0.5rem", // 8px
    xl: "0.75rem", // 12px
    "2xl": "1rem", // 16px
    "3xl": "1.5rem", // 24px
    full: "9999px", // Circular
  },

  /**
   * Shadows
   * Consistent shadow values for depth and elevation
   */
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
    inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)",
    none: "none",
  },

  /**
   * Transitions
   * Consistent transition values for animations
   */
  transitions: {
    DEFAULT: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
    fast: "100ms cubic-bezier(0.4, 0, 0.2, 1)",
    slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
  },

  /**
   * Z-Index
   * Consistent z-index values for layering
   */
  zIndex: {
    0: "0",
    10: "10", // Base elements
    20: "20", // Dropdowns
    30: "30", // Fixed elements
    40: "40", // Modals/dialogs
    50: "50", // Toasts/notifications
    auto: "auto",
  },

  /**
   * Breakpoints
   * Consistent breakpoints for responsive design
   */
  breakpoints: {
    xs: "480px", // Extra small devices
    sm: "640px", // Small devices
    md: "768px", // Medium devices
    lg: "1024px", // Large devices
    xl: "1280px", // Extra large devices
    "2xl": "1536px", // 2X Extra large devices
  },

  /**
   * Component Specific Styles
   * Reusable patterns for common components
   */
  components: {
    // Card styles
    card: {
      default: "bg-card border rounded-lg shadow-sm",
      hover: "hover:border-primary/50 hover:shadow-md transition-all duration-200",
      interactive: "cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200",
    },

    // Button styles
    button: {
      base: "font-medium rounded-md transition-colors",
      primary: "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700",
      secondary: "bg-neutral-200 text-neutral-800 hover:bg-neutral-300 active:bg-neutral-400",
      outline: "border border-neutral-300 bg-transparent hover:bg-neutral-100",
      ghost: "bg-transparent hover:bg-neutral-100",
      sizes: {
        sm: "text-sm px-2 py-1",
        md: "text-base px-4 py-2",
        lg: "text-lg px-6 py-3",
      },
    },

    // Input styles
    input: {
      base: "rounded-md border border-neutral-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20",
      sizes: {
        sm: "text-sm px-2 py-1",
        md: "text-base px-3 py-2",
        lg: "text-lg px-4 py-3",
      },
    },

    // Badge styles
    badge: {
      base: "inline-flex items-center rounded-full text-xs font-medium px-2 py-0.5",
      primary: "bg-primary-100 text-primary-800",
      secondary: "bg-neutral-100 text-neutral-800",
      success: "bg-semantic-success-light text-semantic-success-dark",
      warning: "bg-semantic-warning-light text-semantic-warning-dark",
      error: "bg-semantic-error-light text-semantic-error-dark",
      info: "bg-semantic-info-light text-semantic-info-dark",
    },
  },
}
