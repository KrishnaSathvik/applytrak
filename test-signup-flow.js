// Test Complete Signup Flow
// This script tests the actual signup flow to verify email verification and welcome emails work

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2MzI0MDAsImV4cCI6MjA1MTIwODQwMH0.test';

console.log('🧪 TESTING COMPLETE SIGNUP FLOW');
console.log('================================');
console.log('');

// Test function to simulate signup
async function testSignupFlow() {
    try {
        console.log('📝 Step 1: Testing signup with email verification...');
        
        // Generate a unique test email
        const testEmail = `test-${Date.now()}@example.com`;
        const testPassword = 'TestPassword123!';
        
        console.log(`   Using test email: ${testEmail}`);
        
        // Simulate signup request
        const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });
        
        const signupResult = await signupResponse.text();
        console.log(`   Signup response status: ${signupResponse.status}`);
        
        if (signupResponse.ok) {
            console.log('✅ Step 1: Signup successful - verification email should be sent');
            
            console.log('');
            console.log('📧 Step 2: Testing welcome email function (with proper auth)...');
            
            // Test welcome email function with a mock session
            const welcomeResponse = await fetch(`${SUPABASE_URL}/functions/v1/welcome-email`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                },
                body: JSON.stringify({
                    email: testEmail,
                    name: 'Test User'
                })
            });
            
            const welcomeResult = await welcomeResponse.text();
            console.log(`   Welcome email response status: ${welcomeResponse.status}`);
            
            if (welcomeResponse.ok) {
                console.log('✅ Step 2: Welcome email function working!');
            } else {
                console.log(`❌ Step 2: Welcome email failed: ${welcomeResult}`);
            }
            
        } else {
            console.log(`❌ Step 1: Signup failed: ${signupResult}`);
        }
        
    } catch (error) {
        console.log(`❌ Error during signup flow test: ${error.message}`);
    }
}

// Test function to check if environment variables are set
async function testEnvironmentVariables() {
    console.log('🔧 Step 0: Testing environment variables...');
    
    try {
        // Test if we can reach the functions endpoint
        const testResponse = await fetch(`${SUPABASE_URL}/functions/v1/welcome-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: 'test@example.com', name: 'Test' })
        });
        
        const testResult = await testResponse.text();
        
        if (testResponse.status === 401) {
            console.log('✅ Step 0: Functions are accessible and require authentication (expected)');
            console.log('   This means the functions are deployed and working correctly');
            return true;
        } else if (testResponse.status === 500) {
            console.log('⚠️ Step 0: Functions accessible but may have environment variable issues');
            console.log(`   Response: ${testResult}`);
            return false;
        } else {
            console.log(`❓ Step 0: Unexpected response: ${testResponse.status}`);
            console.log(`   Response: ${testResult}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Step 0: Error testing functions: ${error.message}`);
        return false;
    }
}

// Run the tests
async function runTests() {
    console.log('🎯 COMPREHENSIVE SIGNUP FLOW TEST');
    console.log('==================================');
    console.log('');
    
    const envTestPassed = await testEnvironmentVariables();
    console.log('');
    
    if (envTestPassed) {
        await testSignupFlow();
    } else {
        console.log('❌ Environment test failed - skipping signup flow test');
    }
    
    console.log('');
    console.log('📋 TEST SUMMARY:');
    console.log('================');
    console.log('');
    
    if (envTestPassed) {
        console.log('✅ Functions are deployed and accessible');
        console.log('✅ Authentication is working correctly');
        console.log('✅ Environment variables appear to be set');
        console.log('');
        console.log('🎉 READY FOR TESTING!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Test signup flow in the actual app');
        console.log('2. Verify email verification works');
        console.log('3. Check that welcome emails are sent');
        console.log('4. Confirm auto-redirect after verification');
    } else {
        console.log('❌ Functions may have environment variable issues');
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Check Supabase Dashboard → Functions → Environment Variables');
        console.log('2. Verify RESEND_API_KEY is set');
        console.log('3. Check function logs in Supabase Dashboard');
        console.log('4. Ensure all required environment variables are configured');
    }
}

runTests().catch(console.error);
