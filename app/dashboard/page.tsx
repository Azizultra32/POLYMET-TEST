import { ErrorBoundary } from "@/components/error-boundary"
import ClientProtectedRoute from "@/components/client-protected-route"
import TranscriptDashboard from "@/components/transcript-dashboard"

export default function DashboardPage() {
  return (
    <ClientProtectedRoute>
      <ErrorBoundary>
        <TranscriptDashboard />
      </ErrorBoundary>
    </ClientProtectedRoute>
  )
}
