import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Achievements announcement email template following ApplyTrak design system
function renderAchievementsAnnouncementHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl 
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
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
    .new-badge { background:rgba(255,255,255,0.2); color:#ffffff; padding:6px 12px; border-radius:20px; font:600 12px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; display:inline-block; margin-top:8px; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .feature-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .feature-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .feature-icon { font-size:24px; margin-bottom:8px; }
    .feature-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:0 0 4px; }
    .feature-desc { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .highlight-section { background:linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border:1px solid #0ea5e9; border-radius:16px; padding:24px; margin:24px 0; }
    .highlight-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin:0 0 16px; display:flex; align-items:center; }
    .highlight-icon { font-size:20px; margin-right:8px; }
    .highlight-list { margin:0; padding-left:20px; }
    .highlight-list li { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0c4a6e; margin-bottom:8px; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #f59e0b 0%, #ef4444 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(245, 158, 11, 0.2), 0 2px 4px -1px rgba(245, 158, 11, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#0ea5e9; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .feature-grid { grid-template-columns:1fr; gap:12px; }
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
          <p class="tagline">New Feature Announcement</p>
          <div class="new-badge">🏆 NEW</div>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">🎉 Achievements System is Here!</h1>
          
          <p>Hi ${name}! 👋</p>
          
          <p>We're excited to announce a brand new feature that will make your job search journey even more engaging and motivating!</p>
          
          <div class="highlight-section">
            <h2 class="highlight-title">
              <span class="highlight-icon">🎯</span>
              What's New: Achievement System
            </h2>
            <ul class="highlight-list">
              <li><strong>26+ Achievements</strong> to unlock as you progress</li>
              <li><strong>XP & Leveling System</strong> - Earn points and level up</li>
              <li><strong>Real-time Unlocking</strong> - Achievements unlock instantly</li>
              <li><strong>Gamification</strong> - Make job searching fun and rewarding</li>
              <li><strong>Special Achievements</strong> - Like "FAANG Hunter" for top tech companies</li>
              <li><strong>Progress Tracking</strong> - Visual progress bars and statistics</li>
            </ul>
          </div>
          
          <h2 class="h2">🏆 Achievement Categories</h2>
          
          <div class="feature-grid">
            <div class="feature-card">
              <div class="feature-icon">🎯</div>
              <div class="feature-title">Milestone</div>
              <div class="feature-desc">Reach application goals and targets</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🔥</div>
              <div class="feature-title">Streak</div>
              <div class="feature-desc">Maintain daily application streaks</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">⏰</div>
              <div class="feature-title">Time-based</div>
              <div class="feature-desc">Apply at different times of day</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">💎</div>
              <div class="feature-title">Quality</div>
              <div class="feature-desc">Upload resumes, cover letters, notes</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🌟</div>
              <div class="feature-title">Special</div>
              <div class="feature-desc">Unique accomplishments like FAANG</div>
            </div>
            <div class="feature-card">
              <div class="feature-icon">🎮</div>
              <div class="feature-title">Goals</div>
              <div class="feature-desc">Achieve weekly and monthly targets</div>
            </div>
          </div>
          
          <p><strong>How it works:</strong></p>
          <p>Your existing applications will automatically unlock eligible achievements, so you might already have some waiting for you! The system tracks your progress in real-time and celebrates your milestones.</p>
          
          <p>We hope this new feature makes your job search more engaging and helps you stay motivated on your journey to landing your dream job!</p>
          
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">🚀 Check Out Your Achievements Now!</a>
          </div>
          
          <p>Happy job hunting! 🎉</p>
          
        </td></tr>
        <tr><td class="footer">
          <p><strong>The ApplyTrak Team</strong></p>
          <p>Questions? Just reply to this email - we'd love to hear from you!</p>
          <p style="margin-top:16px;">
            <a href="${settingsUrl}">Manage Email Preferences</a> • 
            <a href="https://applytrak.com">Visit ApplyTrak</a>
          </p>
          <p style="font-size:11px; margin-top:12px; color:#9ca3af;">
            You're receiving this because you're a valued ApplyTrak user.<br>
            This is a one-time announcement about our new achievements feature.
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
    const { email, name } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    // Generate URLs
    const baseUrl = 'https://applytrak.com'
    const logoUrl = `${baseUrl}/logo192.png`
    const ctaUrl = `${baseUrl}/#achievements`
    const settingsUrl = `${baseUrl}/#profile`

    // Render email HTML
    const htmlContent = renderAchievementsAnnouncementHTML({
      name: name || 'there',
      logoUrl,
      ctaUrl,
      settingsUrl
    })

    // Send email using Supabase
    const { data, error } = await supabaseClient.functions.invoke('send-email', {
      body: {
        to: email,
        subject: '🎉 New Achievements Feature - ApplyTrak',
        html: htmlContent,
        text: `Hi ${name || 'there'}! We're excited to announce our new Achievements System with 26+ achievements, XP & leveling, and real-time unlocking. Check it out at ${ctaUrl}`
      }
    })

    if (error) {
      console.error('Email sending error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Achievements announcement sent successfully',
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
