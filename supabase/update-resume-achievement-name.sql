-- Update Resume Achievement Name
-- This script updates the resume_optimizer achievement name from "Resume Optimizer" to "Resume Pro"

-- Update the resume achievement name
UPDATE achievements 
SET 
    name = 'Resume Pro',
    updated_at = NOW()
WHERE id = 'resume_optimizer';

-- Verify the update
SELECT id, name, description, requirements 
FROM achievements 
WHERE id = 'resume_optimizer';
