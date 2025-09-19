// Detailed debugging of weekly goals email
const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

async function debugWeeklyGoalsDetailed() {
    console.log('🔍 DETAILED DEBUGGING: Weekly Goals Email');
    console.log('=' .repeat(50));
    console.log('');
    
    const testData = {
        email: 'krishnasathvikm@gmail.com',
        name: 'Krishna'
    };
    
    console.log('📧 Test Data:');
    console.log('   Email:', testData.email);
    console.log('   Name:', testData.name);
    console.log('');
    
    try {
        console.log('🚀 Making request to weekly-goals-email...');
        
        const response = await fetch(`${FUNCTIONS_BASE}/weekly-goals-email`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📊 Response Details:');
        console.log('   Status:', response.status);
        console.log('   Status Text:', response.statusText);
        console.log('   Headers:', Object.fromEntries(response.headers.entries()));
        console.log('');
        
        const result = await response.text();
        console.log('📝 Response Body:');
        console.log(result);
        console.log('');
        
        // Try to parse as JSON
        try {
            const jsonResult = JSON.parse(result);
            console.log('📋 Parsed JSON:');
            console.log(JSON.stringify(jsonResult, null, 2));
        } catch (e) {
            console.log('⚠️  Response is not valid JSON');
        }
        
        console.log('');
        console.log('🔍 ANALYSIS:');
        
        if (response.status === 200) {
            console.log('✅ SUCCESS: Email sent successfully!');
        } else if (response.status === 400) {
            console.log('❌ BAD REQUEST: Missing or invalid parameters');
        } else if (response.status === 404) {
            console.log('❌ NOT FOUND: User not found in database');
        } else if (response.status === 500) {
            console.log('❌ INTERNAL SERVER ERROR: Function has a runtime error');
            console.log('   Possible causes:');
            console.log('   • Database connection issue');
            console.log('   • Missing environment variables');
            console.log('   • Error in getWeeklyDigestData function');
            console.log('   • Issue with Supabase client initialization');
            console.log('   • Error in HTML rendering');
        } else {
            console.log(`❌ UNEXPECTED STATUS: ${response.status}`);
        }
        
    } catch (error) {
        console.log('💥 NETWORK ERROR:');
        console.log('   Error:', error.message);
        console.log('   Type:', error.name);
    }
    
    console.log('');
    console.log('💡 NEXT STEPS:');
    console.log('1. Check Supabase function logs for detailed error');
    console.log('2. Verify environment variables are set correctly');
    console.log('3. Test database connection in Supabase dashboard');
    console.log('4. Check if user exists in users table');
    console.log('5. Verify user has applications data');
}

debugWeeklyGoalsDetailed();
