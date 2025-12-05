export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          clerk_id: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          default_password_enabled?: boolean
          default_download_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          default_password_enabled?: boolean
          default_download_enabled?: boolean
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
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
