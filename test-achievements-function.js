// Test the achievements announcement function directly
const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

async function testFunction() {
    try {
        console.log('🧪 Testing achievements announcement function...\n');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/achievements-announcement`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: 'krishnasathvikm@gmail.com',
                name: 'Krishna'
            })
        });
        
        const result = await response.text();
        
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${result}`);
        
        if (response.ok) {
            console.log('✅ Function is working!');
        } else {
            console.log('❌ Function failed');
        }
        
    } catch (error) {
        console.log(`❌ Error: ${error.message}`);
    }
}

testFunction();
