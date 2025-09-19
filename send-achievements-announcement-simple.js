// Simple achievements announcement script
// Calls the achievements-announcement function directly for specific users

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.error('❌ Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sendAchievementsAnnouncement() {
    try {
        console.log('🎉 Starting Achievements Feature Announcement...\n');

        // List of users to notify (you can add more emails here)
        const usersToNotify = [
            { email: 'krishnasathvikm@gmail.com', name: 'Krishna' },
            { email: 'saitejaswinithumpala@gmail.com', name: 'Tejuu' },
            { email: 'divyakodanganti@gmail.com', name: 'Divya Kodanganti' },
            // Add more users here as needed
        ];

        console.log(`📧 Sending announcements to ${usersToNotify.length} users...\n`);
        
        for (const user of usersToNotify) {
            try {
                console.log(`📧 Sending to ${user.email}...`);
                
                // Call the achievements announcement function
                const { data, error } = await supabase.functions.invoke('achievements-announcement', {
                    body: {
                        email: user.email,
                        name: user.name
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
        console.log(`📊 Summary: ${usersToNotify.length} users notified about the new achievements feature`);

    } catch (error) {
        console.error('❌ Announcement failed:', error.message);
    }
}

// Run the announcement
sendAchievementsAnnouncement();
