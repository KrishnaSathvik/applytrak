-- Update Cover Letter Achievement Requirement
-- This script updates the cover_letter_pro achievement from 5 to 10 applications

-- Update the cover letter achievement
UPDATE achievements 
SET 
    description = 'Upload cover letter attachments to 10 applications',
    requirements = '[{"type": "quality", "value": 10, "description": "Upload cover letter attachments to 10 applications"}]',
    updated_at = NOW()
WHERE id = 'cover_letter_pro';

-- Verify the update
SELECT id, name, description, requirements 
FROM achievements 
WHERE id = 'cover_letter_pro';
