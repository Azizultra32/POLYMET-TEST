"use client"

import { type ReactNode, useState, useEffect } from "react"
import { LogOut, Menu, X, Bell, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import Link from "next/link"
import type { Transcript } from "@/types/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import OnlineStatusIndicator from "@/components/online-status-indicator"
import { useTheme } from "next-themes"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar: ReactNode
  selectedTranscript?: Transcript | null
  showSidebar: boolean
  isDesktop: boolean
  toggleSidebar: () => void
  recording: boolean
  onlineTranscripts?: Transcript[]
  clientTranscripts?: Transcript[]
}

const DashboardLayout = ({
  children,
  sidebar,
  selectedTranscript,
  showSidebar,
  isDesktop,
  toggleSidebar,
  recording,
  onlineTranscripts,
  clientTranscripts,
}: DashboardLayoutProps) => {
  const { user, logout } = useAuth()
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [planName, setPlanName] = useState<string>("")
  const [transcriptCount, setTranscriptCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [showNotifications, setShowNotifications] = useState(false)

  const TRIAL_LIMIT = 105

  // Calculate unique transcripts count
  useEffect(() => {
    const allTranscripts = [...(onlineTranscripts || []), ...(clientTranscripts || [])]
    const uniqueTranscripts = Array.from(new Map(allTranscripts.map((t) => [t.mid, t])).values())
    setTranscriptCount(uniqueTranscripts.length)
  }, [onlineTranscripts, clientTranscripts])

  const isTrialLimitReached = transcriptCount >= TRIAL_LIMIT

  // Check subscription status
  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) return

      const supabase = createClientComponentClient()
      const { data: subscription } = await supabase
        .from("UserSubscriptions")
        .select("*, Plans(*)")
        .eq("user_id", user.id)
        .eq("status", "active")
        .single()

      if (subscription?.Plans?.name) {
        setIsSubscribed(true)
        setPlanName(subscription.Plans.name)
      }
    }

    checkSubscription()
  }, [user])

  // Fetch notifications (mock for now)
  useEffect(() => {
    setNotifications([
      { id: 1, title: "New feature available", message: "Try our new AI-powered summary feature", read: false },
      { id: 2, title: "Subscription update", message: "Your trial ends in 7 days", read: true },
    ])
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push("/login")
  }

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            {!isDesktop && (
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
                {showSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            )}
            <Link href="/" className="flex items-center gap-2">
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary/10">
                <img src="/1@2x.png" alt="Logo" className="h-full w-full object-contain p-1" />
              </div>
              <span className="font-semibold text-lg hidden sm:inline-block">AssistMD</span>
            </Link>
          </div>

          {recording && (
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span className="text-sm font-medium">Recording</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <OnlineStatusIndicator />

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground/80">
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative text-foreground/80"
            >
              <Bell className="h-5 w-5" />
              {notifications.some((n) => !n.read) && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </Button>

            {/* Subscription Status */}
            {isSubscribed ? (
              <span className="text-xs sm:text-sm font-medium px-2 py-1 bg-primary/10 text-primary rounded-full">
                {planName}
              </span>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isTrialLimitReached ? "bg-red-500" : "bg-primary"}`}
                      style={{ width: `${Math.min(100, (transcriptCount / TRIAL_LIMIT) * 100)}%` }}
                    ></div>
                  </div>
                  <span
                    className={`text-xs whitespace-nowrap ${isTrialLimitReached ? "text-red-500" : "text-muted-foreground"}`}
                  >
                    {transcriptCount}/{TRIAL_LIMIT}
                  </span>
                </div>

                <Link
                  href="/billing"
                  className="text-xs font-medium text-primary hover:text-primary/80 whitespace-nowrap"
                >
                  {isTrialLimitReached ? "Upgrade Now" : "Upgrade"}
                </Link>
                <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-full whitespace-nowrap">
                  Trial
                </span>
              </div>
            )}

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    {user?.email?.charAt(0).toUpperCase() || user?.phone?.charAt(0).toUpperCase() || "U"}
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.email || user?.phone || "User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {isSubscribed ? planName : "Free Trial"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/billing" className="cursor-pointer">
                    Billing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/" className="cursor-pointer">
                    Home
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/afterscribe" className="cursor-pointer">
                    Afterscribe
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={cn(
            "bg-card border-r border-border flex flex-col z-30 transition-all duration-300 ease-in-out",
            isDesktop ? "w-64 sticky top-16 self-start h-[calc(100vh-4rem)]" : "fixed inset-y-16 left-0 w-full md:w-64",
            !isDesktop && !showSidebar && "transform -translate-x-full",
          )}
        >
          {sidebar}
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 overflow-auto transition-all duration-300 ease-in-out",
            isDesktop ? "pl-0" : "",
            !isDesktop && showSidebar ? "hidden md:block" : "block",
          )}
        >
          <div className="container py-6 md:py-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
