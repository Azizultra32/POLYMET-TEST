import RecordButtonDemo from "@/components/record-button-demo"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function RecordButtonPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">Animated Record Button</h1>

      <div className="max-w-3xl mx-auto">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Interactive Demo</CardTitle>
            <CardDescription>Try out the animated record button with all its features</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <RecordButtonDemo />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Key features of the animated record button</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Smooth Animation:</strong> The button animates smoothly between different states
              </li>
              <li>
                <strong>Long Press Detection:</strong> Hold the button to stop recording with visual feedback
              </li>
              <li>
                <strong>State Management:</strong> Handles idle, recording, paused, and error states
              </li>
              <li>
                <strong>Microphone Permission:</strong> Automatically checks and requests microphone access
              </li>
              <li>
                <strong>Visual Feedback:</strong> Clear visual indicators for all states
              </li>
              <li>
                <strong>Error Handling:</strong> Graceful error handling with user feedback
              </li>
              <li>
                <strong>Accessibility:</strong> Proper ARIA labels and keyboard support
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
