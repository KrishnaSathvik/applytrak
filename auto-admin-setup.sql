-- ============================================================================
-- AUTO ADMIN SETUP - AUTOMATIC ADMIN ASSIGNMENT
-- ============================================================================
-- This automatically assigns admin roles based on email addresses during signup

-- ============================================================================
-- 1. CREATE ADMIN EMAIL LIST
-- ============================================================================

-- Create a table to store admin emails
CREATE TABLE IF NOT EXISTS public.admin_emails (
    email text PRIMARY KEY,
    role text NOT NULL CHECK (role IN ('admin', 'super_admin')),
    created_at timestamp with time zone DEFAULT NOW()
);

-- Insert your admin emails
INSERT INTO public.admin_emails (email, role) VALUES 
    ('krishnasathvikm@gmail.com', 'super_admin'),
    ('applytrak@gmail.com', 'admin')
ON CONFLICT (email) DO UPDATE SET 
    role = EXCLUDED.role,
    created_at = NOW();

-- ============================================================================
-- 2. UPDATE USER CREATION TRIGGER
-- ============================================================================

-- Drop the old trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create new trigger that automatically assigns admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role text := 'user';
    admin_email_record record;
BEGIN
    -- Check if user already exists
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE externalid = NEW.id) THEN
        
        -- Check if this email should be an admin
        SELECT role INTO admin_email_record
        FROM public.admin_emails 
        WHERE email = NEW.email;
        
        -- Set role based on admin email list
        IF admin_email_record IS NOT NULL THEN
            user_role := admin_email_record.role;
        END IF;
        
        -- Insert user with appropriate role
        INSERT INTO public.users (externalid, email, display_name, role, createdat, updatedat)
        VALUES (
            NEW.id,
            NEW.email,
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            user_role,
            NOW(),
            NOW()
        );
        
        -- Log the role assignment
        IF user_role != 'user' THEN
            RAISE NOTICE 'User % assigned role: %', NEW.email, user_role;
        END IF;
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating user profile: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- 3. UPDATE EXISTING USERS (IF ANY)
-- ============================================================================

-- Update existing users if they match admin emails
UPDATE public.users 
SET role = admin_emails.role, updatedat = NOW()
FROM public.admin_emails 
WHERE public.users.email = admin_emails.email;

-- ============================================================================
-- 4. CREATE FUNCTION TO ADD NEW ADMIN EMAILS
-- ============================================================================

-- Function to add new admin emails (for future use)
CREATE OR REPLACE FUNCTION public.add_admin_email(
    admin_email text,
    admin_role text DEFAULT 'admin'
)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can add admin emails';
    END IF;
    
    -- Validate role
    IF admin_role NOT IN ('admin', 'super_admin') THEN
        RAISE EXCEPTION 'Invalid role. Must be admin or super_admin';
    END IF;
    
    -- Insert or update admin email
    INSERT INTO public.admin_emails (email, role) 
    VALUES (admin_email, admin_role)
    ON CONFLICT (email) DO UPDATE SET 
        role = EXCLUDED.role,
        created_at = NOW();
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to remove admin emails
CREATE OR REPLACE FUNCTION public.remove_admin_email(admin_email text)
RETURNS boolean AS $$
DECLARE
    current_user_role text;
BEGIN
    -- Check if current user is super_admin
    current_user_role := public.get_user_role();
    
    IF current_user_role != 'super_admin' THEN
        RAISE EXCEPTION 'Only super admins can remove admin emails';
    END IF;
    
    -- Remove from admin emails list
    DELETE FROM public.admin_emails WHERE email = admin_email;
    
    -- Demote the user if they exist
    UPDATE public.users 
    SET role = 'user', updatedat = NOW()
    WHERE email = admin_email;
    
    RETURN true;
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.add_admin_email(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_admin_email(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_admin_email(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.remove_admin_email(text) TO service_role;

-- ============================================================================
-- 6. VERIFY SETUP
-- ============================================================================

-- Check admin emails are set up
DO $$
DECLARE
    admin_count integer;
BEGIN
    SELECT COUNT(*) INTO admin_count FROM public.admin_emails;
    
    RAISE NOTICE '✅ Auto admin setup completed!';
    RAISE NOTICE 'Admin emails configured: %', admin_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Admin emails:';
    FOR admin_count IN 
        SELECT email, role FROM public.admin_emails ORDER BY role, email
    LOOP
        RAISE NOTICE '- %: %', admin_count, (SELECT role FROM public.admin_emails WHERE email = admin_count);
    END LOOP;
    RAISE NOTICE '';
    RAISE NOTICE 'Now when you sign up with these emails, you will automatically get admin privileges!';
END $$;
