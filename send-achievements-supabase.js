// Send achievements announcement using Supabase client
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'your-service-key-here';

async function sendAchievementsAnnouncement() {
    try {
        console.log('🎉 Starting Achievements Feature Announcement...\n');

        // Create Supabase client with service role key
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

        // List of users to notify
        const usersToNotify = [
            { email: 'krishnasathvikm@gmail.com', name: 'Krishna' },
            { email: 'saitejaswinithumpala@gmail.com', name: 'Tejuu' },
            { email: 'divyakodanganti@gmail.com', name: 'Divya Kodanganti' },
        ];

        console.log(`📧 Sending announcements to ${usersToNotify.length} users...\n`);
        
        for (const user of usersToNotify) {
            try {
                console.log(`📧 Sending to ${user.email}...`);
                
                // Call the Supabase function
                const { data, error } = await supabase.functions.invoke('achievements-announcement', {
                    body: {
                        email: user.email,
                        name: user.name
                    }
                });
                
                if (error) {
                    console.log(`❌ Failed to send to ${user.email}: ${error.message}`);
                } else {
                    console.log(`✅ Successfully sent to ${user.email}`);
                    console.log(`   Response: ${JSON.stringify(data)}`);
                }
                
            } catch (error) {
                console.log(`❌ Error sending to ${user.email}: ${error.message}`);
            }
            
            console.log(''); // Empty line for readability
        }

        console.log('🎯 Announcement complete!');
        console.log('📊 Summary: 3 users notified about the new achievements feature');
        
    } catch (error) {
        console.log(`❌ Announcement failed: ${error.message}`);
    }
}

// Check if SUPABASE_SERVICE_KEY is provided
if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'your-service-key-here') {
    console.log('❌ Please set SUPABASE_SERVICE_KEY environment variable');
    console.log('Usage: SUPABASE_SERVICE_KEY=your_key_here node send-achievements-supabase.js');
    console.log('You can find your service key in Supabase Dashboard > Settings > API');
    process.exit(1);
}

sendAchievementsAnnouncement();
