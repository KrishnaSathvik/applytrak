// Script to check what achievements are currently in the database
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://ihlaenwiyxtmkehfoesg.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your-project')) {
    console.error('❌ Missing Supabase configuration. Please set REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseAchievements() {
    try {
        console.log('🔍 Checking Database Achievement Status...\n');

        // 1. Check all achievements in the database
        console.log('1️⃣ All Achievements in Database:');
        const { data: achievements, error: achievementsError } = await supabase
            .from('achievements')
            .select('*')
            .order('category', { ascending: true });

        if (achievementsError) {
            console.error('❌ Error fetching achievements:', achievementsError.message);
            return;
        }

        if (!achievements || achievements.length === 0) {
            console.log('⚠️ No achievements found in database');
            return;
        }

        console.log(`✅ Found ${achievements.length} achievements:`);
        achievements.forEach(achievement => {
            console.log(`   - ${achievement.name} (${achievement.id}) - ${achievement.category} - ${achievement.tier}`);
            console.log(`     Requirements: ${JSON.stringify(achievement.requirements)}`);
        });

        // 2. Check user achievements (unlocked achievements)
        console.log('\n2️⃣ User Achievements (Unlocked):');
        const { data: userAchievements, error: userAchievementsError } = await supabase
            .from('user_achievements')
            .select(`
                *,
                achievements (
                    id,
                    name,
                    category,
                    tier,
                    requirements
                )
            `)
            .order('unlocked_at', { ascending: false });

        if (userAchievementsError) {
            console.error('❌ Error fetching user achievements:', userAchievementsError.message);
        } else {
            if (!userAchievements || userAchievements.length === 0) {
                console.log('📦 No achievements unlocked yet');
            } else {
                console.log(`🏆 Found ${userAchievements.length} unlocked achievements:`);
                userAchievements.forEach(ua => {
                    const achievement = ua.achievements;
                    if (achievement) {
                        console.log(`   ✅ ${achievement.name} (${achievement.id})`);
                        console.log(`      Category: ${achievement.category}, Tier: ${achievement.tier}`);
                        console.log(`      Requirements: ${JSON.stringify(achievement.requirements)}`);
                        console.log(`      Unlocked at: ${ua.unlocked_at}`);
                        console.log(`      User ID: ${ua.user_id}`);
                        console.log('');
                    }
                });
            }
        }

        // 3. Check user stats
        console.log('\n3️⃣ User Stats:');
        const { data: userStats, error: userStatsError } = await supabase
            .from('user_stats')
            .select('*')
            .order('last_updated', { ascending: false });

        if (userStatsError) {
            console.error('❌ Error fetching user stats:', userStatsError.message);
        } else {
            if (!userStats || userStats.length === 0) {
                console.log('📊 No user stats found');
            } else {
                console.log(`📈 Found ${userStats.length} user stats:`);
                userStats.forEach(stats => {
                    console.log(`   User: ${stats.user_id}`);
                    console.log(`   Total XP: ${stats.total_xp}`);
                    console.log(`   Current Level: ${stats.current_level}`);
                    console.log(`   Achievements Unlocked: ${stats.achievements_unlocked}`);
                    console.log(`   Last Updated: ${stats.last_updated}`);
                    console.log('');
                });
            }
        }

        // 4. Check applications count
        console.log('\n4️⃣ Applications Count:');
        const { data: applications, error: applicationsError } = await supabase
            .from('applications')
            .select('id, userid, company, position, status')
            .limit(100);

        if (applicationsError) {
            console.error('❌ Error fetching applications:', applicationsError.message);
        } else {
            if (!applications || applications.length === 0) {
                console.log('📋 No applications found');
            } else {
                console.log(`📋 Found ${applications.length} applications:`);
                
                // Group by user
                const userAppCounts = {};
                applications.forEach(app => {
                    const userId = app.userid;
                    if (!userAppCounts[userId]) {
                        userAppCounts[userId] = 0;
                    }
                    userAppCounts[userId]++;
                });

                Object.entries(userAppCounts).forEach(([userId, count]) => {
                    console.log(`   User ${userId}: ${count} applications`);
                });
            }
        }

        console.log('\n🎯 Summary:');
        console.log(`   - Total achievements defined: ${achievements?.length || 0}`);
        console.log(`   - Total achievements unlocked: ${userAchievements?.length || 0}`);
        console.log(`   - Total user stats records: ${userStats?.length || 0}`);
        console.log(`   - Total applications: ${applications?.length || 0}`);

    } catch (error) {
        console.error('❌ Check failed:', error.message);
    }
}

// Run the check
checkDatabaseAchievements();
