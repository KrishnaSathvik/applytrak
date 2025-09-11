-- Fix RLS policies for storage.objects to work with internal user IDs
-- This migration fixes the "new row violates row-level security policy" error for file uploads

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own attachments" ON storage.objects;

-- Create new storage policies that work with internal user IDs
-- The policy checks that the folder name (internal user ID) belongs to the authenticated user
CREATE POLICY "Users can upload their own attachments" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'attachments' AND 
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = (storage.foldername(name))[1] 
            AND externalid::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can view their own attachments" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'attachments' AND 
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = (storage.foldername(name))[1] 
            AND externalid::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update their own attachments" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'attachments' AND 
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = (storage.foldername(name))[1] 
            AND externalid::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can delete their own attachments" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'attachments' AND 
        auth.uid() IS NOT NULL AND
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id::text = (storage.foldername(name))[1] 
            AND externalid::text = auth.uid()::text
        )
    );

-- Also update the listUserAttachments function to use internal user ID
-- This function should also be reverted to use internal user ID for consistency
