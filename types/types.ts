export interface TranscriptData {
  mid: string
  id?: string
  patient_code: string
  patient_tag?: number
  language?: string
  token_count: number
  created_at?: Date
  completed_at?: Date | null
  queued_completed_at?: Date | null
  is_paused?: boolean
  ai_summary?: string | null
}

export interface AudioChunk {
  patientId: string
  chunkNumber: number
  blob: string | Blob
  timestamp: number
}

export interface OfflineQueueItem {
  id: string
  type: "create" | "update" | "delete" | "upload"
  data: any
  timestamp: number
  patientCode?: string
}
