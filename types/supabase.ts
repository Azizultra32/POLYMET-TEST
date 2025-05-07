export type Database = {
  public: {
    Tables: {
      transcripts2: {
        Row: {
          id: number
          mid: string | null
          patient_code: string | null
          patient_tag: number | null
          language: string | null
          token_count: number | null
          created_at: string | null
          completed_at: string | null
          queued_completed_at: string | null
          is_paused: boolean | null
          ai_summary: string | null
        }
        Insert: {
          mid?: string
          patient_code?: string
          patient_tag?: number
          language?: string
          token_count?: number
          created_at?: string
          completed_at?: string
          queued_completed_at?: string
          is_paused?: boolean
          ai_summary?: string
        }
        Update: {
          id?: number
          mid?: string
          patient_code?: string
          patient_tag?: number
          language?: string
          token_count?: number
          created_at?: string
          completed_at?: string
          queued_completed_at?: string
          is_paused?: boolean
          ai_summary?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
