import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import Providers from "@/app/providers" // Import the providers component
import { EnvironmentValidator } from "@/components/env-validator"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Medical Transcription App",
  description: "A Next.js application for medical transcription and patient management",
  generator: "v0.dev",
}

// Add AuthProvider to the layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <EnvironmentValidator />
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
