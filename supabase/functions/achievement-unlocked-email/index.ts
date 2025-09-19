// @ts-ignore - Deno import, works in Supabase Edge Functions
import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
// @ts-ignore - Deno import, works in Supabase Edge Functions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Achievement unlocked email template with enhanced design
function renderAchievementUnlockedHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    achievement,
    userStats
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    achievement: any;
    userStats: any;
}) {
    const rarityColors = {
        'common': '#6b7280',
        'uncommon': '#10b981', 
        'rare': '#3b82f6',
        'epic': '#8b5cf6',
        'legendary': '#f59e0b'
    };
    
    const achievementColor = rarityColors[achievement.rarity as keyof typeof rarityColors] || '#6b7280';
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    .wrap { width:100%; table-layout:fixed; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding:32px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, ${achievementColor} 0%, ${achievementColor}dd 100%); text-align:center; padding:40px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 32px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; text-align:center; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .achievement-card { background:linear-gradient(135deg, ${achievementColor}10 0%, ${achievementColor}05 100%); border:2px solid ${achievementColor}40; border-radius:20px; padding:32px; margin:24px 0; text-align:center; position:relative; }
    .achievement-card::before { content:''; position:absolute; top:-2px; left:-2px; right:-2px; bottom:-2px; background:linear-gradient(45deg, ${achievementColor}, ${achievementColor}80, ${achievementColor}); border-radius:20px; z-index:-1; opacity:0.1; }
    .achievement-emoji { font-size:64px; margin-bottom:16px; display:block; }
    .achievement-title { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 8px; }
    .achievement-rarity { font:600 14px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:${achievementColor}; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 12px; }
    .achievement-desc { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#4b5563; margin:0 0 16px; }
    .achievement-xp { font:700 20px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:${achievementColor}; margin:0; }
    .stats-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(120px, 1fr)); gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#f59e0b; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .progress-section { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); border:1px solid #e2e8f0; border-radius:16px; padding:24px; margin:24px 0; }
    .progress-title { font:600 18px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; text-align:center; }
    .progress-bar { background:#e5e7eb; border-radius:12px; height:12px; margin:16px 0; overflow:hidden; }
    .progress-fill { background:linear-gradient(90deg, ${achievementColor} 0%, ${achievementColor}80 100%); height:100%; border-radius:12px; transition:width 0.3s ease; }
    .progress-text { font:700 18px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:${achievementColor}; margin:8px 0; text-align:center; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, ${achievementColor} 0%, ${achievementColor}dd 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1);
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
      .achievement-emoji { font-size:48px; }
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
          <p class="tagline">Achievement Unlocked!</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">🎉 Achievement Unlocked!</h1>
          
          <p>Congratulations ${name}! You've just unlocked a new achievement:</p>
          
          <div class="achievement-card">
            <span class="achievement-emoji">${achievement.icon}</span>
            <h2 class="achievement-title">${achievement.name}</h2>
            <div class="achievement-rarity">${achievement.rarity}</div>
            <p class="achievement-desc">${achievement.description}</p>
            <div class="achievement-xp">+${achievement.xpReward} XP</div>
          </div>
          
          <div class="progress-section">
            <h3 class="progress-title">Your Progress</h3>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${userStats.totalAchievements}</div>
                <div class="stat-label">Total Achievements</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${userStats.totalXp}</div>
                <div class="stat-label">Total XP</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">Level ${userStats.level}</div>
                <div class="stat-label">Current Level</div>
              </div>
            </div>
            
            <div class="progress-bar">
              <div class="progress-fill" style="width:${userStats.levelProgress}%;"></div>
            </div>
            <div class="progress-text">${userStats.levelProgress}% to Level ${userStats.level + 1}</div>
          </div>
          
          <p>Keep up the great work! Every application brings you closer to your dream job and unlocks new achievements.</p>
          
          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">View All Achievements →</a>
          </div>
          
        </td></tr>
        <tr><td class="footer">
          <p><strong>ApplyTrak Team</strong></p>
          <p style="margin-top:16px;">
            <a href="${settingsUrl}">Manage Email Preferences</a> • 
            <a href="https://applytrak.com">Visit ApplyTrak</a>
          </p>
          <p style="font-size:11px; margin-top:12px; color:#9ca3af;">
            You're receiving this because you unlocked an achievement in ApplyTrak.
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
    const { email, name, achievementId } = await req.json()

    if (!email || !achievementId) {
      return new Response(
        JSON.stringify({ error: 'Email, name, and achievementId are required' }),
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

    // Get achievement details
    const { data: achievement } = await supabaseClient
      .from("achievements")
      .select("*")
      .eq("id", achievementId)
      .single()

    if (!achievement) {
      return new Response(
        JSON.stringify({ error: 'Achievement not found' }),
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

    // Calculate level progress
    const currentLevelXp = userStats?.level * 100 || 0;
    const nextLevelXp = (userStats?.level + 1) * 100;
    const levelProgress = userStats?.totalXp ? 
      Math.min(100, Math.round(((userStats.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100)) : 0;

    const stats = {
      totalAchievements: userStats?.totalAchievements || 0,
      totalXp: userStats?.totalXp || 0,
      level: userStats?.level || 1,
      levelProgress
    };

    // Generate URLs
    const baseUrl = 'https://applytrak.com'
    const logoUrl = `${baseUrl}/logo192.png`
    const ctaUrl = `${baseUrl}/#achievements`
    const settingsUrl = `${baseUrl}/#profile`

    const htmlContent = renderAchievementUnlockedHTML({
      name: name || 'there',
      logoUrl,
      ctaUrl,
      settingsUrl,
      achievement,
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
        from: "ApplyTrak <achievements@applytrak.com>",
        to: email,
        subject: `🏆 Achievement Unlocked: ${achievement.name}!`,
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
        message: 'Achievement unlocked email sent successfully',
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
