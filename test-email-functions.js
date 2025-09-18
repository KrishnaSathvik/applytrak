// Test Email Functions
// This script tests all deployed email functions

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

console.log('📧 TESTING EMAIL FUNCTIONS');
console.log('==========================');
console.log('');

// Test function to make HTTP requests
async function testEmailFunction(functionName, testData) {
    try {
        console.log(`🧪 Testing ${functionName}...`);
        
        // Try without authentication first to see if functions work
        console.log('   Testing without authentication...');
        
        const response = await fetch(`${FUNCTIONS_BASE}/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        const result = await response.text();
        
        if (response.ok) {
            console.log(`✅ ${functionName}: SUCCESS`);
            console.log(`   Response: ${result.substring(0, 100)}...`);
        } else {
            console.log(`❌ ${functionName}: FAILED`);
            console.log(`   Status: ${response.status}`);
            console.log(`   Error: ${result}`);
        }
        
        console.log('');
        return response.ok;
    } catch (error) {
        console.log(`❌ ${functionName}: ERROR`);
        console.log(`   Error: ${error.message}`);
        console.log('');
        return false;
    }
}

// Test all email functions
async function testAllEmailFunctions() {
    console.log('🎯 Testing all email functions...');
    console.log('');
    
    const testEmail = 'test@example.com';
    const testName = 'Test User';
    
    const results = {
        'welcome-email': await testEmailFunction('welcome-email', {
            email: testEmail,
            name: testName
        }),
        
        'weekly-goals-email': await testEmailFunction('weekly-goals-email', {
            email: testEmail,
            name: testName
        }),
        
        'weekly-tips-email': await testEmailFunction('weekly-tips-email', {
            email: testEmail,
            name: testName
        }),
        
        'milestone-email': await testEmailFunction('milestone-email', {
            email: testEmail,
            name: testName
        }),
        
        'email-preferences': await testEmailFunction('email-preferences', {
            email: testEmail,
            action: 'unsubscribe'
        })
    };
    
    console.log('📊 TEST RESULTS SUMMARY:');
    console.log('========================');
    console.log('');
    
    Object.entries(results).forEach(([functionName, success]) => {
        const status = success ? '✅ WORKING' : '❌ FAILED';
        console.log(`${functionName}: ${status}`);
    });
    
    const successCount = Object.values(results).filter(Boolean).length;
    const totalCount = Object.keys(results).length;
    
    console.log('');
    console.log(`🎯 OVERALL SCORE: ${successCount}/${totalCount} functions working`);
    
    if (successCount === totalCount) {
        console.log('🏆 ALL EMAIL FUNCTIONS ARE WORKING PERFECTLY!');
    } else if (successCount > 0) {
        console.log('⚠️ SOME EMAIL FUNCTIONS NEED ATTENTION');
    } else {
        console.log('❌ NO EMAIL FUNCTIONS ARE WORKING');
        console.log('');
        console.log('🔧 TROUBLESHOOTING STEPS:');
        console.log('1. Check environment variables in Supabase Dashboard');
        console.log('2. Verify RESEND_API_KEY is valid');
        console.log('3. Check Supabase service role key');
        console.log('4. Check function logs in Supabase Dashboard');
    }
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('==============');
    console.log('');
    
    if (successCount === totalCount) {
        console.log('✅ All email functions are working!');
        console.log('✅ Test the complete signup flow');
        console.log('✅ Verify welcome emails are sent');
        console.log('✅ Check email verification auto-signin');
    } else {
        console.log('🔧 Fix the failed email functions first');
        console.log('🔧 Check environment variables');
        console.log('🔧 Test individual functions');
        console.log('🔧 Check Supabase Dashboard logs');
    }
}

// Run the tests
testAllEmailFunctions().catch(console.error);
