// @ts-ignore - Deno import, works in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
// @ts-ignore - Deno import, works in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WeeklyDigestData {
  // Goal tracking
  applicationsSubmitted: number;
  weeklyGoal: number;
  goalProgress: number;
  goalAchieved: boolean;
  
  // Performance metrics
  interviewsScheduled: number;
  followUpsSent: number;
  successRate: number;
  averageResponseTime: number;
  topPerformingSource: string;
  
  // Achievements
  achievementsUnlocked: any[];
  totalAchievements: number;
  totalXp: number;
  level: number;
  levelProgress: number;
  
  // Follow-ups needed
  pendingFollowups: any[];
  
  // Tips and insights
  weeklyTip: {
    title: string;
    content: string;
    icon: string;
  };
  
  // Analytics highlights
  applicationsThisMonth: number;
  applicationsLastMonth: number;
  monthlyGrowth: number;
  bestPerformingDay: string;
  bestPerformingTime: string;
}

// Enhanced weekly digest email template
function renderWeeklyDigestHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    data,
    weekNumber 
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    data: WeeklyDigestData;
    weekNumber: number;
}) {
    const progressColor = data.goalProgress >= 100 ? '#10b981' : 
                         data.goalProgress >= 75 ? '#f59e0b' : 
                         data.goalProgress >= 50 ? '#f97316' : '#ef4444';
    
    const progressEmoji = data.goalProgress >= 100 ? '🎉' : 
                         data.goalProgress >= 75 ? '🔥' : 
                         data.goalProgress >= 50 ? '💪' : '📈';

    const achievementCards = data.achievementsUnlocked.slice(0, 3).map(achievement => {
        const rarityColors = {
            'common': '#6b7280',
            'uncommon': '#10b981', 
            'rare': '#3b82f6',
            'epic': '#8b5cf6',
            'legendary': '#f59e0b'
        };
        const color = rarityColors[achievement.rarity as keyof typeof rarityColors] || '#6b7280';
        return `
            <div class="achievement-card" style="border-color: ${color}40; background: linear-gradient(135deg, ${color}10 0%, ${color}05 100%);">
                <span class="achievement-emoji">${achievement.icon}</span>
                <h4 class="achievement-title">${achievement.name}</h4>
                <div class="achievement-xp" style="color: ${color};">+${achievement.xpReward} XP</div>
            </div>
        `;
    }).join('');

    const followupCards = data.pendingFollowups.slice(0, 3).map(app => {
        const daysSinceApplied = Math.floor((Date.now() - new Date(app.dateApplied).getTime()) / (1000 * 60 * 60 * 24));
        return `
            <div class="followup-card">
                <div class="followup-company">${app.company}</div>
                <div class="followup-position">${app.position}</div>
                <div class="followup-days">${daysSinceApplied} days ago</div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    .wrap { width:100%; table-layout:fixed; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding:32px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); text-align:center; padding:32px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .section { margin:24px 0; }
    .goal-section { background:linear-gradient(135deg, ${progressColor}10 0%, ${progressColor}05 100%); border:1px solid ${progressColor}40; border-radius:16px; padding:24px; margin:24px 0; text-align:center; }
    .goal-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
    .goal-progress { font:700 36px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:${progressColor}; margin:0 0 8px; }
    .goal-text { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#4b5563; margin:0; }
    .progress-bar { background:#e5e7eb; border-radius:12px; height:12px; margin:16px 0; overflow:hidden; }
    .progress-fill { background:${progressColor}; height:100%; border-radius:12px; transition:width 0.3s ease; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#f59e0b; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .achievements-section { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:16px; padding:24px; margin:24px 0; }
    .achievements-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0 0 16px; display:flex; align-items:center; }
    .achievements-icon { font-size:20px; margin-right:8px; }
    .achievements-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin:16px 0; }
    .achievement-card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .achievement-emoji { font-size:24px; margin-bottom:8px; display:block; }
    .achievement-title { font:600 14px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:0 0 4px; }
    .achievement-xp { font:600 12px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#f59e0b; margin:0; }
    .tip-section { background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border:1px solid #f59e0b; border-radius:16px; padding:24px; margin:24px 0; }
    .tip-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0 0 16px; display:flex; align-items:center; }
    .tip-icon { font-size:20px; margin-right:8px; }
    .tip-content { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0; }
    .followup-section { background:linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border:1px solid #ef4444; border-radius:16px; padding:24px; margin:24px 0; }
    .followup-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#dc2626; margin:0 0 16px; display:flex; align-items:center; }
    .followup-icon { font-size:20px; margin-right:8px; }
    .followup-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin:16px 0; }
    .followup-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .followup-company { font:600 14px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:0 0 4px; }
    .followup-position { font:500 12px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#4b5563; margin:0 0 4px; }
    .followup-days { font:500 11px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ef4444; background:#fef2f2; padding:2px 6px; border-radius:4px; display:inline-block; }
    .analytics-section { background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border:1px solid #22c55e; border-radius:16px; padding:24px; margin:24px 0; }
    .analytics-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#166534; margin:0 0 16px; display:flex; align-items:center; }
    .analytics-icon { font-size:20px; margin-right:8px; }
    .analytics-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:16px; margin:16px 0; }
    .analytics-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .analytics-number { font:700 20px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#22c55e; margin:0 0 4px; }
    .analytics-label { font:500 12px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#0ea5e9; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .stats-grid { grid-template-columns:1fr; gap:12px; }
      .achievements-grid { grid-template-columns:1fr; gap:12px; }
      .followup-grid { grid-template-columns:1fr; gap:12px; }
      .analytics-grid { grid-template-columns:1fr; gap:12px; }
      .h1 { font-size:24px; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="header">
          <img src="${logoUrl}" width="56" height="56" class="logo" alt="ApplyTrak logo" style="display:block;">
          <p class="brand">ApplyTrak</p>
          <p class="tagline">Your Weekly Job Search Digest</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">📊 Week ${weekNumber} Summary</h1>
          
          <p>Hi ${name}! Here's your comprehensive weekly job search digest with everything you need to know:</p>
          
          <!-- Goal Progress Section -->
          <div class="goal-section">
            <h2 class="goal-title">${data.goalAchieved ? '🎉 Goal Achieved!' : '📈 Goal Progress'}</h2>
            <div class="goal-progress">${data.goalProgress}% ${progressEmoji}</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width:${data.goalProgress > 100 ? 100 : data.goalProgress}%;"></div>
            </div>
            <p class="goal-text">You've submitted ${data.applicationsSubmitted} out of ${data.weeklyGoal} applications this week.</p>
          </div>
          
          <!-- Performance Stats -->
          <h2 class="h2">📈 This Week's Performance</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${data.interviewsScheduled}</div>
              <div class="stat-label">Interviews Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.followUpsSent}</div>
              <div class="stat-label">Follow-ups Sent</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.successRate}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${data.averageResponseTime} days</div>
              <div class="stat-label">Avg. Response Time</div>
            </div>
          </div>
          
          ${data.topPerformingSource ? `
          <div class="tip-section">
            <h3 class="tip-title">
              <span class="tip-icon">💡</span>
              Top Performing Source
            </h3>
            <p class="tip-content">Your applications from <strong>${data.topPerformingSource}</strong> are yielding the best results. Consider focusing more efforts there!</p>
          </div>
          ` : ''}
          
          <!-- Achievements Section -->
          ${data.achievementsUnlocked.length > 0 ? `
          <div class="achievements-section">
            <h3 class="achievements-title">
              <span class="achievements-icon">🏆</span>
              Achievements Unlocked This Week
            </h3>
            <div class="achievements-grid">
              ${achievementCards}
            </div>
            ${data.achievementsUnlocked.length > 3 ? `
            <p style="text-align:center; color:#0c4a6e; font-style:italic; margin-top:12px;">
              ... and ${data.achievementsUnlocked.length - 3} more achievements!
            </p>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- Follow-up Reminders -->
          ${data.pendingFollowups.length > 0 ? `
          <div class="followup-section">
            <h3 class="followup-title">
              <span class="followup-icon">⏰</span>
              Follow-up Reminders
            </h3>
            <p style="color:#dc2626; margin:0 0 16px;">You have ${data.pendingFollowups.length} applications that could benefit from a follow-up:</p>
            <div class="followup-grid">
              ${followupCards}
            </div>
            ${data.pendingFollowups.length > 3 ? `
            <p style="text-align:center; color:#dc2626; font-style:italic; margin-top:12px;">
              ... and ${data.pendingFollowups.length - 3} more applications
            </p>
            ` : ''}
          </div>
          ` : ''}
          
          <!-- Weekly Tip -->
          <div class="tip-section">
            <h3 class="tip-title">
              <span class="tip-icon">${data.weeklyTip.icon}</span>
              ${data.weeklyTip.title}
            </h3>
            <p class="tip-content">${data.weeklyTip.content}</p>
          </div>
          
          <!-- Analytics Highlights -->
          <div class="analytics-section">
            <h3 class="analytics-title">
              <span class="analytics-icon">📊</span>
              Analytics Highlights
            </h3>
            <div class="analytics-grid">
              <div class="analytics-card">
                <div class="analytics-number">${data.applicationsThisMonth}</div>
                <div class="analytics-label">This Month</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-number">${data.monthlyGrowth > 0 ? '+' : ''}${data.monthlyGrowth}%</div>
                <div class="analytics-label">vs Last Month</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-number">${data.totalAchievements}</div>
                <div class="analytics-label">Total Achievements</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-number">Level ${data.level}</div>
                <div class="analytics-label">Current Level</div>
              </div>
            </div>
            ${data.bestPerformingDay ? `
            <p style="color:#166534; margin:16px 0 0; text-align:center; font-size:14px;">
              💡 <strong>Pro Tip:</strong> Your best performing day is <strong>${data.bestPerformingDay}</strong> at <strong>${data.bestPerformingTime}</strong>
            </p>
            ` : ''}
          </div>
          
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">View Full Analytics & Achievements →</a>
          </div>
          
        </td></tr>
        <tr><td class="footer">
          <p><strong>ApplyTrak Team</strong></p>
          <p style="margin-top:16px;">
            <a href="${settingsUrl}">Manage Email Preferences</a> • 
            <a href="https://applytrak.com">Visit ApplyTrak</a>
          </p>
          <p style="font-size:11px; margin-top:12px; color:#9ca3af;">
            You're receiving this because you have weekly goals enabled in ApplyTrak.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// Get comprehensive weekly digest data
async function getWeeklyDigestData(userId: number, supabaseClient: any): Promise<WeeklyDigestData> {
    // Get current week (Monday to Sunday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Get user's goals
    const { data: goals } = await supabaseClient
        .from("goals")
        .select("*")
        .eq("userid", userId)
        .single();

    // Get applications for current week
    const { data: weekApplications } = await supabaseClient
        .from("applications")
        .select("*")
        .eq("userid", userId)
        .gte("createdAt", weekStart.toISOString())
        .lte("createdAt", weekEnd.toISOString());

    // Get all applications for analytics
    const { data: allApplications } = await supabaseClient
        .from("applications")
        .select("*")
        .eq("userid", userId);

    // Get user stats
    const { data: userStats } = await supabaseClient
        .from("user_stats")
        .select("*")
        .eq("user_id", userId)
        .single();

    // Get achievements unlocked this week
    const { data: weeklyAchievements } = await supabaseClient
        .from("user_achievements")
        .select(`
            *,
            achievements (
                name,
                description,
                icon,
                rarity,
                xpReward
            )
        `)
        .eq("user_id", userId)
        .gte("unlocked_at", weekStart.toISOString());

    // Get applications needing follow-up (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: pendingFollowups } = await supabaseClient
        .from("applications")
        .select("*")
        .eq("userid", userId)
        .eq("status", "Applied")
        .lt("dateApplied", sevenDaysAgo.toISOString())
        .order("dateApplied", { ascending: false });

    // Calculate goal progress
    const weeklyGoal = goals?.weeklyGoal || 5;
    const applicationsSubmitted = weekApplications?.length || 0;
    const goalProgress = Math.round((applicationsSubmitted / weeklyGoal) * 100);
    const goalAchieved = applicationsSubmitted >= weeklyGoal;

    // Calculate performance metrics
    const interviewsScheduled = weekApplications?.filter(app => app.status === 'Interview Scheduled').length || 0;
    const followUpsSent = weekApplications?.filter(app => app.notes && app.notes.toLowerCase().includes('follow')).length || 0;
    
    // Calculate success rate
    const totalApps = allApplications?.length || 0;
    const successfulApps = allApplications?.filter(app => 
        ['Interview Scheduled', 'Offer Received', 'Accepted'].includes(app.status)
    ).length || 0;
    const successRate = totalApps > 0 ? Math.round((successfulApps / totalApps) * 100) : 0;

    // Calculate average response time
    const respondedApps = allApplications?.filter(app => 
        app.status !== 'Applied' && app.updatedAt && app.dateApplied
    ) || [];
    
    let totalResponseTime = 0;
    let responseCount = 0;
    
    respondedApps.forEach(app => {
        const appliedDate = new Date(app.dateApplied);
        const updatedDate = new Date(app.updatedAt);
        const responseTime = Math.floor((updatedDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
        if (responseTime > 0) {
            totalResponseTime += responseTime;
            responseCount++;
        }
    });
    
    const averageResponseTime = responseCount > 0 ? Math.round(totalResponseTime / responseCount) : 0;

    // Find top performing source
    const sourceCounts = {};
    allApplications?.forEach(app => {
        if (app.jobSource) {
            sourceCounts[app.jobSource] = (sourceCounts[app.jobSource] || 0) + 1;
        }
    });
    
    const topPerformingSource = Object.keys(sourceCounts).reduce((a, b) => 
        sourceCounts[a] > sourceCounts[b] ? a : b, null
    );

    // Get monthly analytics
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const lastMonthStart = new Date(monthStart);
    lastMonthStart.setMonth(monthStart.getMonth() - 1);
    
    const lastMonthEnd = new Date(monthStart);
    lastMonthEnd.setDate(0);
    lastMonthEnd.setHours(23, 59, 59, 999);

    const applicationsThisMonth = allApplications?.filter(app => 
        new Date(app.createdAt) >= monthStart
    ).length || 0;

    const applicationsLastMonth = allApplications?.filter(app => {
        const appDate = new Date(app.createdAt);
        return appDate >= lastMonthStart && appDate <= lastMonthEnd;
    }).length || 0;

    const monthlyGrowth = applicationsLastMonth > 0 ? 
        Math.round(((applicationsThisMonth - applicationsLastMonth) / applicationsLastMonth) * 100) : 0;

    // Find best performing day and time
    const dayCounts = {};
    const timeCounts = {};
    
    allApplications?.forEach(app => {
        const appDate = new Date(app.createdAt);
        const dayName = appDate.toLocaleDateString('en-US', { weekday: 'long' });
        const hour = appDate.getHours();
        const timeSlot = hour < 12 ? 'Morning' : hour < 17 ? 'Afternoon' : 'Evening';
        
        dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
        timeCounts[timeSlot] = (timeCounts[timeSlot] || 0) + 1;
    });
    
    const bestPerformingDay = Object.keys(dayCounts).reduce((a, b) => 
        dayCounts[a] > dayCounts[b] ? a : b, null
    );
    
    const bestPerformingTime = Object.keys(timeCounts).reduce((a, b) => 
        timeCounts[a] > timeCounts[b] ? a : b, null
    );

    // Weekly tips
    const tips = [
        {
            title: "Customize Your Applications",
            content: "Tailor your resume and cover letter for each position. Highlight relevant skills and experiences that match the job requirements.",
            icon: "🎯"
        },
        {
            title: "Follow Up Strategically",
            content: "Send follow-up emails 7-10 days after applying. Be polite, reference the position, and add value by sharing relevant updates.",
            icon: "📧"
        },
        {
            title: "Network Actively",
            content: "Connect with employees at target companies on LinkedIn. Engage with their content and reach out with genuine questions about their work.",
            icon: "🤝"
        },
        {
            title: "Track Your Progress",
            content: "Use ApplyTrak to monitor your application success rates, identify patterns, and optimize your job search strategy.",
            icon: "📊"
        },
        {
            title: "Stay Consistent",
            content: "Apply to 3-5 jobs daily rather than applying to 20+ jobs once a week. Consistency beats intensity in job searching.",
            icon: "⏰"
        }
    ];
    
    const weeklyTip = tips[Math.floor(Math.random() * tips.length)];

    // Calculate level progress
    const currentLevelXp = userStats?.level * 100 || 0;
    const nextLevelXp = (userStats?.level + 1) * 100;
    const levelProgress = userStats?.totalXp ? 
        Math.min(100, Math.round(((userStats.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)) : 0;

    return {
        // Goal tracking
        applicationsSubmitted,
        weeklyGoal,
        goalProgress,
        goalAchieved,
        
        // Performance metrics
        interviewsScheduled,
        followUpsSent,
        successRate,
        averageResponseTime,
        topPerformingSource,
        
        // Achievements
        achievementsUnlocked: weeklyAchievements?.map(ua => ua.achievements) || [],
        totalAchievements: userStats?.totalAchievements || 0,
        totalXp: userStats?.totalXp || 0,
        level: userStats?.level || 1,
        levelProgress,
        
        // Follow-ups needed
        pendingFollowups: pendingFollowups || [],
        
        // Tips and insights
        weeklyTip,
        
        // Analytics highlights
        applicationsThisMonth,
        applicationsLastMonth,
        monthlyGrowth,
        bestPerformingDay,
        bestPerformingTime
    };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { email, name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email and name are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SB_URL') ?? '',
      Deno.env.get('SB_SERVICE_ROLE_KEY') ?? ''
    )

    // Get user
    const { data: user } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get comprehensive weekly digest data
    const data = await getWeeklyDigestData(user.id, supabaseClient);

    // Calculate current week number
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const weekNumber = Math.ceil((Date.now() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));

    // Generate URLs
    const baseUrl = 'https://applytrak.com'
    const logoUrl = `${baseUrl}/logo192.png`
    const ctaUrl = `${baseUrl}/#analytics`
    const settingsUrl = `${baseUrl}/#profile`

    const htmlContent = renderWeeklyDigestHTML({
      name: name || 'there',
      logoUrl,
      ctaUrl,
      settingsUrl,
      data,
      weekNumber
    })

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")
    
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY not found')
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ApplyTrak <weekly@applytrak.com>",
        to: email,
        subject: `📊 Your Week ${weekNumber} Job Search Digest - ApplyTrak`,
        html: htmlContent,
      }),
    });

    const body = await r.text();
    console.log(`Resend API Response for ${email}:`, r.status, body);
    
    if (!r.ok) {
      console.error("Resend error", r.status, body);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to send email',
          details: body,
          status: r.status,
          email: email
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Weekly digest email sent successfully',
        email: email
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})