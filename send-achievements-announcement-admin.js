// One-time email notification for new achievements feature
// This script sends a notification to all users about the new achievements system
// Uses service role key for admin access

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration with service role key
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EXAMPLE_SERVICE_ROLE_KEY';

if (!supabaseUrl || !supabaseServiceKey || supabaseUrl.includes('your-project')) {
    console.error('❌ Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    console.error('💡 You need the SERVICE ROLE key, not the anon key, for admin access');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function sendAchievementsAnnouncement() {
    try {
        console.log('🎉 Starting Achievements Feature Announcement...\n');

        // 1. Get all users from the database
        console.log('1️⃣ Fetching users from database...');
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, display_name')
            .not('email', 'is', null);

        if (usersError) {
            console.error('❌ Failed to fetch users:', usersError.message);
            return;
        }

        if (!users || users.length === 0) {
            console.log('⚠️ No users found in database');
            return;
        }

        console.log(`✅ Found ${users.length} users:`);
        users.forEach(user => {
            console.log(`   - ${user.email} (${user.display_name || 'No name'})`);
        });

        // 2. Send email to each user using the new achievements announcement function
        console.log('\n2️⃣ Sending achievement announcements...');
        
        for (const user of users) {
            try {
                console.log(`📧 Sending to ${user.email}...`);
                
                // Use the new achievements announcement function
                const { data, error } = await supabase.functions.invoke('achievements-announcement', {
                    body: {
                        email: user.email,
                        name: user.display_name || 'there'
                    }
                });

                if (error) {
                    console.error(`❌ Failed to send to ${user.email}:`, error.message);
                } else {
                    console.log(`✅ Successfully sent to ${user.email}`);
                }

                // Small delay between emails to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (emailError) {
                console.error(`❌ Error sending to ${user.email}:`, emailError.message);
            }
        }

        console.log('\n🎯 Announcement complete!');
        console.log(`📊 Summary: ${users.length} users notified about the new achievements feature`);

    } catch (error) {
        console.error('❌ Announcement failed:', error.message);
    }
}

// Run the announcement
sendAchievementsAnnouncement();
