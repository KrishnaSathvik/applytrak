// Debug weekly goals email function
const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

async function debugWeeklyGoals() {
    console.log('🔍 Debugging weekly-goals-email function...');
    console.log('');
    
    const testData = {
        email: 'krishnasathvikm@gmail.com',
        name: 'Krishna'
    };
    
    try {
        const response = await fetch(`${FUNCTIONS_BASE}/weekly-goals-email`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testData)
        });
        
        const result = await response.text();
        
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${result}`);
        
        if (response.status === 500) {
            console.log('');
            console.log('🔍 500 Internal Server Error - Possible causes:');
            console.log('• Database connection issue');
            console.log('• Missing environment variables');
            console.log('• Error in getWeeklyDigestData function');
            console.log('• Issue with Supabase client initialization');
            console.log('');
            console.log('💡 The function is accessible but has a runtime error');
            console.log('💡 This is different from the 404 errors which are expected');
        }
        
    } catch (error) {
        console.log(`❌ Network Error: ${error.message}`);
    }
}

debugWeeklyGoals();
