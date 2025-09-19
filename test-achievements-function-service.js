// Test the achievements announcement function with service role key
const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
// Using a dummy service role key for testing - you'll need to replace this with your actual service role key
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testFunction() {
    try {
        console.log('🧪 Testing achievements announcement function with service role...\n');
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/achievements-announcement`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
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
