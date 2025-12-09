-- ============================================================================
-- ADD EVENT TIME TO CLIENT PROFILES
-- Migration: 052-event-time.sql
-- Purpose: Add arrival/start time field for events
-- ============================================================================

-- Add event_time column to client_profiles
-- Format: HH:MM (24-hour format, e.g., "14:30" for 2:30 PM)
ALTER TABLE client_profiles
ADD COLUMN IF NOT EXISTS event_time TEXT;

-- Add comment for documentation
COMMENT ON COLUMN client_profiles.event_time IS 'Arrival/start time in HH:MM format (24-hour)';

-- Optional: Add check constraint for valid time format
-- This ensures only valid HH:MM values are stored
ALTER TABLE client_profiles
ADD CONSTRAINT valid_event_time_format 
CHECK (event_time IS NULL OR event_time ~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$');
