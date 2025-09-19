// =====================================================
// ACHIEVEMENT API TEST SCRIPT
// =====================================================
// Run this in browser console or Node.js to test the API

const SUPABASE_URL = 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with actual key

// Test data - Real user from database
const testUserId = 'c8e38372-50fa-49b5-a07d-5d00df292ec5'; // saitejaswinithumpala@gmail.com

// Helper function to make API calls
async function testApiCall(endpoint, method = 'GET', body = null) {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${endpoint}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            },
            body: body ? JSON.stringify(body) : undefined
        });

        const data = await response.json();
        
        console.log(`🔍 ${endpoint}:`, {
            status: response.status,
            ok: response.ok,
            data: data
        });

        return { success: response.ok, data, status: response.status };
    } catch (error) {
        console.error(`❌ ${endpoint} failed:`, error);
        return { success: false, error: error.message };
    }
}

// Test functions
async function testAchievementSystem() {
    console.log('🚀 Starting Achievement System API Tests...\n');

    // 1. Test get_user_achievements function
    console.log('1️⃣ Testing get_user_achievements...');
    const achievementsResult = await testApiCall('get_user_achievements', 'POST', {
        user_uuid: testUserId
    });

    // 2. Test get_user_stats function
    console.log('\n2️⃣ Testing get_user_stats...');
    const statsResult = await testApiCall('get_user_stats', 'POST', {
        user_uuid: testUserId
    });

    // 3. Test unlock_achievement function (if exists)
    console.log('\n3️⃣ Testing unlock_achievement...');
    const unlockResult = await testApiCall('unlock_achievement', 'POST', {
        user_uuid: testUserId,
        achievement_id: 'first_steps'
    });

    // 4. Test direct table access
    console.log('\n4️⃣ Testing direct table access...');
    
    // Test achievements table
    try {
        const achievementsTableResponse = await fetch(`${SUPABASE_URL}/rest/v1/achievements?select=*&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const achievementsTableData = await achievementsTableResponse.json();
        console.log('📊 Achievements table:', {
            status: achievementsTableResponse.status,
            count: achievementsTableData.length,
            sample: achievementsTableData[0]
        });
    } catch (error) {
        console.error('❌ Achievements table access failed:', error);
    }

    // Test user_achievements table
    try {
        const userAchievementsResponse = await fetch(`${SUPABASE_URL}/rest/v1/user_achievements?select=*&limit=5`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        const userAchievementsData = await userAchievementsResponse.json();
        console.log('📊 User achievements table:', {
            status: userAchievementsResponse.status,
            count: userAchievementsData.length,
            sample: userAchievementsData[0]
        });
    } catch (error) {
        console.error('❌ User achievements table access failed:', error);
    }

    // Summary
    console.log('\n📋 TEST SUMMARY:');
    console.log('✅ get_user_achievements:', achievementsResult.success ? 'PASS' : 'FAIL');
    console.log('✅ get_user_stats:', statsResult.success ? 'PASS' : 'FAIL');
    console.log('✅ unlock_achievement:', unlockResult.success ? 'PASS' : 'FAIL');
    
    if (achievementsResult.success && statsResult.success) {
        console.log('\n🎉 Achievement system database is working correctly!');
    } else {
        console.log('\n⚠️ Some tests failed. Check the errors above.');
    }
}

// Run the tests
testAchievementSystem();

// =====================================================
// MANUAL TESTING FUNCTIONS
// =====================================================

// Test with specific user data
async function testWithUserData(userId, applications, dailyStreak, weeklyProgress, monthlyProgress) {
    console.log(`🧪 Testing with user data: ${userId}`);
    
    // Test achievements loading
    const achievements = await testApiCall('get_user_achievements', 'POST', {
        user_uuid: userId
    });
    
    // Test stats loading
    const stats = await testApiCall('get_user_stats', 'POST', {
        user_uuid: userId
    });
    
    console.log('📊 Test Results:', {
        achievements: achievements.data,
        stats: stats.data,
        userApplications: applications.length,
        dailyStreak,
        weeklyProgress,
        monthlyProgress
    });
}

// Example usage:
// testWithUserData('user-uuid', [], 0, 0, 0);
