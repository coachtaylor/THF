-- Migration: Populate media_thumb from staging_exercisedb table
-- Date: 2024-12-04
-- Run each query separately in Supabase SQL Editor

-- ============================================
-- STEP 1: Run this UPDATE first (match by name)
-- ============================================
UPDATE public.exercises e
SET media_thumb = s.media_thumb
FROM staging_exercisedb s
WHERE LOWER(e.name) = LOWER(s.name)
  AND s.media_thumb IS NOT NULL
  AND s.media_thumb != ''
  AND (e.media_thumb IS NULL OR e.media_thumb = '');

-- ============================================
-- STEP 2: Run this UPDATE second (match by slug transformation)
-- ============================================
UPDATE public.exercises e
SET media_thumb = s.media_thumb
FROM staging_exercisedb s
WHERE LOWER(REPLACE(REPLACE(e.name, ' ', '-'), '''', '')) = LOWER(s.slug)
  AND s.media_thumb IS NOT NULL
  AND s.media_thumb != ''
  AND (e.media_thumb IS NULL OR e.media_thumb = '');

-- ============================================
-- STEP 3: Run this SELECT to verify results
-- ============================================
SELECT
  COUNT(*) FILTER (WHERE media_thumb IS NOT NULL AND media_thumb != '') as with_thumbnails,
  COUNT(*) as total
FROM public.exercises;
