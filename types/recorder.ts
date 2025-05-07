export interface Patient {
  mid: string
  patient_code: string
  patient_tag?: number
  language?: string
  token_count?: number
  created_at?: Date
  completed_at?: Date | null
  queued_completed_at?: Date | null
  is_paused?: boolean
  ai_summary?: string | null
}
