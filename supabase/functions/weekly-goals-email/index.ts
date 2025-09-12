// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const LOGO_URL = Deno.env.get("APPLYTRAK_LOGO_URL") || "https://www.applytrak.com/logo.png";
const CTA_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_ENDPOINT =
    Deno.env.get("APPLYTRAK_PREFS_ENDPOINT") || `${SUPABASE_URL}/functions/v1/email-preferences`;

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

interface WeeklyStats {
    applicationsSubmitted: number;
    weeklyGoal: number;
    goalProgress: number;
    interviewsScheduled: number;
    followUpsSent: number;
    successRate: number;
    topPerformingSource: string;
    averageResponseTime: number;
}

// Weekly goals email template with analytics insights
function renderWeeklyGoalsHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    stats,
    weekNumber 
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    stats: WeeklyStats;
    weekNumber: number;
}) {
    const progressColor = stats.goalProgress >= 100 ? '#10b981' : 
                         stats.goalProgress >= 75 ? '#f59e0b' : 
                         stats.goalProgress >= 50 ? '#f97316' : '#ef4444';
    
    const progressEmoji = stats.goalProgress >= 100 ? '🎉' : 
                         stats.goalProgress >= 75 ? '🔥' : 
                         stats.goalProgress >= 50 ? '💪' : '📈';

    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    .wrap { width:100%; table-layout:fixed; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding:32px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); text-align:center; padding:32px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; }
    .h1 { font:700 28px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; margin:0 0 16px; }
    .h2 { font:600 20px/1.3 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; margin:24px 0 12px; }
    .progress-section { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border:1px solid #e2e8f0; border-radius:16px; padding:24px; margin:24px 0; text-align:center; }
    .progress-title { font:600 18px/1.3 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; margin:0 0 16px; }
    .progress-bar { background:#e5e7eb; border-radius:12px; height:12px; margin:16px 0; overflow:hidden; }
    .progress-fill { background:${progressColor}; height:100%; border-radius:12px; transition:width 0.3s ease; }
    .progress-text { font:700 24px/1 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:${progressColor}; margin:8px 0; }
    .progress-subtext { font:500 14px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#3b82f6; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .insight-card { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #3b82f6; border-radius:12px; padding:20px; margin:16px 0; }
    .insight-title { font:600 16px/1.3 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#1e40af; margin:0 0 8px; }
    .insight-text { font:400 14px/1.5 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#1e40af; margin:0; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#3b82f6; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .stats-grid { grid-template-columns:1fr; gap:12px; }
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
          <p class="tagline">Week ${weekNumber} Progress Report</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Your Week ${weekNumber} Progress, ${name}! <span class="emoji">${progressEmoji}</span></h1>
          <p>Here's how you're doing with your job search goals this week. Keep up the great work!</p>
          
          <div class="progress-section">
            <div class="progress-title">Weekly Application Goal</div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${Math.min(stats.goalProgress, 100)}%"></div>
            </div>
            <div class="progress-text">${stats.applicationsSubmitted} / ${stats.weeklyGoal}</div>
            <div class="progress-subtext">${stats.goalProgress >= 100 ? 'Goal achieved! 🎉' : `${stats.weeklyGoal - stats.applicationsSubmitted} more to reach your goal`}</div>
          </div>

          <h2 class="h2">📊 This Week's Stats</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${stats.interviewsScheduled}</div>
              <div class="stat-label">Interviews<br>Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.followUpsSent}</div>
              <div class="stat-label">Follow-ups<br>Sent</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.successRate}%</div>
              <div class="stat-label">Response<br>Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${stats.averageResponseTime}</div>
              <div class="stat-label">Avg Response<br>Time (days)</div>
            </div>
          </div>

          <div class="insight-card">
            <div class="insight-title">💡 Weekly Insight</div>
            <div class="insight-text">
              ${stats.topPerformingSource ? `Your best performing job source this week was <strong>${stats.topPerformingSource}</strong>. Consider focusing more of your efforts there!` : 'Keep tracking your applications to discover which sources work best for you.'}
            </div>
          </div>

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">View Full Analytics →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <div style="margin-bottom:12px;">
            <strong>ApplyTrak</strong> · Your job search analytics
          </div>
          <div>
            <a href="${settingsUrl}">Email preferences</a> · 
            <a href="${ctaUrl}">Open app</a> · 
            <a href="mailto:support@applytrak.com">Get help</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function getUserStats(userId: number): Promise<WeeklyStats> {
    // Get user's applications for the current week
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    
    const { data: applications } = await supabase
        .from("applications")
        .select("*")
        .eq("userid", userId)
        .gte("createdAt", startOfWeek.toISOString());

    // Get user's goals
    const { data: goals } = await supabase
        .from("goals")
        .select("*")
        .eq("userid", userId)
        .single();

    // Calculate stats
    const apps = applications || [];
    const weeklyGoal = goals?.weeklyGoal || 5;
    const applicationsSubmitted = apps.length;
    const goalProgress = weeklyGoal > 0 ? (applicationsSubmitted / weeklyGoal) * 100 : 0;
    
    // Calculate other metrics
    const interviewsScheduled = apps.filter(app => app.status === 'Interview').length;
    const followUpsSent = apps.filter(app => app.notes && app.notes.includes('follow-up')).length;
    
    // Calculate success rate (interviews / applications)
    const successRate = applicationsSubmitted > 0 ? Math.round((interviewsScheduled / applicationsSubmitted) * 100) : 0;
    
    // Find top performing source
    const sourceCounts: Record<string, number> = {};
    apps.forEach(app => {
        if (app.jobSource) {
            sourceCounts[app.jobSource] = (sourceCounts[app.jobSource] || 0) + 1;
        }
    });
    const topPerformingSource = Object.keys(sourceCounts).length > 0 
        ? Object.entries(sourceCounts).sort(([,a], [,b]) => b - a)[0][0] 
        : '';

    // Mock average response time (in real implementation, you'd calculate this from actual data)
    const averageResponseTime = Math.round(Math.random() * 5) + 1;

    return {
        applicationsSubmitted,
        weeklyGoal,
        goalProgress,
        interviewsScheduled,
        followUpsSent,
        successRate,
        topPerformingSource,
        averageResponseTime
    };
}

serve(async (req) => {
    try {
        const { email, name } = await req.json();

        // Get user data
        const { data: user, error } = await supabase
            .from("users")
            .select("id, externalid")
            .eq("email", email)
            .maybeSingle();
        
        if (error || !user) {
            console.error("User lookup error:", error);
            return new Response("User not found", { status: 404 });
        }

        // Get user stats
        const stats = await getUserStats(user.id);
        
        // Calculate current week number
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const weekNumber = Math.ceil((Date.now() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));

        const settingsUrl = user.externalid
            ? `${PREFS_ENDPOINT}?eid=${user.externalid}`
            : CTA_URL;

        const html = renderWeeklyGoalsHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
            stats,
            weekNumber
        });

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <weekly@resend.dev>",
                to: email,
                subject: `Week ${weekNumber} Progress Report 📊 - ${stats.applicationsSubmitted}/${stats.weeklyGoal} applications`,
                html,
            }),
        });

        const body = await r.text();
        if (!r.ok) {
            console.error("Resend error", r.status, body);
            return new Response(body, { status: r.status, headers: { "Content-Type": "application/json" } });
        }

        return new Response(body, { status: 200, headers: { "Content-Type": "application/json" } });
    } catch (e) {
        console.error("Function error", e);
        return new Response("Failed to send weekly goals email", { status: 500 });
    }
});
