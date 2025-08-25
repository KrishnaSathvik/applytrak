// @ts-nocheck
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const LOGO_URL = Deno.env.get("APPLYTRAK_LOGO_URL") || "https://applytrak.com/favicon.svg";
const CTA_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_ENDPOINT =
    Deno.env.get("APPLYTRAK_PREFS_ENDPOINT") || `${SUPABASE_URL}/functions/v1/email-preferences`;

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

const QUOTES = [
    { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
    { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
    { text: "You miss 100% of the shots you don’t take.", author: "Wayne Gretzky" },
    { text: "Motivation gets you going, habit keeps you growing.", author: "John C. Maxwell" },
];

function startOfWeekUTC(d: Date): Date {
    const dt = new Date(d);
    const day = dt.getUTCDay();          // 0 Sun..6 Sat
    const delta = (day + 6) % 7;         // since Monday
    dt.setUTCDate(dt.getUTCDate() - delta);
    dt.setUTCHours(0, 0, 0, 0);
    return dt;
}
function endOfWeekUTC(monday: Date): Date {
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);
    sunday.setUTCHours(23, 59, 59, 999);
    return sunday;
}
function pct(num: number, den: number) {
    if (!den || den <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((num / den) * 100)));
}

/** Inline HTML template (no external file needed) */
function renderWeeklyHTML(p: {
    name: string;
    logoUrl: string;
    weekRange: string;
    applications: number;
    completed: number;
    target: number;
    percent: number;
    quoteText: string;
    quoteAuthor: string;
    ctaUrl: string;
    settingsUrl: string;
}) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:#f4f6f8; }
    .wrap { width:100%; table-layout:fixed; background:#f4f6f8; padding:24px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border:1px solid #eaeaea; border-radius:10px; overflow:hidden; }
    .header { background:#16a34a; text-align:center; padding:20px 24px; }
    .logo { display:block; margin:0 auto 8px; }
    .brand { font:700 16px/1.1 Arial, sans-serif; color:#eaffea; margin:0; letter-spacing:.2px; }
    .title { font:700 20px/1.2 Arial, sans-serif; color:#ffffff; margin:6px 0 0; }
    .content { padding:22px; font:400 15px/1.6 Arial, sans-serif; color:#222; }
    .stat-grid { width:100%; border-collapse:separate; border-spacing:0; margin:12px 0 6px; }
    .stat { width:33.33%; text-align:center; padding:10px 6px; }
    .stat-num { font:800 22px/1.1 Arial, sans-serif; color:#111; }
    .stat-label { font:600 12px/1.2 Arial, sans-serif; color:#6b7280; text-transform:uppercase; letter-spacing:.4px; margin-top:4px; }
    .bar-wrap { background:#e5e7eb; border-radius:10px; overflow:hidden; height:14px; }
    .bar { background:#16a34a; height:14px; text-align:center; color:#fff; font:700 11px/14px Arial, sans-serif; }
    .quote { margin:16px 0 0; padding:12px 14px; background:#f8fafc; border-left:4px solid #16a34a; color:#334155; font:italic 14px/1.6 Georgia, serif; border-radius:6px; }
    .actions { text-align:center; padding:10px 0 22px; }
    .btn { display:inline-block; background:#111827; color:#fff !important; text-decoration:none; padding:11px 18px; border-radius:8px; font:700 14px/1 Arial, sans-serif; border:1px solid #0b1220; }
    .footer { background:#f7f7f7; color:#666; font:400 12px/1.6 Arial, sans-serif; text-align:center; padding:14px; }
    @media (max-width:620px){ .content{padding:18px} .stat{padding:8px 4px} .stat-num{font-size:20px} }
  </style>
</head>
<body>
  <table role="presentation" class="wrap" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr><td align="center">
      <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr><td class="header">
          <img src="${p.logoUrl}" width="44" height="44" class="logo" alt="ApplyTrak logo" style="display:block;">
          <p class="brand">ApplyTrak — Weekly Focus</p>
          <p class="title">${p.weekRange}</p>
        </td></tr>
        <tr><td class="content">
          <p>Hi ${p.name}, here’s your snapshot for the week:</p>
          <table role="presentation" class="stat-grid"><tr>
            <td class="stat"><div class="stat-num">${p.applications}</div><div class="stat-label">Applications</div></td>
            <td class="stat"><div class="stat-num">${p.completed}</div><div class="stat-label">Completed</div></td>
            <td class="stat"><div class="stat-num">${p.target}</div><div class="stat-label">Goal</div></td>
          </tr></table>
          <p style="margin:12px 0 8px;"><strong>Goals progress:</strong> ${p.completed} / ${p.target} complete</p>
          <div class="bar-wrap"><div class="bar" style="width: ${p.percent}%;">${p.percent}%</div></div>
          <div class="quote">“${p.quoteText}” — <strong>${p.quoteAuthor}</strong></div>
          <div class="actions"><a class="btn" href="${p.ctaUrl}">Update today’s actions</a></div>
        </td></tr>
        <tr><td class="footer">
          You’re receiving this because weekly reminders are enabled · <a href="${p.settingsUrl}">Manage preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async () => {
    try {
        const { data: users, error: ue } = await supabase
            .from("users")
            .select("id, email, display_name, external_id, timezone");
        if (ue) throw ue;

        const now = new Date();
        const monday = startOfWeekUTC(now);
        const sunday = endOfWeekUTC(monday);
        const weekRange = `${monday.toISOString().slice(0,10)} – ${sunday.toISOString().slice(0,10)}`;

        for (const u of users || []) {
            if (!u.email) continue;

            // prefs (default true)
            const { data: pref } = await supabase
                .from("email_preferences")
                .select("weekly_goals")
                .eq("user_id", u.id)
                .maybeSingle();
            if (pref && pref.weekly_goals === false) continue;

            // goals row (one per user)
            const { data: goalRow } = await supabase
                .from("goals")
                .select("weeklyGoal")
                .eq("user_id", u.id)
                .maybeSingle();
            const target = goalRow?.weeklyGoal ?? 5;

            // applications this week
            const { count: applications = 0 } = await supabase
                .from("applications")
                .select("*", { count: "exact", head: true })
                .eq("user_id", u.id)
                .gte("createdAt", monday.toISOString())
                .lte("createdAt", sunday.toISOString());

            const completed = Math.min(applications || 0, target);
            const percent = pct(completed, target);

            const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
            const settingsUrl = u.external_id
                ? `${PREFS_ENDPOINT}?eid=${u.external_id}`
                : CTA_URL;

            const html = renderWeeklyHTML({
                name: u.display_name || "there",
                logoUrl: LOGO_URL,
                weekRange,
                applications: applications || 0,
                completed,
                target,
                percent,
                quoteText: q.text,
                quoteAuthor: q.author,
                ctaUrl: CTA_URL,
                settingsUrl,
            });

            // Use Resend sandbox sender for reliability while testing
            const r = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    from: "ApplyTrak <onboarding@resend.dev>",
                    to: u.email,
                    subject: `Weekly goals — ${weekRange}`,
                    html,
                }),
            });

            if (!r.ok) {
                const body = await r.text();
                console.error("Resend error", r.status, body);
            }
        }

        return new Response("Weekly emails sent", { status: 200 });
    } catch (e) {
        console.error(e);
        return new Response("Failed weekly run", { status: 500 });
    }
});
