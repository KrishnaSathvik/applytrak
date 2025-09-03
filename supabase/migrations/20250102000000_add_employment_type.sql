-- ============================================================================
-- MIGRATION: Add employmentType field and update job type system
-- ============================================================================
-- This migration adds the employmentType field and updates the job type system
-- to distinguish between work arrangement (Remote/Onsite/Hybrid) and 
-- employment status (Full-time/Part-time/Contract/Internship)

-- ============================================================================
-- 1. ADD EMPLOYMENT TYPE COLUMN
-- ============================================================================

-- Check if employmentType column already exists
DO $$
BEGIN
    -- Add the employmentType column with default value if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'applications' 
        AND column_name = 'employmentType'
    ) THEN
        ALTER TABLE applications 
        ADD COLUMN "employmentType" text DEFAULT 'Full-time';
        
        RAISE NOTICE 'Added employmentType column';
    ELSE
        RAISE NOTICE 'employmentType column already exists';
    END IF;
END $$;

-- Add CHECK constraint for employmentType (drop first if exists)
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_employment_type_check;

ALTER TABLE applications 
ADD CONSTRAINT applications_employment_type_check 
CHECK ("employmentType" IN ('Full-time', 'Contract', 'Part-time', 'Internship'));

-- ============================================================================
-- 2. UPDATE EXISTING DATA
-- ============================================================================

-- Update existing applications to set employmentType based on current type
-- This assumes the current 'type' field contains employment status values
-- Only update if employmentType is still the default value
UPDATE applications 
SET "employmentType" = "type" 
WHERE "employmentType" = 'Full-time' 
AND "type" IN ('Full-time', 'Contract', 'Part-time', 'Internship');

-- Set default job type to 'Remote' for all existing applications
-- since we're changing the meaning of the 'type' field
-- Only update if type still has old values
UPDATE applications 
SET "type" = 'Remote' 
WHERE "type" IN ('Full-time', 'Contract', 'Part-time', 'Internship');

-- ============================================================================
-- 3. UPDATE TYPE COLUMN CONSTRAINT
-- ============================================================================

-- Drop the old CHECK constraint
ALTER TABLE applications 
DROP CONSTRAINT IF EXISTS applications_type_check;

-- Add new CHECK constraint for job type (work arrangement)
ALTER TABLE applications 
ADD CONSTRAINT applications_type_check 
CHECK ("type" IN ('Remote', 'Onsite', 'Hybrid'));

-- ============================================================================
-- 4. UPDATE INDEXES (if any exist)
-- ============================================================================

-- Note: If there are any indexes on the type column, they should still work
-- since we're just changing the constraint, not the column structure

-- ============================================================================
-- 5. VERIFY MIGRATION
-- ============================================================================

-- Check that all applications now have valid employmentType values
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM applications 
        WHERE "employmentType" NOT IN ('Full-time', 'Contract', 'Part-time', 'Internship')
        OR "employmentType" IS NULL
    ) THEN
        RAISE EXCEPTION 'Migration failed: Some applications have invalid employmentType values';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM applications 
        WHERE "type" NOT IN ('Remote', 'Onsite', 'Hybrid')
    ) THEN
        RAISE EXCEPTION 'Migration failed: Some applications have invalid type values';
    END IF;
    
    RAISE NOTICE 'Migration completed successfully: All applications have valid type and employmentType values';
END $$;
