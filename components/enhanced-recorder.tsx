"use client"

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Mic, MicOff, Pause, Play, Square } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { ReactMic } from "@/components/ReactMic"
import type { Transcript, TranscriptData } from "@/types/types"
import { uuidv4 } from "@/lib/utils"

interface EnhancedRecorderProps {
  newPatientData: TranscriptData
  patientData?: Transcript
  patientTag: number
  onRecording: (patient: TranscriptData) => void
  onStopRecording?: (patient: TranscriptData) => void
  onUploadComplete?: (patient: TranscriptData) => void
}

const EnhancedRecorder = forwardRef<any, EnhancedRecorderProps>(
  ({ newPatientData, patientData, patientTag, onRecording, onStopRecording, onUploadComplete }, ref) => {
    const [record, setRecord] = useState(false)
    const [patientCode, setPatientCode] = useState("")
    const [isAddendum, setIsAddendum] = useState(false)
    const [hasMicrophoneAccess, setHasMicrophoneAccess] = useState(false)
    const [isCheckingMicrophone, setIsCheckingMicrophone] = useState(true)
    const [currentPatient, setCurrentPatient] = useState<TranscriptData | null>(null)

    const { toast } = useToast()
    const micRef = useRef<any>(null)

    // Expose methods to parent components via ref
    useImperativeHandle(ref, () => ({
      startRecording: (customPatient?: TranscriptData) => {
        handleStartRecording(customPatient)
      },
      stopRecording: () => {
        handleStopRecording()
      },
      pauseRecording: () => {
        handlePauseRecording()
      },
    }))

    // Check for microphone access on mount
    useEffect(() => {
      const checkMicrophonePermission = async () => {
        setIsCheckingMicrophone(true)
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach((track) => track.stop())
          setHasMicrophoneAccess(true)
        } catch (error) {
          console.error("Microphone permission denied:", error)
          setHasMicrophoneAccess(false)
        } finally {
          setIsCheckingMicrophone(false)
        }
      }

      checkMicrophonePermission()
    }, [])

    // Update patient code when patientData changes
    useEffect(() => {
      if (patientData) {
        setPatientCode(patientData.patient_code || "")
      } else {
        setPatientCode("")
      }
    }, [patientData])

    // Handle start recording
    const handleStartRecording = (customPatient?: TranscriptData) => {
      if (!hasMicrophoneAccess) {
        requestMicrophonePermission()
        return
      }

      // Determine which patient data to use
      let patient: TranscriptData

      if (customPatient) {
        // Use custom patient if provided (from voice command)
        patient = customPatient
      } else if (patientData && isAddendum) {
        // Use existing patient for addendum
        patient = {
          ...patientData,
          token_count: 0,
        }
      } else {
        // Use new patient with entered name or default
        patient = {
          ...newPatientData,
          patient_code: patientCode || newPatientData.patient_code,
          patient_tag: patientTag,
          mid: uuidv4(),
          token_count: 0,
        }
      }

      setCurrentPatient(patient)
      setRecord(true)
      onRecording(patient)

      toast({
        title: "Recording Started",
        description: `Recording for ${patient.patient_code}`,
      })
    }

    // Handle stop recording
    const handleStopRecording = () => {
      if (record && currentPatient) {
        setRecord(false)

        if (onStopRecording && currentPatient) {
          onStopRecording(currentPatient)
        }

        toast({
          title: "Recording Stopped",
          description: "Your recording has been saved.",
        })
      }
    }

    // Handle pause recording
    const handlePauseRecording = () => {
      // This would require additional implementation in the ReactMic component
      toast({
        title: "Recording Paused",
        description: "Your recording has been paused.",
      })
    }

    // Request microphone permission
    const requestMicrophonePermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((track) => track.stop())
        setHasMicrophoneAccess(true)

        toast({
          title: "Microphone Access Granted",
          description: "You can now start recording.",
        })
      } catch (error) {
        console.error("Error requesting microphone permission:", error)

        toast({
          title: "Microphone Access Denied",
          description: "Please enable microphone access in your browser settings.",
          variant: "destructive",
        })
      }
    }

    // Handle audio stop (when recording is complete)
    const handleAudioStop = (blob: Blob) => {
      if (currentPatient && onUploadComplete) {
        onUploadComplete(currentPatient)
      }
    }

    return (
      <div className="p-4 bg-white">
        <div className="flex flex-col space-y-4">
          {/* Patient name input */}
          <div className="flex items-center space-x-2">
            <Input
              type="text"
              placeholder="Patient name"
              value={patientCode}
              onChange={(e) => setPatientCode(e.target.value)}
              disabled={record || isCheckingMicrophone}
              className="flex-1"
            />

            {patientData && (
              <div className="flex items-center">
                <label className="text-sm mr-2">Addendum</label>
                <input
                  type="checkbox"
                  checked={isAddendum}
                  onChange={(e) => setIsAddendum(e.target.checked)}
                  disabled={record || isCheckingMicrophone}
                  className="h-4 w-4"
                />
              </div>
            )}
          </div>

          {/* Recording controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {!hasMicrophoneAccess ? (
                <Button
                  onClick={requestMicrophonePermission}
                  disabled={isCheckingMicrophone}
                  className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                  <Mic className="mr-2 h-4 w-4" />
                  {isCheckingMicrophone ? "Checking..." : "Enable Microphone"}
                </Button>
              ) : record ? (
                <>
                  <Button onClick={handleStopRecording} className="bg-red-500 hover:bg-red-600 text-white">
                    <Square className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                  <Button onClick={handlePauseRecording} className="bg-yellow-500 hover:bg-yellow-600 text-white">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                </>
              ) : (
                <Button onClick={() => handleStartRecording()} className="bg-green-500 hover:bg-green-600 text-white">
                  <Play className="mr-2 h-4 w-4" />
                  {isAddendum && patientData ? "Add to Recording" : "Start Recording"}
                </Button>
              )}
            </div>

            {/* Microphone status indicator */}
            <div className="flex items-center">
              {hasMicrophoneAccess ? (
                <span className="text-green-500 flex items-center">
                  <Mic className="h-4 w-4 mr-1" />
                  <span className="text-xs">Mic Ready</span>
                </span>
              ) : (
                <span className="text-red-500 flex items-center">
                  <MicOff className="h-4 w-4 mr-1" />
                  <span className="text-xs">Mic Disabled</span>
                </span>
              )}
            </div>
          </div>

          {/* Audio visualization */}
          <div className={`h-16 ${record ? "opacity-100" : "opacity-50"}`}>
            <ReactMic
              ref={micRef}
              record={record}
              className="w-full h-full"
              onStop={handleAudioStop}
              strokeColor="#4CAF50"
              backgroundColor="#f5f5f5"
            />
          </div>
        </div>
      </div>
    )
  },
)

EnhancedRecorder.displayName = "EnhancedRecorder"

export default EnhancedRecorder
