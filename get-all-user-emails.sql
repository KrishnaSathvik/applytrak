-- Get all user emails from the database
SELECT 
    id,
    email,
    display_name,
    created_at
FROM users 
WHERE email IS NOT NULL
ORDER BY created_at;
