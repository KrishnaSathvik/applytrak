// Send achievements announcement to individual users with delays
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyOTU0MywiZXhwIjoyMDcwMDA1NTQzfQ.jZMxPrFq1yiwRHSrJhlyfkAWeA7IIRgsmRG4UkFh-Fg';

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendToUser(supabase, user, index) {
    try {
        console.log(`📧 [${index + 1}/3] Sending to ${user.email}...`);
        
        const { data, error } = await supabase.functions.invoke('achievements-announcement', {
            body: {
                email: user.email,
                name: user.name
            }
        });
        
        if (error) {
            console.log(`❌ Failed to send to ${user.email}: ${error.message}`);
            return false;
        } else {
            console.log(`✅ Successfully sent to ${user.email}`);
            console.log(`   Response: ${JSON.stringify(data)}`);
            return true;
        }
        
    } catch (error) {
        console.log(`❌ Error sending to ${user.email}: ${error.message}`);
        return false;
    }
}

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
        
        let successCount = 0;
        
        for (let i = 0; i < usersToNotify.length; i++) {
            const user = usersToNotify[i];
            const success = await sendToUser(supabase, user, i);
            
            if (success) {
                successCount++;
            }
            
            // Add delay between emails to avoid rate limiting
            if (i < usersToNotify.length - 1) {
                console.log('⏳ Waiting 3 seconds before next email...\n');
                await delay(3000);
            }
        }

        console.log('\n🎯 Announcement complete!');
        console.log(`📊 Summary: ${successCount}/${usersToNotify.length} users notified about the new achievements feature`);
        
    } catch (error) {
        console.log(`❌ Announcement failed: ${error.message}`);
    }
}

sendAchievementsAnnouncement();
