-- Test Single Table Creation
-- This creates ONLY the admin_emails table to test

-- Step 1: Create sequence
CREATE SEQUENCE IF NOT EXISTS admin_emails_id_seq;

-- Step 2: Create table
CREATE TABLE IF NOT EXISTS public.admin_emails (
    id bigint NOT NULL DEFAULT nextval('admin_emails_id_seq'::regclass),
    template_name text NOT NULL,
    subject text NOT NULL,
    body_html text,
    body_text text,
    email_type text NOT NULL CHECK (email_type = ANY (ARRAY['welcome'::text, 'milestone'::text, 'weekly'::text, 'monthly'::text, 'admin'::text])),
    is_active boolean DEFAULT true,
    created_by bigint,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_sent_at timestamp with time zone,
    send_count integer DEFAULT 0,
    CONSTRAINT admin_emails_pkey PRIMARY KEY (id),
    CONSTRAINT admin_emails_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL
);

-- Step 3: Enable RLS
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

-- Step 4: Set sequence ownership
ALTER SEQUENCE admin_emails_id_seq OWNED BY public.admin_emails.id;

-- Step 5: Insert test data
INSERT INTO public.admin_emails (template_name, subject, body_html, body_text, email_type, created_at, updated_at)
VALUES 
    ('welcome', 'Welcome to ApplyTrak!', '<h1>Welcome to ApplyTrak!</h1><p>Start tracking your job applications today.</p>', 'Welcome to ApplyTrak! Start tracking your job applications today.', 'welcome', now(), now())
ON CONFLICT DO NOTHING;

-- Step 6: Create index
CREATE INDEX IF NOT EXISTS idx_admin_emails_type ON public.admin_emails(email_type);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE 'admin_emails table created successfully!';
    RAISE NOTICE 'Table: Ready';
    RAISE NOTICE 'Data: Inserted';
    RAISE NOTICE 'Index: Created';
END $$;
