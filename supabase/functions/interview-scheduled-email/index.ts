// @ts-ignore - Deno import, works in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
// @ts-ignore - Deno import, works in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Interview scheduled email template with celebration and tips
function renderInterviewScheduledHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    application,
    userStats
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    application: any;
    userStats: any;
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
    .header { background:linear-gradient(135deg, #10b981 0%, #059669 100%); text-align:center; padding:40px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 32px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; text-align:center; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .celebration-card { background:linear-gradient(135deg, #10b98110 0%, #10b98105 100%); border:2px solid #10b98140; border-radius:20px; padding:32px; margin:24px 0; text-align:center; position:relative; }
    .celebration-card::before { content:''; position:absolute; top:-2px; left:-2px; right:-2px; bottom:-2px; background:linear-gradient(45deg, #10b981, #10b98180, #10b981); border-radius:20px; z-index:-1; opacity:0.1; }
    .celebration-emoji { font-size:64px; margin-bottom:16px; display:block; }
    .celebration-title { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 8px; }
    .celebration-subtitle { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#10b981; margin:0 0 16px; }
    .application-details { background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; padding:24px; margin:24px 0; }
    .detail-row { display:flex; justify-content:space-between; margin:12px 0; padding:8px 0; border-bottom:1px solid #f3f4f6; }
    .detail-row:last-child { border-bottom:none; }
    .detail-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; }
    .detail-value { font:600 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; }
    .tips-section { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:16px; padding:24px; margin:24px 0; }
    .tips-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0 0 16px; display:flex; align-items:center; }
    .tips-icon { font-size:20px; margin-right:8px; }
    .tips-list { margin:0; padding-left:20px; }
    .tips-list li { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin-bottom:8px; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#10b981; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #10b981 0%, #059669 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(16, 185, 129, 0.2), 0 2px 4px -1px rgba(16, 185, 129, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#0ea5e9; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .stats-grid { grid-template-columns:1fr; gap:12px; }
      .detail-row { flex-direction:column; gap:4px; }
      .h1 { font-size:24px; }
      .celebration-emoji { font-size:48px; }
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
          <p class="tagline">Interview Scheduled!</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">🎉 Interview Scheduled!</h1>
          
          <p>Congratulations ${name}! Your application has progressed to the interview stage:</p>
          
          <div class="celebration-card">
            <span class="celebration-emoji">🎯</span>
            <h2 class="celebration-title">Interview Scheduled</h2>
            <div class="celebration-subtitle">Great job getting noticed!</div>
          </div>
          
          <div class="application-details">
            <h3 class="h2">Application Details</h3>
            <div class="detail-row">
              <span class="detail-label">Company:</span>
              <span class="detail-value">${application.company}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Position:</span>
              <span class="detail-value">${application.position}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Applied:</span>
              <span class="detail-value">${new Date(application.dateApplied).toLocaleDateString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">Interview Scheduled</span>
            </div>
            ${application.jobSource ? `
            <div class="detail-row">
              <span class="detail-label">Source:</span>
              <span class="detail-value">${application.jobSource}</span>
            </div>
            ` : ''}
          </div>
          
          <div class="tips-section">
            <h3 class="tips-title">
              <span class="tips-icon">💡</span>
              Interview Preparation Tips
            </h3>
            <ul class="tips-list">
              <li><strong>Research the company</strong> - Understand their mission, values, and recent news</li>
              <li><strong>Practice common questions</strong> - Prepare STAR method examples for behavioral questions</li>
              <li><strong>Prepare your own questions</strong> - Show genuine interest in the role and company</li>
              <li><strong>Test your technology</strong> - If virtual, ensure your camera, mic, and internet work</li>
              <li><strong>Dress professionally</strong> - Even for virtual interviews, dress as you would in-person</li>
              <li><strong>Have your resume ready</strong> - Keep it accessible and know it inside out</li>
            </ul>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${userStats.totalApplications}</div>
              <div class="stat-label">Total Applications</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${userStats.interviewsScheduled}</div>
              <div class="stat-label">Interviews Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${userStats.successRate}%</div>
              <div class="stat-label">Success Rate</div>
            </div>
          </div>
          
          <p><strong>You're doing great!</strong> Getting interviews is a significant milestone. This shows your applications are strong and companies are interested in you.</p>
          
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Track Your Progress →</a>
          </div>
          
        </td></tr>
        <tr><td class="footer">
          <p><strong>ApplyTrak Team</strong></p>
          <p style="margin-top:16px;">
            <a href="${settingsUrl}">Manage Email Preferences</a> • 
            <a href="https://applytrak.com">Visit ApplyTrak</a>
          </p>
          <p style="font-size:11px; margin-top:12px; color:#9ca3af;">
            You're receiving this because an application status changed to "Interview Scheduled".
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, name, applicationId } = await req.json()

    if (!email || !applicationId) {
      return new Response(
        JSON.stringify({ error: 'Email, name, and applicationId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get application details
    const { data: application } = await supabaseClient
      .from("applications")
      .select("*")
      .eq("id", applicationId)
      .single()

    if (!application) {
      return new Response(
        JSON.stringify({ error: 'Application not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get user stats
    const { data: user } = await supabaseClient
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    const { data: userStats } = await supabaseClient
      .from("user_stats")
      .select("*")
      .eq("user_id", user.id)
      .single()

    const stats = {
      totalApplications: userStats?.totalApplications || 0,
      interviewsScheduled: userStats?.interviewsScheduled || 0,
      successRate: userStats?.successRate || 0
    };

    // Generate URLs
    const baseUrl = 'https://applytrak.com'
    const logoUrl = `${baseUrl}/logo192.png`
    const ctaUrl = `${baseUrl}/#applications`
    const settingsUrl = `${baseUrl}/#profile`

    const htmlContent = renderInterviewScheduledHTML({
      name: name || 'there',
      logoUrl,
      ctaUrl,
      settingsUrl,
      application,
      userStats: stats
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
        from: "ApplyTrak <interviews@applytrak.com>",
        to: email,
        subject: `🎯 Interview Scheduled: ${application.company} - ApplyTrak`,
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
        message: 'Interview scheduled email sent successfully',
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
