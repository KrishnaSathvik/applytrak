// Script to check what achievements are currently unlocked in the database
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUnlockedAchievements() {
  try {
    console.log('🔍 Checking unlocked achievements in database...\n');

    // First, get all users and their application counts
    console.log('📊 User Application Counts:');
    const { data: userStats, error: userStatsError } = await supabase
      .from('user_stats')
      .select('user_id, application_count')
      .order('application_count', { ascending: false });

    if (userStatsError) {
      console.error('❌ Error fetching user stats:', userStatsError);
      return;
    }

    userStats.forEach(user => {
      console.log(`   User ${user.user_id}: ${user.application_count} applications`);
    });

    console.log('\n🏆 Unlocked Achievements by User:');

    // For each user, check their unlocked achievements
    for (const user of userStats) {
      console.log(`\n👤 User ${user.user_id} (${user.application_count} applications):`);
      
      const { data: unlockedAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          unlocked_at,
          achievements (
            id,
            name,
            category,
            tier,
            requirements
          )
        `)
        .eq('user_id', user.user_id)
        .order('unlocked_at', { ascending: true });

      if (achievementsError) {
        console.error(`❌ Error fetching achievements for user ${user.user_id}:`, achievementsError);
        continue;
      }

      if (unlockedAchievements.length === 0) {
        console.log('   No achievements unlocked');
        continue;
      }

      unlockedAchievements.forEach(ua => {
        const achievement = ua.achievements;
        console.log(`   ✅ ${achievement.name} (${achievement.category}/${achievement.tier})`);
        console.log(`      Requirements: ${achievement.requirements}`);
        console.log(`      Unlocked: ${new Date(ua.unlocked_at).toLocaleString()}`);
      });
    }

    // Check for problematic achievements (should not be unlocked with current application counts)
    console.log('\n🚨 Checking for problematic achievements...');
    
    for (const user of userStats) {
      const { data: problematicAchievements, error: probError } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          achievements (
            name,
            requirements
          )
        `)
        .eq('user_id', user.user_id)
        .in('achievement_id', [
          'application-master',      // 100+ applications
          'job-search-legend',       // 500+ applications  
          'legendary-job-seeker',    // 1000+ applications
          'streak-master',           // 30-day streak
          'streak-legend'           // 30-day streak
        ]);

      if (probError) {
        console.error(`❌ Error checking problematic achievements:`, probError);
        continue;
      }

      if (problematicAchievements.length > 0) {
        console.log(`\n⚠️  User ${user.user_id} has ${user.application_count} applications but unlocked:`);
        problematicAchievements.forEach(pa => {
          console.log(`   ❌ ${pa.achievements.name} (${pa.achievements.requirements})`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUnlockedAchievements();
