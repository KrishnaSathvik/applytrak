// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const LOGO_URL = "https://applytrak.com/logo192.png";
const CTA_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_ENDPOINT =
    Deno.env.get("APPLYTRAK_PREFS_ENDPOINT") || `${SUPABASE_URL}/functions/v1/email-preferences`;

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

// Welcome email template matching achievements design
function renderWelcomeHTML({ name, logoUrl, ctaUrl, settingsUrl }: {
    name: string; logoUrl: string; ctaUrl: string; settingsUrl: string;
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
    .header { background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); text-align:center; padding:32px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .ul { padding-left:20px; margin:16px 0; }
    .li { margin:8px 0; color:#4b5563; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);
    }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#f59e0b; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#475569; margin:0; }
    .tip { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:12px; padding:20px; margin-top:24px; position:relative; }
    .tip::before { content:'💡'; position:absolute; top:-8px; left:20px; background:#fff; padding:0 8px; font-size:16px; }
    .tip-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1e40af; margin:0 0 8px; }
    .tip-text { font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1e40af; margin:0; }
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
          <p class="tagline">Your job search, organized and optimized</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Welcome to ApplyTrak, ${name}! <span class="emoji">🎉</span></h1>
          <p>You're now part of a community of job seekers who are taking control of their career journey. Let's make your job search more effective and less stressful.</p>
          
          <h2 class="h2">🚀 Quick Start Guide</h2>
          <ul class="ul">
            <li class="li"><strong>Add your first application</strong> - Start tracking your job applications</li>
            <li class="li"><strong>Set weekly goals</strong> - Define how many applications you want to submit</li>
            <li class="li"><strong>Track your progress</strong> - Monitor your success rates and trends</li>
            <li class="li"><strong>Stay organized</strong> - Keep notes, attachments, and follow-ups in one place</li>
          </ul>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">85%</div>
              <div class="stat-label">Users see improved<br>organization</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">2.3x</div>
              <div class="stat-label">Faster follow-up<br>response times</div>
            </div>
          </div>

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Start Your Job Search Journey →</a>
          </div>

          <div class="tip">
            <div class="tip-title">Pro Tip: The 20-Minute Rule</div>
            <div class="tip-text">Spend just 20 minutes each day on targeted applications and follow-ups. This small daily habit compounds into significant results over time. Consistency beats intensity!</div>
          </div>
        </td></tr>
        <tr><td class="footer">
          <p><strong>ApplyTrak</strong> · Built for job seekers like you</p>
          <p style="margin-top:16px;">
            <a href="${settingsUrl}">Email preferences</a> · 
            <a href="${ctaUrl}">Open app</a> · 
            <a href="mailto:support@applytrak.com">Get help</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
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
        // Skip authentication check for this welcome email function
        // This function is designed to work without authentication for welcome emails
        const { email, name } = await req.json();

        // get external_id for one-click settings link
        const { data: user, error } = await supabase
            .from("users")
            .select("id, externalid")
            .eq("email", email)
            .maybeSingle();
        if (error) console.error("users lookup error:", error);

        const settingsUrl = user?.externalid
            ? `https://www.applytrak.com/email-preferences.html?eid=${user.externalid}`
            : CTA_URL;

        const html = renderWelcomeHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
        });

        // use Resend sandbox sender (works without verified domain)
        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <onboarding@applytrak.com>",
                to: email,
                subject: "Welcome to ApplyTrak! 🎉 Your job search just got smarter",
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
        return new Response("Failed to send welcome email", { status: 500 });
    }
});
