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

interface MonthlyAnalytics {
    month: string;
    applicationsSubmitted: number;
    interviewsScheduled: number;
    offersReceived: number;
    rejectionsReceived: number;
    averageResponseTime: number;
    topJobSources: Array<{ source: string; count: number; successRate: number }>;
    statusBreakdown: Record<string, number>;
    goalAchievement: number;
    improvementAreas: string[];
    recommendations: string[];
    trends: {
        applicationsTrend: 'up' | 'down' | 'stable';
        interviewsTrend: 'up' | 'down' | 'stable';
        successRateTrend: 'up' | 'down' | 'stable';
    };
}

// Monthly analytics report email template
function renderMonthlyAnalyticsHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    analytics
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    analytics: MonthlyAnalytics;
}) {
    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'up': return '📈';
            case 'down': return '📉';
            default: return '➡️';
        }
    };

    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'up': return '#10b981';
            case 'down': return '#ef4444';
            default: return '#6b7280';
        }
    };

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
    .summary-card { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:16px; padding:24px; margin:24px 0; }
    .summary-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0 0 16px; }
    .summary-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
    .summary-item { text-align:center; }
    .summary-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0ea5e9; margin:0 0 4px; }
    .summary-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .trend-indicator { font-size:16px; margin-left:8px; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0ea5e9; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .source-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin:12px 0; }
    .source-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; }
    .source-name { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; }
    .source-stats { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; }
    .source-bar { background:#e5e7eb; border-radius:8px; height:8px; margin-top:8px; overflow:hidden; }
    .source-fill { background:#0ea5e9; height:100%; border-radius:8px; }
    .recommendation-card { background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border:1px solid #f59e0b; border-radius:12px; padding:20px; margin:16px 0; }
    .recommendation-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0 0 8px; }
    .recommendation-text { font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0; }
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
      .stats-grid, .summary-grid { grid-template-columns:1fr; gap:12px; }
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
          <p class="tagline">${analytics.month} Analytics Report</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Your ${analytics.month} Job Search Report, ${name}! <span class="emoji">📊</span></h1>
          <p>Here's a comprehensive overview of your job search performance this month, with insights to help you optimize your strategy.</p>
          
          <div class="summary-card">
            <div class="summary-title">📈 Monthly Summary</div>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-number">
                  ${analytics.applicationsSubmitted}
                  <span class="trend-indicator" style="color: ${getTrendColor(analytics.trends.applicationsTrend)};">
                    ${getTrendIcon(analytics.trends.applicationsTrend)}
                  </span>
                </div>
                <div class="summary-label">Applications</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">
                  ${analytics.interviewsScheduled}
                  <span class="trend-indicator" style="color: ${getTrendColor(analytics.trends.interviewsTrend)};">
                    ${getTrendIcon(analytics.trends.interviewsTrend)}
                  </span>
                </div>
                <div class="summary-label">Interviews</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${analytics.offersReceived}</div>
                <div class="summary-label">Offers</div>
              </div>
              <div class="summary-item">
                <div class="summary-number">${analytics.averageResponseTime}</div>
                <div class="summary-label">Avg Response (days)</div>
              </div>
            </div>
          </div>

          <h2 class="h2">📊 Performance Metrics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${analytics.goalAchievement}%</div>
              <div class="stat-label">Goal<br>Achievement</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${analytics.rejectionsReceived}</div>
              <div class="stat-label">Rejections<br>Received</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${Math.round((analytics.interviewsScheduled / Math.max(analytics.applicationsSubmitted, 1)) * 100)}%</div>
              <div class="stat-label">Interview<br>Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${Math.round((analytics.offersReceived / Math.max(analytics.interviewsScheduled, 1)) * 100)}%</div>
              <div class="stat-label">Offer<br>Rate</div>
            </div>
          </div>

          <h2 class="h2">🎯 Top Job Sources</h2>
          ${analytics.topJobSources.map(source => `
          <div class="source-card">
            <div class="source-header">
              <div class="source-name">${source.source}</div>
              <div class="source-stats">${source.count} apps • ${source.successRate}% success</div>
            </div>
            <div class="source-bar">
              <div class="source-fill" style="width: ${source.successRate}%"></div>
            </div>
          </div>
          `).join('')}

          <h2 class="h2">💡 Recommendations</h2>
          ${analytics.recommendations.map(rec => `
          <div class="recommendation-card">
            <div class="recommendation-title">🎯 Action Item</div>
            <div class="recommendation-text">${rec}</div>
          </div>
          `).join('')}

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">View Detailed Analytics →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <div style="margin-bottom:12px;">
            <strong>ApplyTrak</strong> · Your job search analytics partner
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

async function getMonthlyAnalytics(userId: number): Promise<MonthlyAnalytics> {
    // Get current month
    const now = new Date();
    const month = now.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Get applications for current month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const { data: applications } = await supabase
        .from("applications")
        .select("*")
        .eq("userid", userId)
        .gte("createdAt", startOfMonth.toISOString());

    const apps = applications || [];
    const applicationsSubmitted = apps.length;
    const interviewsScheduled = apps.filter(app => app.status === 'Interview').length;
    const offersReceived = apps.filter(app => app.status === 'Offer').length;
    const rejectionsReceived = apps.filter(app => app.status === 'Rejected').length;
    
    // Calculate average response time (mock data)
    const averageResponseTime = Math.round(Math.random() * 7) + 1;
    
    // Get top job sources
    const sourceCounts: Record<string, { count: number; interviews: number }> = {};
    apps.forEach(app => {
        if (app.jobSource) {
            if (!sourceCounts[app.jobSource]) {
                sourceCounts[app.jobSource] = { count: 0, interviews: 0 };
            }
            sourceCounts[app.jobSource].count++;
            if (app.status === 'Interview') {
                sourceCounts[app.jobSource].interviews++;
            }
        }
    });
    
    const topJobSources = Object.entries(sourceCounts)
        .map(([source, data]) => ({
            source,
            count: data.count,
            successRate: Math.round((data.interviews / data.count) * 100)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
    
    // Status breakdown
    const statusBreakdown = {
        Applied: apps.filter(app => app.status === 'Applied').length,
        Interview: interviewsScheduled,
        Offer: offersReceived,
        Rejected: rejectionsReceived
    };
    
    // Mock goal achievement
    const goalAchievement = Math.round(Math.random() * 40) + 60; // 60-100%
    
    // Generate recommendations based on data
    const recommendations = [];
    if (applicationsSubmitted < 10) {
        recommendations.push("Increase your application volume to improve your chances. Aim for at least 10-15 applications per month.");
    }
    if (interviewsScheduled === 0 && applicationsSubmitted > 5) {
        recommendations.push("Consider reviewing your resume and cover letter. Your application-to-interview rate suggests room for improvement.");
    }
    if (offersReceived === 0 && interviewsScheduled > 2) {
        recommendations.push("Focus on interview preparation. Practice common questions and consider mock interviews to improve your success rate.");
    }
    if (topJobSources.length > 0 && topJobSources[0].successRate < 20) {
        recommendations.push(`Focus more on ${topJobSources[0].source} as it's your most active source, but work on improving your success rate there.`);
    }
    
    // Mock trends
    const trends = {
        applicationsTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        interviewsTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable',
        successRateTrend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    };

    return {
        month,
        applicationsSubmitted,
        interviewsScheduled,
        offersReceived,
        rejectionsReceived,
        averageResponseTime,
        topJobSources,
        statusBreakdown,
        goalAchievement,
        improvementAreas: [],
        recommendations,
        trends
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

        // Get monthly analytics
        const analytics = await getMonthlyAnalytics(user.id);

        const settingsUrl = user.externalid
            ? `${PREFS_ENDPOINT}?eid=${user.externalid}`
            : CTA_URL;

        const html = renderMonthlyAnalyticsHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
            analytics
        });

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <analytics@resend.dev>",
                to: email,
                subject: `📊 ${analytics.month} Job Search Report - Your performance insights`,
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
        return new Response("Failed to send monthly analytics email", { status: 500 });
    }
});
