# 3. Database Schema (Supabase SQL)

## 3.1 Complete Schema SQL

```sql
-- ============================================
-- 12img Database Schema
-- Supabase PostgreSQL
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- No custom enums required for MVP

-- ============================================
-- TABLES
-- ============================================

-- --------------------------------------------
-- users
-- Extension of Clerk user data
-- --------------------------------------------
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clerk_id TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_clerk_id ON public.users(clerk_id);
CREATE INDEX idx_users_email ON public.users(email);

-- --------------------------------------------
-- user_settings
-- User preferences and defaults
-- --------------------------------------------
CREATE TABLE public.user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    default_password_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    default_download_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_user_settings_user_id ON public.user_settings(user_id);

-- --------------------------------------------
-- galleries
-- Gallery metadata
-- --------------------------------------------
CREATE TABLE public.galleries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    password_hash TEXT,  -- NULL = no password protection
    download_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    cover_image_id UUID,  -- Set after images exist
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT galleries_title_length CHECK (char_length(title) >= 1 AND char_length(title) <= 100),
    CONSTRAINT galleries_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT galleries_slug_length CHECK (char_length(slug) >= 3 AND char_length(slug) <= 50)
);

-- Indexes
CREATE UNIQUE INDEX idx_galleries_slug ON public.galleries(slug);
CREATE INDEX idx_galleries_user_id ON public.galleries(user_id);
CREATE INDEX idx_galleries_created_at ON public.galleries(created_at DESC);

-- --------------------------------------------
-- images
-- Image metadata (not the files themselves)
-- --------------------------------------------
CREATE TABLE public.images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gallery_id UUID NOT NULL REFERENCES public.galleries(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,  -- Path in Supabase Storage
    original_filename TEXT NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER,  -- Optional, extracted client-side
    height INTEGER, -- Optional, extracted client-side
    position INTEGER NOT NULL DEFAULT 0,  -- For ordering
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT images_storage_path_format CHECK (storage_path ~ '^[a-zA-Z0-9/_-]+\.[a-zA-Z]+$'),
    CONSTRAINT images_file_size CHECK (file_size_bytes > 0 AND file_size_bytes <= 26214400), -- 25MB max
    CONSTRAINT images_mime_type CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/gif'))
);

-- Indexes
CREATE UNIQUE INDEX idx_images_storage_path ON public.images(storage_path);
CREATE INDEX idx_images_gallery_id ON public.images(gallery_id);
CREATE INDEX idx_images_gallery_position ON public.images(gallery_id, position);

-- --------------------------------------------
-- Add foreign key for cover_image_id after images table exists
-- --------------------------------------------
ALTER TABLE public.galleries
    ADD CONSTRAINT fk_galleries_cover_image
    FOREIGN KEY (cover_image_id) REFERENCES public.images(id) ON DELETE SET NULL;

-- ============================================
-- FUNCTIONS
-- ============================================

-- --------------------------------------------
-- update_updated_at_column()
-- Trigger function to auto-update updated_at
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- insert_image_at_position()
-- Insert image with proper position handling
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.insert_image_at_position(
    p_gallery_id UUID,
    p_storage_path TEXT,
    p_original_filename TEXT,
    p_file_size_bytes BIGINT,
    p_mime_type TEXT,
    p_width INTEGER DEFAULT NULL,
    p_height INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_next_position INTEGER;
    v_image_id UUID;
BEGIN
    -- Get next position
    SELECT COALESCE(MAX(position), -1) + 1 INTO v_next_position
    FROM public.images
    WHERE gallery_id = p_gallery_id;
    
    -- Insert image
    INSERT INTO public.images (
        gallery_id,
        storage_path,
        original_filename,
        file_size_bytes,
        mime_type,
        width,
        height,
        position
    ) VALUES (
        p_gallery_id,
        p_storage_path,
        p_original_filename,
        p_file_size_bytes,
        p_mime_type,
        p_width,
        p_height,
        v_next_position
    )
    RETURNING id INTO v_image_id;
    
    RETURN v_image_id;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- get_user_id_from_clerk()
-- Helper to get internal user_id from clerk_id
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_id_from_clerk(p_clerk_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE clerk_id = p_clerk_id;
    
    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for users
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for user_settings
CREATE TRIGGER trigger_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-update updated_at for galleries
CREATE TRIGGER trigger_galleries_updated_at
    BEFORE UPDATE ON public.galleries
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- INITIAL DATA
-- ============================================

-- No initial data required for MVP
```

## 3.2 Row Level Security (RLS) Policies

```sql
-- ============================================
-- 12img RLS Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.galleries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Users can read their own record
CREATE POLICY "users_select_own"
    ON public.users
    FOR SELECT
    USING (clerk_id = auth.jwt() ->> 'sub');

-- Users can update their own record
CREATE POLICY "users_update_own"
    ON public.users
    FOR UPDATE
    USING (clerk_id = auth.jwt() ->> 'sub')
    WITH CHECK (clerk_id = auth.jwt() ->> 'sub');

-- Service role can insert (for webhook)
CREATE POLICY "users_insert_service"
    ON public.users
    FOR INSERT
    WITH CHECK (true);  -- Controlled by service role key

-- Service role can delete (for webhook)
CREATE POLICY "users_delete_service"
    ON public.users
    FOR DELETE
    USING (true);  -- Controlled by service role key

-- ============================================
-- USER_SETTINGS TABLE POLICIES
-- ============================================

-- Users can read their own settings
CREATE POLICY "user_settings_select_own"
    ON public.user_settings
    FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Users can update their own settings
CREATE POLICY "user_settings_update_own"
    ON public.user_settings
    FOR UPDATE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Users can insert their own settings
CREATE POLICY "user_settings_insert_own"
    ON public.user_settings
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- GALLERIES TABLE POLICIES
-- ============================================

-- Gallery owners can read their galleries
CREATE POLICY "galleries_select_own"
    ON public.galleries
    FOR SELECT
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Public can read galleries by slug (for public view)
-- Note: This allows reading gallery metadata, password check happens in app
CREATE POLICY "galleries_select_public"
    ON public.galleries
    FOR SELECT
    USING (true);  -- All galleries readable, password enforced at app layer

-- Gallery owners can insert
CREATE POLICY "galleries_insert_own"
    ON public.galleries
    FOR INSERT
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can update their galleries
CREATE POLICY "galleries_update_own"
    ON public.galleries
    FOR UPDATE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can delete their galleries
CREATE POLICY "galleries_delete_own"
    ON public.galleries
    FOR DELETE
    USING (
        user_id = (
            SELECT id FROM public.users 
            WHERE clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- ============================================
-- IMAGES TABLE POLICIES
-- ============================================

-- Gallery owners can read their images
CREATE POLICY "images_select_own"
    ON public.images
    FOR SELECT
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Public can read images (for public gallery view)
-- Note: Actual file access controlled by storage policies
CREATE POLICY "images_select_public"
    ON public.images
    FOR SELECT
    USING (true);  -- Metadata readable, file access via signed URLs

-- Gallery owners can insert images
CREATE POLICY "images_insert_own"
    ON public.images
    FOR INSERT
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can update their images
CREATE POLICY "images_update_own"
    ON public.images
    FOR UPDATE
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    )
    WITH CHECK (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can delete their images
CREATE POLICY "images_delete_own"
    ON public.images
    FOR DELETE
    USING (
        gallery_id IN (
            SELECT g.id FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );
```

## 3.3 Storage Bucket Policies

```sql
-- ============================================
-- 12img Storage Policies
-- Bucket: gallery-images
-- ============================================

-- Create the bucket (run in Supabase Dashboard or via API)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('gallery-images', 'gallery-images', false);

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Gallery owners can upload to their gallery folder
CREATE POLICY "storage_insert_own"
    ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can read their images
CREATE POLICY "storage_select_own"
    ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- Gallery owners can delete their images
CREATE POLICY "storage_delete_own"
    ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'gallery-images'
        AND (storage.foldername(name))[1] IN (
            SELECT g.id::text FROM public.galleries g
            JOIN public.users u ON g.user_id = u.id
            WHERE u.clerk_id = auth.jwt() ->> 'sub'
        )
    );

-- No public read policy - all access via signed URLs
-- This ensures password-protected galleries stay protected
```

## 3.4 Database Types (TypeScript)

```typescript
// types/database.ts
// Auto-generated types for Supabase tables

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
```
