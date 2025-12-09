-- ============================================
-- Migration 057: Fix gallery_vendor_shares table
-- Adds missing columns that weren't created
-- ============================================

-- Add missing columns to gallery_vendor_shares
ALTER TABLE public.gallery_vendor_shares 
ADD COLUMN IF NOT EXISTS custom_terms TEXT,
ADD COLUMN IF NOT EXISTS terms_template_id UUID REFERENCES public.vendor_terms_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS share_type TEXT NOT NULL DEFAULT 'entire' CHECK (share_type IN ('entire', 'selected')),
ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_revoked BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;

-- Create gallery_vendor_images table if not exists
CREATE TABLE IF NOT EXISTS public.gallery_vendor_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    share_id UUID NOT NULL REFERENCES public.gallery_vendor_shares(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(share_id, image_id)
);

-- Create vendor_terms_templates table if not exists
CREATE TABLE IF NOT EXISTS public.vendor_terms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
