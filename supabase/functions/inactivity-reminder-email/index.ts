// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const LOGO_URL = Deno.env.get("APPLYTRAK_LOGO_URL") || "https://ihlaenwiyxtmkehfoesg.supabase.co/storage/v1/object/public/assets/logo.png?cb=" + Date.now();
const CTA_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_ENDPOINT =
    Deno.env.get("APPLYTRAK_PREFS_ENDPOINT") || `${SUPABASE_URL}/functions/v1/email-preferences`;

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

interface InactivityData {
    daysInactive: number;
    lastActivity: string;
    pendingFollowUps: number;
    incompleteGoals: number;
    totalApplications: number;
    recentOpportunities: string[];
}

// Inactivity reminder email template
function renderInactivityReminderHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    inactivityData
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    inactivityData: InactivityData;
}) {
    const getInactivityMessage = (days: number) => {
        if (days >= 30) {
            return "It's been over a month since your last activity. Your job search momentum is important!";
        } else if (days >= 14) {
            return "It's been a couple of weeks since your last activity. Don't let your progress slip!";
        } else {
            return "It's been a week since your last activity. Keep the momentum going!";
        }
    };

    const getUrgencyColor = (days: number) => {
        if (days >= 30) return '#ef4444';
        if (days >= 14) return '#f59e0b';
        return '#0ea5e9';
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
    .reminder-card { background:linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border:1px solid #fecaca; border-radius:16px; padding:24px; margin:24px 0; }
    .reminder-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#dc2626; margin:0 0 12px; }
    .reminder-text { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#7f1d1d; margin:0; }
    .urgency-badge { display:inline-block; background:${getUrgencyColor(inactivityData.daysInactive)}; color:#ffffff; padding:4px 12px; border-radius:20px; font:600 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; margin-left:12px; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0ea5e9; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .action-card { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:12px; padding:20px; margin:16px 0; }
    .action-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0 0 8px; }
    .action-text { font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0; }
    .opportunity-list { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; margin:16px 0; }
    .opportunity-item { display:flex; align-items:center; margin:8px 0; }
    .opportunity-icon { font-size:16px; margin-right:12px; }
    .opportunity-text { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
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
          <p class="tagline">We miss you! 👋</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Hey ${name}, we noticed you've been away! <span class="emoji">⏰</span></h1>
          <p>${getInactivityMessage(inactivityData.daysInactive)}</p>
          
          <div class="reminder-card">
            <div class="reminder-title">
              ⏰ Time to Re-engage
              <span class="urgency-badge">${inactivityData.daysInactive} days</span>
            </div>
            <div class="reminder-text">
              Your last activity was on ${inactivityData.lastActivity}. Don't let your job search momentum fade away!
            </div>
          </div>

          <h2 class="h2">📊 Your Job Search Status</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${inactivityData.totalApplications}</div>
              <div class="stat-label">Total<br>Applications</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${inactivityData.pendingFollowUps}</div>
              <div class="stat-label">Need<br>Follow-up</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${inactivityData.incompleteGoals}</div>
              <div class="stat-label">Incomplete<br>Goals</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${inactivityData.daysInactive}</div>
              <div class="stat-label">Days<br>Inactive</div>
            </div>
          </div>

          ${inactivityData.pendingFollowUps > 0 ? `
          <div class="action-card">
            <div class="action-title">📧 Follow-up Reminders</div>
            <div class="action-text">
              You have ${inactivityData.pendingFollowUps} applications that could benefit from a follow-up email. 
              This simple action can significantly increase your response rate!
            </div>
          </div>
          ` : ''}

          ${inactivityData.incompleteGoals > 0 ? `
          <div class="action-card">
            <div class="action-title">🎯 Goal Progress</div>
            <div class="action-text">
              You have ${inactivityData.incompleteGoals} incomplete weekly goals. 
              Setting and achieving small goals keeps you motivated and on track.
            </div>
          </div>
          ` : ''}

          ${inactivityData.recentOpportunities.length > 0 ? `
          <div class="opportunity-list">
            <h3 style="margin:0 0 16px; font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937;">
              💼 Recent Opportunities You Might Have Missed
            </h3>
            ${inactivityData.recentOpportunities.map(opp => `
            <div class="opportunity-item">
              <span class="opportunity-icon">🔍</span>
              <span class="opportunity-text">${opp}</span>
            </div>
            `).join('')}
          </div>
          ` : ''}

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Get Back on Track →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <div style="margin-bottom:12px;">
            <strong>ApplyTrak</strong> · Your job search companion
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

async function getInactivityData(userId: number): Promise<InactivityData> {
    // Get user's applications
    const { data: applications } = await supabase
        .from("applications")
        .select("*")
        .eq("userid", userId);

    const apps = applications || [];
    const totalApplications = apps.length;
    
    // Find last activity
    const lastApp = apps.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    const lastActivity = lastApp ? new Date(lastApp.createdAt).toLocaleDateString() : 'Never';
    const daysInactive = lastApp ? Math.floor((Date.now() - new Date(lastApp.createdAt).getTime()) / (1000 * 60 * 60 * 24)) : 999;
    
    // Count applications that need follow-up (older than 7 days without response)
    const pendingFollowUps = apps.filter(app => {
        const daysSinceApplied = Math.floor((Date.now() - new Date(app.dateApplied).getTime()) / (1000 * 60 * 60 * 24));
        return daysSinceApplied > 7 && app.status === 'Applied';
    }).length;
    
    // Mock incomplete goals
    const incompleteGoals = Math.floor(Math.random() * 3) + 1;
    
    // Mock recent opportunities
    const recentOpportunities = [
        "New remote positions in your field",
        "Companies actively hiring in your area",
        "Updated job postings from your saved searches"
    ];

    return {
        daysInactive,
        lastActivity,
        pendingFollowUps,
        incompleteGoals,
        totalApplications,
        recentOpportunities
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

        // Get inactivity data
        const inactivityData = await getInactivityData(user.id);

        const settingsUrl = user.externalid
            ? `${PREFS_ENDPOINT}?eid=${user.externalid}`
            : CTA_URL;

        const html = renderInactivityReminderHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
            inactivityData
        });

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <reminders@resend.dev>",
                to: email,
                subject: `⏰ We miss you! ${inactivityData.daysInactive} days since your last activity`,
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
        return new Response("Failed to send inactivity reminder email", { status: 500 });
    }
});
