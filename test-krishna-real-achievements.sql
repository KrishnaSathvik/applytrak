-- =====================================================
-- TEST KRISHNA'S REAL ACHIEVEMENTS (Frontend vs Backend)
-- =====================================================
-- User: krishnasathvikm@gmail.com
-- UUID: 4485394f-5d84-4c2e-a77b-0f4bf34b302b
-- Applications: 86

-- 1. Check what achievements krishna currently has unlocked in database
SELECT 
    'CURRENT UNLOCKED ACHIEVEMENTS' as test_name,
    a.id,
    a.name,
    a.description,
    a.category,
    a.tier,
    a.rarity,
    a.xp_reward,
    ua.unlocked_at,
    '✅ UNLOCKED' as status
FROM user_achievements ua
JOIN achievements a ON ua.achievement_id = a.id
WHERE ua.user_id = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid
ORDER BY a.category, a.xp_reward DESC;

-- 2. Calculate what achievements krishna SHOULD have based on 86 applications
SELECT 
    'EXPECTED ACHIEVEMENTS FOR 86 APPLICATIONS' as test_name,
    'Milestone Achievements:' as category,
    CASE 
        WHEN 86 >= 1 THEN '✅ First Steps (1+ apps) - 10 XP'
        ELSE '❌ First Steps'
    END as first_steps,
    CASE 
        WHEN 86 >= 10 THEN '✅ Getting Started (10+ apps) - 25 XP'
        ELSE '❌ Getting Started'
    END as getting_started,
    CASE 
        WHEN 86 >= 50 THEN '✅ Job Hunter (50+ apps) - 50 XP'
        ELSE '❌ Job Hunter'
    END as job_hunter,
    CASE 
        WHEN 86 >= 100 THEN '✅ Application Master (100+ apps) - 100 XP'
        ELSE '❌ Application Master (SHOULD BE LOCKED)'
    END as application_master,
    CASE 
        WHEN 86 >= 500 THEN '✅ Job Search Legend (500+ apps) - 250 XP'
        ELSE '❌ Job Search Legend (SHOULD BE LOCKED)'
    END as job_search_legend,
    CASE 
        WHEN 86 >= 1000 THEN '✅ Legendary Job Seeker (1000+ apps) - 1000 XP'
        ELSE '❌ Legendary Job Seeker (SHOULD BE LOCKED)'
    END as legendary_job_seeker;

-- 3. Check krishna's application data for other achievements
SELECT 
    'APPLICATION DATA ANALYSIS' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN type = 'Remote' THEN 1 END) as remote_applications,
    COUNT(CASE WHEN notes IS NOT NULL AND notes != '' THEN 1 END) as applications_with_notes,
    COUNT(CASE WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 THEN 1 END) as applications_with_attachments,
    COUNT(CASE WHEN status ILIKE '%interview%' OR status ILIKE '%phone%' OR status ILIKE '%video%' OR status ILIKE '%onsite%' THEN 1 END) as interview_applications,
    COUNT(CASE WHEN status ILIKE '%offer%' OR status ILIKE '%accepted%' THEN 1 END) as offer_applications
FROM applications 
WHERE userid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 4. Check for cover letter and resume attachments
SELECT 
    'ATTACHMENT ANALYSIS' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 THEN 1 END) as apps_with_attachments,
    COUNT(CASE 
        WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 AND
             EXISTS (
                 SELECT 1 FROM jsonb_array_elements(attachments) AS attachment
                 WHERE LOWER(attachment->>'name') LIKE '%cover%' 
                    OR LOWER(attachment->>'name') LIKE '%letter%'
                    OR LOWER(attachment->>'name') LIKE '%cl_%'
             )
        THEN 1 
    END) as apps_with_cover_letters,
    COUNT(CASE 
        WHEN attachments IS NOT NULL AND jsonb_array_length(attachments) > 0 AND
             EXISTS (
                 SELECT 1 FROM jsonb_array_elements(attachments) AS attachment
                 WHERE LOWER(attachment->>'name') LIKE '%resume%' 
                    OR LOWER(attachment->>'name') LIKE '%cv%'
                    OR LOWER(attachment->>'name') LIKE '%resume_%'
             )
        THEN 1 
    END) as apps_with_resumes
FROM applications 
WHERE userid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 5. Check FAANG applications
SELECT 
    'FAANG ANALYSIS' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE 
        WHEN LOWER(company) LIKE '%facebook%' OR LOWER(company) LIKE '%meta%' OR
             LOWER(company) LIKE '%amazon%' OR LOWER(company) LIKE '%apple%' OR
             LOWER(company) LIKE '%netflix%' OR LOWER(company) LIKE '%google%' OR
             LOWER(company) LIKE '%alphabet%' OR LOWER(company) LIKE '%microsoft%'
        THEN 1 
    END) as faang_applications,
    STRING_AGG(DISTINCT company, ', ') as unique_companies
FROM applications 
WHERE userid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 6. Check time-based achievements (early bird, night owl)
SELECT 
    'TIME ANALYSIS' as test_name,
    COUNT(*) as total_applications,
    COUNT(CASE WHEN EXTRACT(HOUR FROM date_applied) < 9 THEN 1 END) as early_bird_applications,
    COUNT(CASE WHEN EXTRACT(HOUR FROM date_applied) >= 20 THEN 1 END) as night_owl_applications,
    MIN(EXTRACT(HOUR FROM date_applied)) as earliest_hour,
    MAX(EXTRACT(HOUR FROM date_applied)) as latest_hour
FROM applications 
WHERE userid = '4485394f-5d84-4c2e-a77b-0f4bf34b302b'::uuid;

-- 7. Summary of what krishna should have unlocked
SELECT 
    'ACHIEVEMENT SUMMARY' as test_name,
    'Based on 86 applications, krishna should have:' as summary,
    '✅ First Steps (1+ apps) - 10 XP' as milestone_1,
    '✅ Getting Started (10+ apps) - 25 XP' as milestone_2,
    '✅ Job Hunter (50+ apps) - 50 XP' as milestone_3,
    '❌ Application Master (100+ apps) - 100 XP' as milestone_4,
    '❌ Job Search Legend (500+ apps) - 250 XP' as milestone_5,
    '❌ Legendary Job Seeker (1000+ apps) - 1000 XP' as milestone_6,
    'Plus other achievements based on streaks, goals, quality, etc.' as other_achievements;
