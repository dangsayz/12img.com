export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ArchiveStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed'
export type DerivativeSizeCode = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type ProfileVisibilityMode = 'PRIVATE' | 'PUBLIC' | 'PUBLIC_LOCKED'
export type SubscriptionStatus = 'active' | 'past_due' | 'grace_period' | 'canceled' | 'paused'
export type GalleryArchivedReason = 'downgrade' | 'payment_failed' | 'manual' | 'expired'

// Client Portal Types
export type EventType = 'wedding' | 'engagement' | 'portrait' | 'family' | 'newborn' | 'maternity' | 'corporate' | 'event' | 'other'
export type ContractStatus = 'draft' | 'sent' | 'viewed' | 'signed' | 'archived'
export type ClauseCategory = 'payment' | 'cancellation' | 'liability' | 'copyright' | 'usage_rights' | 'delivery' | 'scheduling' | 'meals_breaks' | 'travel' | 'equipment' | 'force_majeure' | 'dispute_resolution' | 'custom'
export type MessageStatus = 'sent' | 'delivered' | 'read'
export type MessageType = 'text' | 'image' | 'file' | 'system'

// Vault Types
export type VaultSubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'expired'
export type VaultBillingPeriod = 'monthly' | 'annual'
export type VaultInvitationStatus = 'pending' | 'sent' | 'clicked' | 'purchased' | 'expired'

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
          // Profile visibility fields
          visibility_mode: ProfileVisibilityMode
          profile_slug: string | null
          profile_pin_hash: string | null
          display_name: string | null
          bio: string | null
          avatar_url: string | null
          cover_image_url: string | null
          // Subscription status tracking
          subscription_status: SubscriptionStatus
          payment_failed_at: string | null
          payment_failure_count: number
          grace_period_ends_at: string | null
          downgraded_at: string | null
          previous_plan: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          clerk_id: string
          email: string
          plan?: 'free' | 'basic' | 'pro' | 'studio'
          visibility_mode?: ProfileVisibilityMode
          profile_slug?: string | null
          profile_pin_hash?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_image_url?: string | null
          subscription_status?: SubscriptionStatus
          payment_failed_at?: string | null
          payment_failure_count?: number
          grace_period_ends_at?: string | null
          downgraded_at?: string | null
          previous_plan?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          clerk_id?: string
          email?: string
          plan?: 'free' | 'basic' | 'pro' | 'studio'
          visibility_mode?: ProfileVisibilityMode
          profile_slug?: string | null
          profile_pin_hash?: string | null
          display_name?: string | null
          bio?: string | null
          avatar_url?: string | null
          cover_image_url?: string | null
          subscription_status?: SubscriptionStatus
          payment_failed_at?: string | null
          payment_failure_count?: number
          grace_period_ends_at?: string | null
          downgraded_at?: string | null
          previous_plan?: string | null
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
          phone: string | null
          business_location: string | null
          // Notification preferences
          notify_gallery_viewed: boolean
          notify_images_downloaded: boolean
          notify_archive_ready: boolean
          email_digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
          // Gallery defaults
          default_gallery_expiry_days: number | null
          default_watermark_enabled: boolean
          // Onboarding
          onboarding_completed: boolean
          welcome_seen: boolean
          photography_type: string | null
          country: string | null
          state: string | null
          referral_code: string | null
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
          phone?: string | null
          business_location?: string | null
          notify_gallery_viewed?: boolean
          notify_images_downloaded?: boolean
          notify_archive_ready?: boolean
          email_digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
          default_gallery_expiry_days?: number | null
          default_watermark_enabled?: boolean
          onboarding_completed?: boolean
          welcome_seen?: boolean
          photography_type?: string | null
          country?: string | null
          state?: string | null
          referral_code?: string | null
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
          phone?: string | null
          business_location?: string | null
          notify_gallery_viewed?: boolean
          notify_images_downloaded?: boolean
          notify_archive_ready?: boolean
          email_digest_frequency?: 'immediate' | 'daily' | 'weekly' | 'never'
          default_gallery_expiry_days?: number | null
          default_watermark_enabled?: boolean
          onboarding_completed?: boolean
          welcome_seen?: boolean
          photography_type?: string | null
          country?: string | null
          state?: string | null
          referral_code?: string | null
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
          password_plain: string | null
          download_enabled: boolean
          cover_image_id: string | null
          template: string
          // Gallery locking fields
          is_locked: boolean
          lock_pin_hash: string | null
          // Visibility
          is_public: boolean
          // Archiving (for downgraded users)
          archived_at: string | null
          archived_reason: GalleryArchivedReason | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          slug: string
          password_hash?: string | null
          password_plain?: string | null
          download_enabled?: boolean
          cover_image_id?: string | null
          is_locked?: boolean
          lock_pin_hash?: string | null
          is_public?: boolean
          template?: string
          archived_at?: string | null
          archived_reason?: GalleryArchivedReason | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          slug?: string
          password_hash?: string | null
          password_plain?: string | null
          download_enabled?: boolean
          cover_image_id?: string | null
          template?: string
          is_locked?: boolean
          lock_pin_hash?: string | null
          is_public?: boolean
          archived_at?: string | null
          archived_reason?: GalleryArchivedReason | null
          created_at?: string
          updated_at?: string
        }
      }
      gallery_unlock_tokens: {
        Row: {
          id: string
          gallery_id: string
          token_hash: string
          client_ip: string | null
          user_agent: string | null
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          token_hash: string
          client_ip?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          token_hash?: string
          client_ip?: string | null
          user_agent?: string | null
          created_at?: string
          expires_at?: string
        }
      }
      name_change_history: {
        Row: {
          id: string
          user_id: string
          old_name: string | null
          new_name: string
          old_slug: string | null
          new_slug: string | null
          changed_at: string
          year: number
        }
        Insert: {
          id?: string
          user_id: string
          old_name?: string | null
          new_name: string
          old_slug?: string | null
          new_slug?: string | null
          changed_at?: string
          year?: number
        }
        Update: {
          id?: string
          user_id?: string
          old_name?: string | null
          new_name?: string
          old_slug?: string | null
          new_slug?: string | null
          changed_at?: string
          year?: number
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
          processing_status: ProcessingStatus
          processing_version: number
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
          processing_status?: ProcessingStatus
          processing_version?: number
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
          processing_status?: ProcessingStatus
          processing_version?: number
          created_at?: string
        }
      }
      photo_derivatives: {
        Row: {
          id: string
          photo_id: string
          size_code: DerivativeSizeCode
          storage_path: string
          width: number
          height: number | null
          byte_size: number | null
          is_watermarked: boolean
          status: ProcessingStatus
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          photo_id: string
          size_code: DerivativeSizeCode
          storage_path: string
          width: number
          height?: number | null
          byte_size?: number | null
          is_watermarked?: boolean
          status?: ProcessingStatus
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          photo_id?: string
          size_code?: DerivativeSizeCode
          storage_path?: string
          width?: number
          height?: number | null
          byte_size?: number | null
          is_watermarked?: boolean
          status?: ProcessingStatus
          error_message?: string | null
          created_at?: string
        }
      }
      // ============================================
      // CLIENT PORTAL TABLES
      // ============================================
      client_profiles: {
        Row: {
          id: string
          photographer_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          partner_first_name: string | null
          partner_last_name: string | null
          partner_email: string | null
          partner_phone: string | null
          event_type: EventType
          event_date: string | null
          event_location: string | null
          event_venue: string | null
          package_name: string | null
          package_price: number | null
          package_hours: number | null
          package_description: string | null
          notes: string | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          partner_first_name?: string | null
          partner_last_name?: string | null
          partner_email?: string | null
          partner_phone?: string | null
          event_type?: EventType
          event_date?: string | null
          event_location?: string | null
          event_venue?: string | null
          package_name?: string | null
          package_price?: number | null
          package_hours?: number | null
          package_description?: string | null
          notes?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          partner_first_name?: string | null
          partner_last_name?: string | null
          partner_email?: string | null
          partner_phone?: string | null
          event_type?: EventType
          event_date?: string | null
          event_location?: string | null
          event_venue?: string | null
          package_name?: string | null
          package_price?: number | null
          package_hours?: number | null
          package_description?: string | null
          notes?: string | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contract_templates: {
        Row: {
          id: string
          photographer_id: string
          name: string
          description: string | null
          header_content: string
          footer_content: string
          is_default: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          name: string
          description?: string | null
          header_content?: string
          footer_content?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          name?: string
          description?: string | null
          header_content?: string
          footer_content?: string
          is_default?: boolean
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      contract_clauses: {
        Row: {
          id: string
          photographer_id: string | null
          title: string
          category: ClauseCategory
          content: string
          is_required: boolean
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id?: string | null
          title: string
          category?: ClauseCategory
          content: string
          is_required?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string | null
          title?: string
          category?: ClauseCategory
          content?: string
          is_required?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      contracts: {
        Row: {
          id: string
          photographer_id: string
          client_id: string
          template_id: string | null
          status: ContractStatus
          rendered_html: string | null
          rendered_text: string | null
          merge_data: Json
          clauses_snapshot: Json
          sent_at: string | null
          viewed_at: string | null
          signed_at: string | null
          archived_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          photographer_id: string
          client_id: string
          template_id?: string | null
          status?: ContractStatus
          rendered_html?: string | null
          rendered_text?: string | null
          merge_data?: Json
          clauses_snapshot?: Json
          sent_at?: string | null
          viewed_at?: string | null
          signed_at?: string | null
          archived_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          photographer_id?: string
          client_id?: string
          template_id?: string | null
          status?: ContractStatus
          rendered_html?: string | null
          rendered_text?: string | null
          merge_data?: Json
          clauses_snapshot?: Json
          sent_at?: string | null
          viewed_at?: string | null
          signed_at?: string | null
          archived_at?: string | null
          expires_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      contract_signatures: {
        Row: {
          id: string
          contract_id: string
          signer_name: string
          signer_email: string
          signer_ip: string | null
          signer_user_agent: string | null
          signature_data: string
          signature_hash: string
          signed_at: string
          agreed_to_terms: boolean
        }
        Insert: {
          id?: string
          contract_id: string
          signer_name: string
          signer_email: string
          signer_ip?: string | null
          signer_user_agent?: string | null
          signature_data: string
          signature_hash: string
          signed_at?: string
          agreed_to_terms?: boolean
        }
        Update: never // Signatures are immutable
      }
      messages: {
        Row: {
          id: string
          client_id: string
          photographer_id: string
          is_from_photographer: boolean
          message_type: MessageType
          content: string
          status: MessageStatus
          created_at: string
          delivered_at: string | null
          read_at: string | null
          deleted_at: string | null
          deleted_by_photographer: boolean
          deleted_by_client: boolean
        }
        Insert: {
          id?: string
          client_id: string
          photographer_id: string
          is_from_photographer: boolean
          message_type?: MessageType
          content: string
          status?: MessageStatus
          created_at?: string
          delivered_at?: string | null
          read_at?: string | null
          deleted_at?: string | null
          deleted_by_photographer?: boolean
          deleted_by_client?: boolean
        }
        Update: {
          id?: string
          client_id?: string
          photographer_id?: string
          is_from_photographer?: boolean
          message_type?: MessageType
          content?: string
          status?: MessageStatus
          created_at?: string
          delivered_at?: string | null
          read_at?: string | null
          deleted_at?: string | null
          deleted_by_photographer?: boolean
          deleted_by_client?: boolean
        }
      }
      message_attachments: {
        Row: {
          id: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          width: number | null
          height: number | null
          thumbnail_path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          message_id: string
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          width?: number | null
          height?: number | null
          thumbnail_path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          message_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          storage_path?: string
          width?: number | null
          height?: number | null
          thumbnail_path?: string | null
          created_at?: string
        }
      }
      portal_tokens: {
        Row: {
          id: string
          client_id: string
          photographer_id: string
          token: string
          token_hash: string
          can_view_contract: boolean
          can_sign_contract: boolean
          can_message: boolean
          can_view_gallery: boolean
          can_download: boolean
          expires_at: string
          is_revoked: boolean
          revoked_at: string | null
          revoked_reason: string | null
          last_used_at: string | null
          use_count: number
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          photographer_id: string
          token: string
          token_hash: string
          can_view_contract?: boolean
          can_sign_contract?: boolean
          can_message?: boolean
          can_view_gallery?: boolean
          can_download?: boolean
          expires_at: string
          is_revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          last_used_at?: string | null
          use_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          photographer_id?: string
          token?: string
          token_hash?: string
          can_view_contract?: boolean
          can_sign_contract?: boolean
          can_message?: boolean
          can_view_gallery?: boolean
          can_download?: boolean
          expires_at?: string
          is_revoked?: boolean
          revoked_at?: string | null
          revoked_reason?: string | null
          last_used_at?: string | null
          use_count?: number
          created_at?: string
        }
      }
      // ============================================
      // CLIENT VAULT TABLES
      // ============================================
      vault_plans: {
        Row: {
          id: string
          name: string
          storage_gb: number
          monthly_price_cents: number
          annual_price_cents: number
          stripe_monthly_price_id: string | null
          stripe_annual_price_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          storage_gb: number
          monthly_price_cents: number
          annual_price_cents: number
          stripe_monthly_price_id?: string | null
          stripe_annual_price_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          storage_gb?: number
          monthly_price_cents?: number
          annual_price_cents?: number
          stripe_monthly_price_id?: string | null
          stripe_annual_price_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      client_vaults: {
        Row: {
          id: string
          client_email: string
          client_name: string | null
          photographer_id: string
          original_gallery_id: string | null
          vault_plan_id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: VaultSubscriptionStatus
          billing_period: VaultBillingPeriod
          storage_used_bytes: number
          storage_limit_bytes: number
          image_count: number
          starts_at: string
          expires_at: string | null
          canceled_at: string | null
          access_token_hash: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          client_email: string
          client_name?: string | null
          photographer_id: string
          original_gallery_id?: string | null
          vault_plan_id: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: VaultSubscriptionStatus
          billing_period?: VaultBillingPeriod
          storage_used_bytes?: number
          storage_limit_bytes: number
          image_count?: number
          starts_at?: string
          expires_at?: string | null
          canceled_at?: string | null
          access_token_hash?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          client_email?: string
          client_name?: string | null
          photographer_id?: string
          original_gallery_id?: string | null
          vault_plan_id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: VaultSubscriptionStatus
          billing_period?: VaultBillingPeriod
          storage_used_bytes?: number
          storage_limit_bytes?: number
          image_count?: number
          starts_at?: string
          expires_at?: string | null
          canceled_at?: string | null
          access_token_hash?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vault_images: {
        Row: {
          id: string
          vault_id: string
          storage_path: string
          original_filename: string
          file_size_bytes: number
          mime_type: string
          width: number | null
          height: number | null
          original_image_id: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          vault_id: string
          storage_path: string
          original_filename: string
          file_size_bytes: number
          mime_type: string
          width?: number | null
          height?: number | null
          original_image_id?: string | null
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          vault_id?: string
          storage_path?: string
          original_filename?: string
          file_size_bytes?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          original_image_id?: string | null
          position?: number
          created_at?: string
        }
      }
      vault_access_tokens: {
        Row: {
          id: string
          vault_id: string
          token_hash: string
          last_used_at: string | null
          use_count: number
          expires_at: string
          is_revoked: boolean
          created_at: string
        }
        Insert: {
          id?: string
          vault_id: string
          token_hash: string
          last_used_at?: string | null
          use_count?: number
          expires_at: string
          is_revoked?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          vault_id?: string
          token_hash?: string
          last_used_at?: string | null
          use_count?: number
          expires_at?: string
          is_revoked?: boolean
          created_at?: string
        }
      }
      vault_invitations: {
        Row: {
          id: string
          gallery_id: string
          photographer_id: string
          client_email: string
          client_name: string | null
          status: VaultInvitationStatus
          sent_at: string | null
          clicked_at: string | null
          purchased_at: string | null
          vault_id: string | null
          token_hash: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          gallery_id: string
          photographer_id: string
          client_email: string
          client_name?: string | null
          status?: VaultInvitationStatus
          sent_at?: string | null
          clicked_at?: string | null
          purchased_at?: string | null
          vault_id?: string | null
          token_hash: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          gallery_id?: string
          photographer_id?: string
          client_email?: string
          client_name?: string | null
          status?: VaultInvitationStatus
          sent_at?: string | null
          clicked_at?: string | null
          purchased_at?: string | null
          vault_id?: string | null
          token_hash?: string
          expires_at?: string
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
