"use client"

import { useState } from "react"
import { ReactMic } from "@/components/ReactMic"
import { Button } from "@/components/ui/button"

export default function AudioRecorderExample() {
  const [recording, setRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)

  const startRecording = () => {
    setRecording(true)
  }

  const stopRecording = () => {
    setRecording(false)
  }

  const onStop = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    setAudioURL(url)
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <h2 className="text-xl font-bold">Audio Recorder</h2>

      <div className="border rounded-lg overflow-hidden">
        <ReactMic
          record={recording}
          onStop={onStop}
          strokeColor="#3B82F6"
          backgroundColor="#F3F4F6"
          className="w-full h-24"
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={recording ? stopRecording : startRecording} variant={recording ? "destructive" : "default"}>
          {recording ? "Stop Recording" : "Start Recording"}
        </Button>
      </div>

      {audioURL && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2">Recording Preview</h3>
          <audio src={audioURL} controls className="w-full" />
        </div>
      )}
    </div>
  )
}
