import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import FloatingAfterscribe from "@/components/floating-afterscribe"
import AfterscribeNotes from "@/components/afterscribe-notes"

export default function AfterscribePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Afterscribe Demo</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Floating Afterscribe</CardTitle>
            <CardDescription>A draggable component for quick note-taking and transcription</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] flex items-center justify-center">
            <p className="text-center text-muted-foreground">
              The Afterscribe component is floating in the bottom right corner of the screen.
              <br />
              You can drag it anywhere on the screen.
            </p>
          </CardContent>
        </Card>

        <AfterscribeNotes />
      </div>

      <FloatingAfterscribe />
    </div>
  )
}
