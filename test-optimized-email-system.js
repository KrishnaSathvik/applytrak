// Test script for the optimized email system (5 essential templates)
const FUNCTIONS_BASE = 'https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1';

// Test data
const testUser = {
    email: 'krishnasathvikm@gmail.com',
    name: 'Krishna'
};

// Test function to make HTTP requests
async function testEmailFunction(functionName, testData) {
    try {
        console.log(`🧪 Testing ${functionName}...`);
        
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

// Test all 5 essential email templates
async function testOptimizedEmailSystem() {
    console.log('🚀 Testing Optimized Email System (5 Essential Templates)');
    console.log('=' .repeat(60));
    console.log('');
    
    const results = [];
    
    // 1. Weekly Goals Email (Enhanced Weekly Digest)
    console.log('📊 1. WEEKLY GOALS EMAIL (Enhanced Weekly Digest)');
    console.log('   Purpose: Comprehensive weekly digest with all insights');
    console.log('   Schedule: Every Sunday 9 AM UTC');
    console.log('   Content: Goals + Achievements + Tips + Follow-ups + Analytics');
    console.log('');
    
    results.push(await testEmailFunction('weekly-goals-email', testUser));
    
    // 2. Achievement Unlocked Email
    console.log('🏆 2. ACHIEVEMENT UNLOCKED EMAIL');
    console.log('   Purpose: Instant gratification when user unlocks achievement');
    console.log('   Schedule: On-demand (triggered by achievement unlock)');
    console.log('   Content: Achievement details + XP + celebration');
    console.log('');
    
    results.push(await testEmailFunction('achievement-unlocked-email', {
        ...testUser,
        achievementId: 1,
        userId: 'c8e38372-50fa-49b5-a07d-5d00df292ec5'
    }));
    
    // 3. Interview Scheduled Email
    console.log('📅 3. INTERVIEW SCHEDULED EMAIL');
    console.log('   Purpose: Celebrate interview milestone');
    console.log('   Schedule: On-demand (triggered by status change)');
    console.log('   Content: Interview details + preparation tips');
    console.log('');
    
    results.push(await testEmailFunction('interview-scheduled-email', {
        ...testUser,
        applicationId: 1,
        company: 'Google',
        position: 'Software Engineer',
        interviewDate: '2024-01-15T10:00:00Z'
    }));
    
    // 4. Offer Received Email
    console.log('🎉 4. OFFER RECEIVED EMAIL');
    console.log('   Purpose: Celebrate offer milestone');
    console.log('   Schedule: On-demand (triggered by status change)');
    console.log('   Content: Offer details + celebration');
    console.log('');
    
    results.push(await testEmailFunction('offer-received-email', {
        ...testUser,
        applicationId: 1,
        company: 'Google',
        position: 'Software Engineer',
        offerDate: '2024-01-15T10:00:00Z'
    }));
    
    // 5. Welcome Email
    console.log('👋 5. WELCOME EMAIL');
    console.log('   Purpose: Welcome new users');
    console.log('   Schedule: On-demand (triggered by user signup)');
    console.log('   Content: Welcome + onboarding + features');
    console.log('');
    
    results.push(await testEmailFunction('welcome-email', testUser));
    
    // Summary
    console.log('📋 TEST SUMMARY');
    console.log('=' .repeat(60));
    
    const successCount = results.filter(r => r).length;
    const totalCount = results.length;
    
    console.log(`✅ Successful: ${successCount}/${totalCount}`);
    console.log(`❌ Failed: ${totalCount - successCount}/${totalCount}`);
    console.log('');
    
    if (successCount === totalCount) {
        console.log('🎉 ALL TESTS PASSED! Optimized email system is working perfectly.');
    } else {
        console.log('⚠️  Some tests failed. Check the error messages above.');
    }
    
    console.log('');
    console.log('📊 OPTIMIZATION BENEFITS:');
    console.log('   • Reduced from 13 templates to 5 essential ones');
    console.log('   • Maximum 1-2 emails per week per user');
    console.log('   • No email fatigue');
    console.log('   • Higher engagement rates');
    console.log('   • Comprehensive weekly digest');
    console.log('   • Instant gratification for milestones');
    console.log('   • Automated triggers for important events');
    console.log('');
    
    return successCount === totalCount;
}

// Run the tests
testOptimizedEmailSystem()
    .then(success => {
        if (success) {
            console.log('🚀 Ready to deploy the optimized email system!');
        } else {
            console.log('🔧 Please fix the failing tests before deploying.');
        }
    })
    .catch(error => {
        console.error('💥 Test suite failed:', error);
    });
