// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const APP_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_PUBLIC_BASE = Deno.env.get("APPLYTRAK_PREFS_PUBLIC_BASE") || "";

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

function htmlResponse(innerHtml: string, status = 200) {
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ApplyTrak</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family:Arial,Helvetica,sans-serif; padding:24px; color:#111;">
${innerHtml}
</body>
</html>`;
    return new Response(html, {
        status,
        headers: {
            // 🔒 force browsers to render as HTML
            "Content-Type": "text/html; charset=utf-8",
            "Content-Disposition": "inline",
            // avoid any stale cache with wrong content-type
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            "Pragma": "no-cache",
            "X-Content-Type-Options": "nosniff"
        }
    });
}

serve(async (req) => {
    try {
        const url = new URL(req.url);
        const origin = PREFS_PUBLIC_BASE || url.origin.replace("http://", "https://");

        const eid = url.searchParams.get("eid");
        const weekly_goals = url.searchParams.get("weekly_goals");
        const weekly_tips = url.searchParams.get("weekly_tips");
        const monthly_analytics = url.searchParams.get("monthly_analytics");
        const milestone_emails = url.searchParams.get("milestone_emails");
        const inactivity_reminders = url.searchParams.get("inactivity_reminders");

        if (!eid) {
            return htmlResponse(`
                <div style="max-width:480px; margin:0 auto; text-align:center;">
                    <h2 style="margin:0 0 12px;">Email Preferences</h2>
                    <p style="margin:0 0 16px;">This link is missing required information. Please use the link from your email.</p>
                    <p><a href="${APP_URL}" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Back to ApplyTrak</a></p>
                </div>
            `, 400);
        }

        const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("externalid", eid)
            .maybeSingle();

        if (!user) {
            return htmlResponse(`
                <div style="max-width:480px; margin:0 auto; text-align:center;">
                    <h2 style="margin:0 0 12px;">User Not Found</h2>
                    <p style="margin:0 0 16px;">We couldn't find your account. Please check the link or contact support.</p>
                    <p><a href="${APP_URL}" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Back to ApplyTrak</a></p>
                </div>
            `, 404);
        }

        if (weekly_goals !== null || weekly_tips !== null || monthly_analytics !== null || milestone_emails !== null || inactivity_reminders !== null) {
            const payload: Record<string, any> = { userid: user.id, updated_at: new Date().toISOString() };
            if (weekly_goals !== null) payload.weekly_goals = weekly_goals === "true";
            if (weekly_tips !== null) payload.weekly_tips = weekly_tips === "true";
            if (monthly_analytics !== null) payload.monthly_analytics = monthly_analytics === "true";
            if (milestone_emails !== null) payload.milestone_emails = milestone_emails === "true";
            if (inactivity_reminders !== null) payload.inactivity_reminders = inactivity_reminders === "true";
            await supabase.from("email_preferences").upsert(payload, { onConflict: "userid" });

            return htmlResponse(`
  <div style="max-width:480px; margin:0 auto; text-align:center;">
    <h2 style="margin:0 0 12px;">Preferences saved ✅</h2>
    <p style="margin:0 0 16px;">Your email settings have been updated.</p>
    <p><a href="${APP_URL}" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Back to ApplyTrak</a></p>
  </div>`);
        }

        const link = (qs: string) => `${origin}${url.pathname}?${qs}`;
        const bullet = " • ";

        return htmlResponse(`
  <div style="max-width:640px; margin:0 auto;">
    <h2 style="margin:0 0 12px;">Manage Email Preferences</h2>
    <p style="margin:0 0 16px;">Choose what you want to receive:</p>

    <div style="margin:16px 0; padding:16px; background:#f8fafc; border-radius:8px;">
      <strong>📊 Weekly Goals Report</strong><br>
      <span style="color:#64748b; font-size:14px;">Progress updates and goal tracking</span><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_goals=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_goals=true`)}">Turn on</a>
    </div>

    <div style="margin:16px 0; padding:16px; background:#f8fafc; border-radius:8px;">
      <strong>💡 Weekly Tips & Insights</strong><br>
      <span style="color:#64748b; font-size:14px;">Personalized job search advice</span><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_tips=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_tips=true`)}">Turn on</a>
    </div>

    <div style="margin:16px 0; padding:16px; background:#f8fafc; border-radius:8px;">
      <strong>📈 Monthly Analytics Report</strong><br>
      <span style="color:#64748b; font-size:14px;">Comprehensive performance insights</span><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&monthly_analytics=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&monthly_analytics=true`)}">Turn on</a>
    </div>

    <div style="margin:16px 0; padding:16px; background:#f8fafc; border-radius:8px;">
      <strong>🎉 Milestone Celebrations</strong><br>
      <span style="color:#64748b; font-size:14px;">Achievement notifications and motivation</span><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&milestone_emails=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&milestone_emails=true`)}">Turn on</a>
    </div>

    <div style="margin:16px 0; padding:16px; background:#f8fafc; border-radius:8px;">
      <strong>⏰ Inactivity Reminders</strong><br>
      <span style="color:#64748b; font-size:14px;">Gentle nudges to stay active</span><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&inactivity_reminders=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&inactivity_reminders=true`)}">Turn on</a>
    </div>

    <p style="margin-top:24px;"><a href="${APP_URL}">Back to ApplyTrak</a></p>
    <p style="margin-top:12px; color:#64748b; font-size:12px;">Changes apply immediately.</p>
  </div>`);
    } catch (e) {
        console.error(e);
        return htmlResponse(`
            <div style="max-width:480px; margin:0 auto; text-align:center;">
                <h2 style="margin:0 0 12px;">Error</h2>
                <p style="margin:0 0 16px;">Something went wrong. Please try again later.</p>
                <p><a href="${APP_URL}" style="color:#3b82f6; text-decoration:none; font-weight:bold;">Back to ApplyTrak</a></p>
            </div>
        `, 500);
    }
});
