
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          email: string
          role: string
          mfa_enabled: boolean
          last_login: string | null
          risk_score: number | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          email: string
          role?: string
          mfa_enabled?: boolean
          last_login?: string | null
          risk_score?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          role?: string
          mfa_enabled?: boolean
          last_login?: string | null
          risk_score?: number | null
          created_at?: string
        }
      }
      files: {
        Row: {
          id: string
          name: string
          type: string
          size: number
          path: string
          uploaded_by: string
          uploaded_at: string
          access_level: string[]
          threat_score: number
          tags: string[]
          content_analysis: Json | null
        }
        Insert: {
          id?: string
          name: string
          type: string
          size: number
          path: string
          uploaded_by: string
          uploaded_at?: string
          access_level?: string[]
          threat_score?: number
          tags?: string[]
          content_analysis?: Json | null
        }
        Update: {
          id?: string
          name?: string
          type?: string
          size?: number
          path?: string
          uploaded_by?: string
          uploaded_at?: string
          access_level?: string[]
          threat_score?: number
          tags?: string[]
          content_analysis?: Json | null
        }
      }
      activities: {
        Row: {
          id: string
          user_id: string
          action: string
          resource: string | null
          timestamp: string
          ip_address: string | null
          user_agent: string | null
          risk_level: string
          details: Json | null
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          resource?: string | null
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          risk_level?: string
          details?: Json | null
        }
        Update: {
          id?: string
          user_id?: string
          action?: string
          resource?: string | null
          timestamp?: string
          ip_address?: string | null
          user_agent?: string | null
          risk_level?: string
          details?: Json | null
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean
          created_at: string
          action_url: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean
          created_at?: string
          action_url?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean
          created_at?: string
          action_url?: string | null
        }
      }
      mfa_verifications: {
        Row: {
          id: string
          user_id: string
          code: string
          expires_at: string
          verified: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          code: string
          expires_at: string
          verified?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string
          expires_at?: string
          verified?: boolean
          created_at?: string
        }
      }
      settings: {
        Row: {
          id: string
          value: Json
          description: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id: string
          value: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          value?: Json
          description?: string | null
          updated_at?: string
          updated_by?: string | null
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
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          id: string
          name: string
          owner: string | null
          created_at: string | null
          updated_at: string | null
          public: boolean | null
        }
        Insert: {
          id: string
          name: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          public?: boolean | null
        }
      }
      objects: {
        Row: {
          id: string
          bucket_id: string
          name: string
          owner: string | null
          created_at: string | null
          updated_at: string | null
          last_accessed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          bucket_id: string
          name: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          bucket_id?: string
          name?: string
          owner?: string | null
          created_at?: string | null
          updated_at?: string | null
          last_accessed_at?: string | null
          metadata?: Json | null
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
  }
}
