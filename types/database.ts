export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ArchiveStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface Database {
  public: {
    Tables: {
      gallery_archives: {
        Row: {
          id: string
          gallery_id: string
          version: number
          images_hash: string
          storage_path: string
          file_size_bytes: number | null
          checksum: string | null
          image_count: number
          status: ArchiveStatus
          error_message: string | null
          email_sent: boolean
          email_sent_at: string | null
          email_recipient: string | null
          created_at: string
          completed_at: string | null
          expires_at: string | null
        }
        Insert: {
          id?: string
          gallery_id: string
          version?: number
          images_hash: string
          storage_path: string
          file_size_bytes?: number | null
          checksum?: string | null
          image_count?: number
          status?: ArchiveStatus
          error_message?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          email_recipient?: string | null
          created_at?: string
          completed_at?: string | null
          expires_at?: string | null
        }
        Update: {
          id?: string
          gallery_id?: string
          version?: number
          images_hash?: string
          storage_path?: string
          file_size_bytes?: number | null
          checksum?: string | null
          image_count?: number
          status?: ArchiveStatus
          error_message?: string | null
          email_sent?: boolean
          email_sent_at?: string | null
          email_recipient?: string | null
          created_at?: string
          completed_at?: string | null
          expires_at?: string | null
        }
      }
      gallery_clients: {
        Row: {
          id: string
          gallery_id: string
          email: string
          name: string | null
          notify_on_archive: boolean
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          email: string
          name?: string | null
          notify_on_archive?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          email?: string
          name?: string | null
          notify_on_archive?: boolean
          created_at?: string
        }
      }
      archive_jobs: {
        Row: {
          id: string
          gallery_id: string
          archive_id: string | null
          status: JobStatus
          priority: number
          attempts: number
          max_attempts: number
          last_error: string | null
          run_at: string
          started_at: string | null
          completed_at: string | null
          locked_by: string | null
          locked_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          archive_id?: string | null
          status?: JobStatus
          priority?: number
          attempts?: number
          max_attempts?: number
          last_error?: string | null
          run_at?: string
          started_at?: string | null
          completed_at?: string | null
          locked_by?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          archive_id?: string | null
          status?: JobStatus
          priority?: number
          attempts?: number
          max_attempts?: number
          last_error?: string | null
          run_at?: string
          started_at?: string | null
          completed_at?: string | null
          locked_by?: string | null
          locked_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          plan: 'free' | 'basic' | 'pro' | 'studio'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          plan?: 'free' | 'basic' | 'pro' | 'studio'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          plan?: 'free' | 'basic' | 'pro' | 'studio'
          created_at?: string
          updated_at?: string
        }
      }
      user_settings: {
        Row: {
          id: string
          user_id: string
          default_password_enabled: boolean
          default_download_enabled: boolean
          // Business branding
          business_name: string | null
          logo_url: string | null
          brand_color: string
          contact_email: string | null
          website_url: string | null
          // Notification preferences
          notify_gallery_viewed: boolean
          notify_images_downloaded: boolean
          notify_archive_ready: boolean
          email_digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
          // Gallery defaults
          default_gallery_expiry_days: number | null
          default_watermark_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_password_enabled?: boolean
          default_download_enabled?: boolean
          business_name?: string | null
          logo_url?: string | null
          brand_color?: string
          contact_email?: string | null
          website_url?: string | null
          notify_gallery_viewed?: boolean
          notify_images_downloaded?: boolean
          notify_archive_ready?: boolean
          email_digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
          default_gallery_expiry_days?: number | null
          default_watermark_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_password_enabled?: boolean
          default_download_enabled?: boolean
          business_name?: string | null
          logo_url?: string | null
          brand_color?: string
          contact_email?: string | null
          website_url?: string | null
          notify_gallery_viewed?: boolean
          notify_images_downloaded?: boolean
          notify_archive_ready?: boolean
          email_digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
          default_gallery_expiry_days?: number | null
          default_watermark_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      galleries: {
        Row: {
          id: string
          user_id: string
          title: string
          slug: string
          password_hash: string | null
          download_enabled: boolean
          cover_image_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          password_hash?: string | null
          download_enabled?: boolean
          cover_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          password_hash?: string | null
          download_enabled?: boolean
          cover_image_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      images: {
        Row: {
          id: string
          gallery_id: string
          storage_path: string
          original_filename: string
          file_size_bytes: number
          mime_type: string
          width: number | null
          height: number | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          storage_path: string
          original_filename: string
          file_size_bytes: number
          mime_type: string
          width?: number | null
          height?: number | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          storage_path?: string
          original_filename?: string
          file_size_bytes?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          position?: number
          created_at?: string
        }
      }
    }
    Functions: {
      insert_image_at_position: {
        Args: {
          p_gallery_id: string
          p_storage_path: string
          p_original_filename: string
          p_file_size_bytes: number
          p_mime_type: string
          p_width?: number
          p_height?: number
        }
        Returns: string
      }
      get_user_id_from_clerk: {
        Args: {
          p_clerk_id: string
        }
        Returns: string
      }
      compute_gallery_images_hash: {
        Args: {
          p_gallery_id: string
        }
        Returns: string
      }
      get_latest_gallery_archive: {
        Args: {
          p_gallery_id: string
        }
        Returns: {
          id: string
          storage_path: string
          file_size_bytes: number
          image_count: number
          created_at: string
          is_current: boolean
        }[]
      }
      acquire_archive_job: {
        Args: {
          p_worker_id: string
        }
        Returns: {
          job_id: string
          gallery_id: string
          archive_id: string
        }[]
      }
    }
    Views: {
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

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
