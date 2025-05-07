export interface TranscriptData {
  mid?: string
  patient_code: string
  patient_tag: number
  language?: string
  token_count: number
  created_at?: Date
  completed_at?: Date | null
  queued_completed_at?: Date | null
  is_paused?: boolean
  ai_summary?: string | null
}

export interface Transcript extends TranscriptData {
  id?: number
}

export interface AudioChunk {
  patientId: string
  chunkNumber: number
  blob: string | Blob
  timestamp: number
}

export interface OfflineQueueItem {
  type: "create" | "update" | "delete" | "upload"
  data: any
  id?: string
  timestamp?: number
}

export interface ChunkNumberWrapper {
  chunkNumber: number
}
