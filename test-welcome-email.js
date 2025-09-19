// Test welcome email with correct format
const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

async function testWelcomeEmail() {
    try {
        console.log('🧪 Testing welcome-email with correct format...');
        
        const response = await fetch(`${FUNCTIONS_BASE}/welcome-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'krishnasathvikm@gmail.com',
                name: 'Krishna'
            })
        });
        
        const result = await response.text();
        
        if (response.ok) {
            console.log(`✅ welcome-email: SUCCESS`);
            console.log(`   Response: ${result.substring(0, 100)}...`);
        } else {
            console.log(`❌ welcome-email: FAILED`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${result}`);
        }
        
        return response.ok;
    } catch (error) {
        console.log(`❌ welcome-email: ERROR`);
        console.log(`   Error: ${error.message}`);
        return false;
    }
}

testWelcomeEmail();
