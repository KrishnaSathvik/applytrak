# Database Migration: Add Employment Type Field

## Overview
This migration adds the `employmentType` field to the applications table and updates the job type system to distinguish between:
- **Job Type** (Work Arrangement): Remote, Onsite, Hybrid
- **Employment Type** (Employment Status): Full-time, Part-time, Contract, Internship

## Migration Steps

### 1. Run the Migration
Execute the migration file in your Supabase SQL Editor:
```sql
-- Run: supabase/migrations/20250102000000_add_employment_type.sql
```

### 2. Verify Migration
After running the migration, verify that:
- All existing applications have `employmentType` set to their previous `type` value
- All applications have `type` set to 'Remote' (default)
- No data was lost during the migration

### 3. Update Application Data (Optional)
You may want to manually update some applications to have more accurate job types:
```sql
-- Example: Update some applications to have different job types
UPDATE applications 
SET type = 'Onsite' 
WHERE location LIKE '%office%' OR location LIKE '%headquarters%';

UPDATE applications 
SET type = 'Hybrid' 
WHERE notes LIKE '%hybrid%' OR notes LIKE '%flexible%';
```

## What the Migration Does

1. **Adds `employmentType` column** with default value 'Full-time'
2. **Migrates existing data** by copying the old `type` values to `employmentType`
3. **Updates all applications** to have `type = 'Remote'` (since we're changing the meaning)
4. **Updates constraints** to enforce the new job type system
5. **Validates the migration** to ensure no data corruption

## Rollback (if needed)
If you need to rollback this migration:
```sql
-- Remove the employmentType column
ALTER TABLE applications DROP COLUMN IF EXISTS "employmentType";

-- Restore the old type constraint
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_type_check;
ALTER TABLE applications ADD CONSTRAINT applications_type_check 
CHECK (type IN ('Full-time', 'Contract', 'Part-time', 'Internship'));
```

## Post-Migration
After the migration:
- Users will see two separate fields in forms: "Job Type" and "Employment Type"
- Analytics will track both dimensions separately
- Existing data will be preserved with `employmentType` set to the previous `type` value
- All new applications will default to "Remote" job type and "Full-time" employment type
