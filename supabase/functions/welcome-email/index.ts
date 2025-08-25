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

// simple inline template so we don't rely on external files
function renderWelcomeHTML({ name, logoUrl, ctaUrl, settingsUrl }: {
    name: string; logoUrl: string; ctaUrl: string; settingsUrl: string;
}) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:#f4f6f8; }
    .wrap { width:100%; table-layout:fixed; background:#f4f6f8; padding:24px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #eaeaea; }
    .header { background:#0ea5e9; text-align:center; padding:24px; }
    .logo { display:block; margin:0 auto 8px; }
    .brand { font:700 18px/1.1 Arial, sans-serif; color:#ffffff; margin:0; }
    .content { padding:24px; font:400 15px/1.6 Arial, sans-serif; color:#222; }
    .h1 { font:700 22px/1.2 Arial, sans-serif; color:#111; margin:0 0 12px; }
    .ul { padding-left:18px; margin:10px 0; }
    .cta-wrap { text-align:center; padding:8px 0 2px; }
    .cta {
      display:inline-block; background:#0ea5e9; color:#fff !important;
      text-decoration:none; padding:12px 20px; border-radius:8px;
      font:700 15px/1 Arial, sans-serif; border:1px solid #0284c7;
    }
    .tip { background:#f8fafc; border:1px dashed #e2e8f0; border-radius:8px; padding:12px 14px; margin-top:14px; }
    .footer { background:#f7f7f7; color:#666; font:400 12px/1.6 Arial, sans-serif; text-align:center; padding:16px; }
  </style>
</head>
<body>
  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="header">
          <img src="${logoUrl}" width="48" height="48" class="logo" alt="ApplyTrak logo" style="display:block;">
          <p class="brand">ApplyTrak</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Welcome, ${name} 🎉</h1>
          <p>We’re excited to help you organize your job search and hit your weekly goals.</p>
          <p>Quick start checklist:</p>
          <ul class="ul">
            <li>Add your first application</li>
            <li>Create your weekly goals (applications, follow-ups, interviews)</li>
            <li>Track status and notes in one place</li>
          </ul>
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Open ApplyTrak</a>
          </div>
          <div class="tip">
            <strong>Pro tip:</strong> Small daily actions compound fast — schedule 20 minutes every day for targeted applications and follow-ups.
          </div>
        </td></tr>
        <tr><td class="footer">
          © 2025 ApplyTrak · Built for job seekers like you · <a href="${settingsUrl}">Notification preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
    try {
        const { email, name } = await req.json();

        // get external_id for one-click settings link
        const { data: user, error } = await supabase
            .from("users")
            .select("id, external_id")
            .eq("email", email)
            .maybeSingle();
        if (error) console.error("users lookup error:", error);

        const settingsUrl = user?.external_id
            ? `${PREFS_ENDPOINT}?eid=${user.external_id}`
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
                from: "ApplyTrak <onboarding@resend.dev>",
                to: email,
                subject: "Welcome to ApplyTrak 🎉",
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
