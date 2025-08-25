// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

        if (!eid) return new Response("Missing eid", { status: 400, headers: { "Content-Type": "text/plain; charset=utf-8" } });

        const { data: user } = await supabase
            .from("users")
            .select("id")
            .eq("external_id", eid)
            .maybeSingle();

        if (!user) return new Response("Not found", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });

        if (weekly_goals !== null || weekly_tips !== null) {
            const payload: Record<string, any> = { user_id: user.id, updated_at: new Date().toISOString() };
            if (weekly_goals !== null) payload.weekly_goals = weekly_goals === "true";
            if (weekly_tips !== null) payload.weekly_tips = weekly_tips === "true";
            await supabase.from("email_preferences").upsert(payload, { onConflict: "user_id" });

            return htmlResponse(`
  <div style="max-width:480px; margin:0 auto; text-align:center;">
    <h2 style="margin:0 0 12px;">Preferences saved ✅</h2>
    <p style="margin:0 0 16px;">Your email settings have been updated.</p>
    <p><a href="${APP_URL}" style="color:#0ea5e9; text-decoration:none; font-weight:bold;">Back to ApplyTrak</a></p>
  </div>`);
        }

        const link = (qs: string) => `${origin}${url.pathname}?${qs}`;
        const bullet = " • ";

        return htmlResponse(`
  <div style="max-width:640px; margin:0 auto;">
    <h2 style="margin:0 0 12px;">Manage Email Preferences</h2>
    <p style="margin:0 0 16px;">Choose what you want to receive:</p>

    <div style="margin:10px 0 14px;">
      <strong>Weekly Goals</strong><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_goals=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_goals=true`)}">Turn on</a>
    </div>

    <div style="margin:10px 0 24px;">
      <strong>Weekly Tips</strong><br>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_tips=false`)}">Turn off</a>
      <span style="color:#94a3b8;">${bullet}</span>
      <a href="${link(`eid=${encodeURIComponent(eid)}&weekly_tips=true`)}">Turn on</a>
    </div>

    <p style="margin-top:24px;"><a href="${APP_URL}">Back to ApplyTrak</a></p>
    <p style="margin-top:12px; color:#64748b; font-size:12px;">Changes apply immediately.</p>
  </div>`);
    } catch (e) {
        console.error(e);
        return new Response("Error updating preferences", {
            status: 500,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
    }
});
