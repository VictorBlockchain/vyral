-- Add thumbnailUrl column to Challenge table
-- Run this in Supabase SQL Editor

ALTER TABLE "Challenge" 
ADD COLUMN IF NOT EXISTS "thumbnailUrl" TEXT;

-- Create Supabase storage bucket for images
-- Note: This needs to be done via the Supabase Dashboard or API
-- Go to: https://app.supabase.com/project/slhmpicloeaqfkgujwsy/storage/buckets
-- Click "New bucket" and create a bucket named "images"
-- Make it public so images can be accessed
