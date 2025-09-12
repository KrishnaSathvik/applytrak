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

interface UserInsights {
    totalApplications: number;
    averageResponseTime: number;
    topJobSources: string[];
    commonRejectionReasons: string[];
    interviewSuccessRate: number;
    lastActivityDays: number;
    needsFollowUpCount: number;
}

// Weekly tips email template with personalized insights
function renderWeeklyTipsHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    insights,
    tipOfTheWeek,
    weekNumber 
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    insights: UserInsights;
    tipOfTheWeek: string;
    weekNumber: number;
}) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    .wrap { width:100%; table-layout:fixed; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding:32px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); text-align:center; padding:32px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .tip-card { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:16px; padding:24px; margin:24px 0; }
    .tip-header { display:flex; align-items:center; margin-bottom:16px; }
    .tip-icon { font-size:24px; margin-right:12px; }
    .tip-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0; }
    .tip-content { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0; }
    .insights-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .insight-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .insight-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0ea5e9; margin:0 0 4px; }
    .insight-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .action-card { background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border:1px solid #f59e0b; border-radius:12px; padding:20px; margin:16px 0; }
    .action-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0 0 8px; }
    .action-text { font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(14, 165, 233, 0.2), 0 2px 4px -1px rgba(14, 165, 233, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#0ea5e9; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .insights-grid { grid-template-columns:1fr; gap:12px; }
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
          <p class="tagline">Week ${weekNumber} Job Search Tips</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Your Weekly Job Search Tips, ${name}! <span class="emoji">💡</span></h1>
          <p>Here are some personalized insights and tips to help you optimize your job search strategy this week.</p>
          
          <div class="tip-card">
            <div class="tip-header">
              <span class="tip-icon">🎯</span>
              <h2 class="tip-title">Tip of the Week</h2>
            </div>
            <div class="tip-content">
              ${tipOfTheWeek}
            </div>
          </div>

          <h2 class="h2">📊 Your Job Search Insights</h2>
          <div class="insights-grid">
            <div class="insight-card">
              <div class="insight-number">${insights.totalApplications}</div>
              <div class="insight-label">Total<br>Applications</div>
            </div>
            <div class="insight-card">
              <div class="insight-number">${insights.interviewSuccessRate}%</div>
              <div class="insight-label">Interview<br>Success Rate</div>
            </div>
            <div class="insight-card">
              <div class="insight-number">${insights.averageResponseTime}</div>
              <div class="insight-label">Avg Response<br>Time (days)</div>
            </div>
            <div class="insight-card">
              <div class="insight-number">${insights.needsFollowUpCount}</div>
              <div class="insight-label">Need<br>Follow-up</div>
            </div>
          </div>

          ${insights.topJobSources.length > 0 ? `
          <div class="action-card">
            <div class="action-title">🎯 Focus Your Efforts</div>
            <div class="action-text">
              Your best performing job sources: <strong>${insights.topJobSources.slice(0, 3).join(', ')}</strong>. 
              Consider allocating more time to these platforms this week.
            </div>
          </div>
          ` : ''}

          ${insights.lastActivityDays > 3 ? `
          <div class="action-card">
            <div class="action-title">⏰ Time to Re-engage</div>
            <div class="action-text">
              It's been ${insights.lastActivityDays} days since your last application. 
              Consider sending follow-ups to your recent applications to stay top of mind.
            </div>
          </div>
          ` : ''}

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Update Your Applications →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <div style="margin-bottom:12px;">
            <strong>ApplyTrak</strong> · Personalized job search insights
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

async function getUserInsights(userId: number): Promise<UserInsights> {
    // Get user's applications
    const { data: applications } = await supabase
        .from("applications")
        .select("*")
        .eq("userid", userId);

    const apps = applications || [];
    const totalApplications = apps.length;
    
    // Calculate interview success rate
    const interviews = apps.filter(app => app.status === 'Interview').length;
    const interviewSuccessRate = totalApplications > 0 ? Math.round((interviews / totalApplications) * 100) : 0;
    
    // Calculate average response time (mock data for now)
    const averageResponseTime = Math.round(Math.random() * 7) + 1;
    
    // Get top job sources
    const sourceCounts: Record<string, number> = {};
    apps.forEach(app => {
        if (app.jobSource) {
            sourceCounts[app.jobSource] = (sourceCounts[app.jobSource] || 0) + 1;
        }
    });
    const topJobSources = Object.entries(sourceCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([source]) => source);
    
    // Mock common rejection reasons
    const commonRejectionReasons = ['Experience mismatch', 'Position filled', 'Company restructuring'];
    
    // Calculate days since last activity
    const lastApp = apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const lastActivityDays = lastApp ? Math.floor((Date.now() - new Date(lastApp.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 0;
    
    // Count applications that need follow-up (older than 7 days without response)
    const needsFollowUpCount = apps.filter(app => {
        const daysSinceApplied = Math.floor((Date.now() - new Date(app.dateApplied).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceApplied > 7 && app.status === 'Applied';
    }).length;

    return {
        totalApplications,
        averageResponseTime,
        topJobSources,
        commonRejectionReasons,
        interviewSuccessRate,
        lastActivityDays,
        needsFollowUpCount
    };
}

function getTipOfTheWeek(insights: UserInsights): string {
    const tips = [
        "Customize your resume for each application by highlighting relevant keywords from the job description. This can improve your chances of passing ATS systems.",
        "Follow up on applications within 5-7 days. A polite follow-up email shows initiative and keeps you top of mind with hiring managers.",
        "Network actively on LinkedIn by connecting with employees at your target companies. Many jobs are filled through referrals before being posted publicly.",
        "Practice your elevator pitch and common interview questions. Recording yourself can help identify areas for improvement.",
        "Set aside dedicated time each day for job searching rather than sporadic efforts. Consistency is key to maintaining momentum.",
        "Track your applications and follow-ups systematically. This helps you stay organized and identify which strategies are working best.",
        "Consider informational interviews to learn more about companies and roles. They can lead to job opportunities and valuable insights.",
        "Optimize your LinkedIn profile with relevant keywords and a professional photo. Many recruiters use LinkedIn to find candidates.",
        "Join industry-specific groups and forums to stay updated on trends and potential opportunities in your field.",
        "Don't be afraid to apply for roles where you meet 70-80% of the requirements. Many companies are willing to train the right candidate."
    ];
    
    // Select tip based on user insights
    if (insights.needsFollowUpCount > 0) {
        return "You have several applications that could benefit from follow-up emails. Set aside 30 minutes today to send personalized follow-ups to applications older than 7 days. This simple action can significantly increase your response rate.";
    } else if (insights.lastActivityDays > 5) {
        return "It's been a few days since your last application. Consider dedicating 20-30 minutes today to apply to 2-3 new positions. Consistency in your job search efforts often leads to better results.";
    } else if (insights.interviewSuccessRate < 20) {
        return "Your interview success rate suggests room for improvement in your application materials. Consider having your resume reviewed by a professional or asking for feedback from successful job seekers in your network.";
    } else {
        return tips[Math.floor(Math.random() * tips.length)];
    }
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

        // Get user insights
        const insights = await getUserInsights(user.id);
        const tipOfTheWeek = getTipOfTheWeek(insights);
        
        // Calculate current week number
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const weekNumber = Math.ceil((Date.now() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));

        const settingsUrl = user.externalid
            ? `${PREFS_ENDPOINT}?eid=${user.externalid}`
            : CTA_URL;

        const html = renderWeeklyTipsHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
            insights,
            tipOfTheWeek,
            weekNumber
        });

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <tips@resend.dev>",
                to: email,
                subject: `Week ${weekNumber} Job Search Tips 💡 - Personalized insights for ${name}`,
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
        return new Response("Failed to send weekly tips email", { status: 500 });
    }
});
