// Comprehensive Email Template Test Script
// 
// INSTRUCTIONS:
// 1. Get your anon key from: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg/settings/api
// 2. Replace the ANON_KEY below with your actual anon key
// 3. Run: node test-email-templates-complete.js

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

const testEmail = async (functionName, data) => {
    try {
        console.log(`\n🧪 Testing ${functionName}...`);
        
        const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ANON_KEY}`
            },
            body: JSON.stringify(data)
        });

        const result = await response.text();
        console.log(`Status: ${response.status}`);
        
        if (response.ok) {
            console.log(`✅ ${functionName} test passed!`);
            console.log(`📧 Email sent to: ${data.email}`);
        } else {
            console.log(`❌ ${functionName} test failed!`);
            console.log(`Response: ${result}`);
        }
        
        return { success: response.ok, status: response.status, result };
    } catch (error) {
        console.log(`❌ ${functionName} test error:`, error.message);
        return { success: false, error: error.message };
    }
};

const runTests = async () => {
    if (ANON_KEY === 'YOUR_ANON_KEY_HERE') {
        console.log('❌ Please replace ANON_KEY with your actual anon key from the Supabase dashboard');
        console.log('🔗 Get it from: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg/settings/api');
        return;
    }

    console.log('🚀 Starting Email Template Tests...\n');
    console.log('📧 Testing all email templates with sample data...\n');
    
    const testData = {
        email: 'krishnasathvikm@gmail.com', // Your email for testing
        name: 'Krishna',
        logoUrl: 'https://www.applytrak.com/logo.png' // Your logo
    };

    // Test all email functions
    const tests = [
        {
            name: 'welcome-email',
            data: testData,
            description: 'Welcome email for new users'
        },
        {
            name: 'weekly-goals-email',
            data: testData,
            description: 'Weekly progress report with goal tracking'
        },
        {
            name: 'weekly-tips-email',
            data: testData,
            description: 'Personalized job search tips and insights'
        },
        {
            name: 'milestone-email',
            data: { ...testData, milestoneType: 'applications', milestoneValue: 25 },
            description: 'Achievement celebration email'
        },
        {
            name: 'monthly-analytics-email',
            data: testData,
            description: 'Comprehensive monthly performance report'
        },
        {
            name: 'inactivity-reminder-email',
            data: testData,
            description: 'Re-engagement email for inactive users'
        }
    ];

    const results = [];
    
    for (const test of tests) {
        console.log(`📋 ${test.description}`);
        const result = await testEmail(test.name, test.data);
        results.push({ ...test, ...result });
        
        // Add delay between tests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n📊 Test Summary:');
    console.log('================');
    
    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📧 Total: ${results.length}`);
    
    if (passed > 0) {
        console.log('\n✅ Successful Tests:');
        results.filter(r => r.success).forEach(r => {
            console.log(`- ${r.name}: ${r.description}`);
        });
    }
    
    if (failed > 0) {
        console.log('\n❌ Failed Tests:');
        results.filter(r => !r.success).forEach(r => {
            console.log(`- ${r.name}: ${r.error || r.result}`);
        });
    }
    
    // Test email preferences page
    console.log('\n📋 Email preferences management page');
    console.log('\n🧪 Testing email-preferences...');
    try {
        const prefsUrl = `${SUPABASE_URL}/functions/v1/email-preferences?eid=test-user-123`;
        const prefsResponse = await fetch(prefsUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log(`Status: ${prefsResponse.status}`);
        if (prefsResponse.ok) {
            const prefsHtml = await prefsResponse.text();
            console.log('✅ email-preferences test passed!');
            console.log('📧 Email preferences page loaded successfully');
            console.log('🔗 You can test the preferences page at:', prefsUrl);
            console.log('📄 Page content preview:', prefsHtml.substring(0, 200) + '...');
        } else {
            console.log('❌ email-preferences test failed!');
            console.log('Error:', await prefsResponse.text());
        }
    } catch (error) {
        console.log('❌ email-preferences test failed!');
        console.log('Error:', error.message);
    }

    console.log('\n🎉 Testing complete!');
    console.log('\n📝 Next Steps:');
    console.log('1. Check your email inbox for the test emails');
    console.log('2. Review the email designs and content');
    console.log('3. Test with real user data from your database');
    console.log('4. Set up automated triggers for these emails');
    console.log('5. Test the email preferences page in your browser');
};

// Test individual function
const testSingleFunction = async (functionName, data) => {
    console.log(`🧪 Testing single function: ${functionName}`);
    const result = await testEmail(functionName, data);
    console.log(`Result:`, result);
    return result;
};

// Export for manual testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testEmail, testSingleFunction };
}

// Run the tests
runTests().catch(console.error);
