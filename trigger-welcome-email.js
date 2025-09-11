// ============================================================================
// TRIGGER WELCOME EMAIL FOR USER ID 1
// ============================================================================
// This script manually triggers the welcome email for user ID 1

const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

async function triggerWelcomeEmail() {
    try {
        console.log('🚀 Triggering welcome email for user ID 1...');
        
        // Get user details first
        const userEmail = 'krishnasathvikm@gmail.com';
        const userName = 'Krishna'; // You can update this if you have a display name
        
        console.log(`📧 Sending welcome email to: ${userEmail}`);
        console.log(`👤 User name: ${userName}`);
        
        // Call the welcome email function
        const response = await fetch(`${FUNCTIONS_BASE}/welcome-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer YOUR_ANON_KEY' // You'll need to add your anon key
            },
            body: JSON.stringify({
                email: userEmail,
                name: userName
            })
        });
        
        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
        
        const responseText = await response.text();
        console.log('📄 Response body:', responseText);
        
        if (response.ok) {
            console.log('✅ Welcome email triggered successfully!');
            console.log('📧 Check your email inbox for the welcome email.');
        } else {
            console.error('❌ Failed to trigger welcome email:', response.status, responseText);
        }
        
    } catch (error) {
        console.error('💥 Error triggering welcome email:', error);
    }
}

// Run the function
triggerWelcomeEmail();
