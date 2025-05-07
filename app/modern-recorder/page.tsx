import ModernAudioRecorder from "@/components/modern-audio-recorder"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ModernRecorderPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Modern Audio Recorder</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Modern Audio Recorder Demo</CardTitle>
            <CardDescription>Experience the new animated recording interface</CardDescription>
          </CardHeader>
          <CardContent>
            <ModernAudioRecorder
              patientCode="Demo Patient"
              onRecording={(patient) => console.log("Recording started", patient)}
              onStopRecording={(patient) => console.log("Recording stopped", patient)}
              onUploadComplete={(patient) => console.log("Upload complete", patient)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Features of the new recorder</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Intuitive Animation</h3>
              <p className="text-sm text-muted-foreground">
                The record button animates smoothly when starting, pausing, and stopping recording.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Long Press to Stop</h3>
              <p className="text-sm text-muted-foreground">
                Tap the button to start/pause, or hold for 1 second to stop recording completely.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Voice Commands</h3>
              <p className="text-sm text-muted-foreground">
                Use voice commands like "start recording" or "pause recording" for hands-free operation.
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">Visual Feedback</h3>
              <p className="text-sm text-muted-foreground">
                Sound visualization shows audio levels in real-time while recording.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
