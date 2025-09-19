// Direct achievements announcement script using Resend API
const RESEND_API_KEY = process.env.RESEND_API_KEY || 'your-resend-api-key-here';

// Achievements announcement email template following ApplyTrak design system
function renderAchievementsAnnouncementHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl 
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
    .cta { display:inline-block; background:linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color:#ffffff; padding:16px 32px; border-radius:12px; text-decoration:none; font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; box-shadow:0 4px 6px -1px rgba(0,0,0,0.1); transition:all 0.2s; }
    .cta:hover { transform:translateY(-1px); box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); }
    .footer { background:#f8fafc; padding:24px; text-align:center; font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; border-top:1px solid #e2e8f0; }
    .footer a { color:#3b82f6; text-decoration:none; }
    .footer a:hover { text-decoration:underline; }
  </style>
</head>
<body>
  <table class="wrap"><tr><td>
    <table class="container"><tr><td>
      <table class="header"><tr><td>
        <img src="${logoUrl}" alt="ApplyTrak" class="logo" width="48" height="48">
        <h1 class="brand">ApplyTrak</h1>
        <p class="tagline">Your Job Search Companion</p>
        <span class="new-badge">NEW FEATURE</span>
      </td></tr></table>
      
      <table class="content"><tr><td>
        <h1 class="h1">🎉 Exciting News, ${name}!</h1>
        
        <p>We're thrilled to announce a brand new feature that will make your job search journey even more engaging and rewarding!</p>
        
        <div class="highlight-section">
          <h2 class="highlight-title">
            <span class="highlight-icon">🏆</span>
            Achievements System
          </h2>
          <p>Track your progress, unlock rewards, and stay motivated with our new gamified achievement system!</p>
          <ul class="highlight-list">
            <li><strong>Real-time tracking:</strong> Your existing applications automatically unlock eligible achievements</li>
            <li><strong>XP & Levels:</strong> Earn experience points and level up as you progress</li>
            <li><strong>Multiple categories:</strong> Milestone, Streak, Time-based, Quality, Special, and Goals</li>
            <li><strong>Beautiful UI:</strong> Stunning achievement cards with progress tracking</li>
            <li><strong>Mobile-friendly:</strong> Full support for both desktop and mobile experiences</li>
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
  </td></tr></table>
</body>
</html>`;
}

async function sendAchievementsAnnouncement() {
    try {
        console.log('🎉 Starting Achievements Feature Announcement...\n');

        // List of users to notify
        const usersToNotify = [
            { email: 'krishnasathvikm@gmail.com', name: 'Krishna' },
            { email: 'saitejaswinithumpala@gmail.com', name: 'Tejuu' },
            { email: 'divyakodanganti@gmail.com', name: 'Divya Kodanganti' },
        ];

        console.log(`📧 Sending announcements to ${usersToNotify.length} users...\n`);
        
        for (const user of usersToNotify) {
            try {
                console.log(`📧 Sending to ${user.email}...`);
                
                // Generate URLs
                const baseUrl = 'https://applytrak.com';
                const logoUrl = `${baseUrl}/logo192.png`;
                const ctaUrl = `${baseUrl}/#achievements`;
                const settingsUrl = `${baseUrl}/#profile`;

                // Render email HTML
                const htmlContent = renderAchievementsAnnouncementHTML({
                    name: user.name,
                    logoUrl,
                    ctaUrl,
                    settingsUrl
                });

                // Send email using Resend directly
                const response = await fetch("https://api.resend.com/emails", {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${RESEND_API_KEY}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        from: "ApplyTrak <announcements@resend.dev>",
                        to: user.email,
                        subject: "🎉 New Achievements Feature - ApplyTrak",
                        html: htmlContent,
                    }),
                });

                const result = await response.text();
                
                if (response.ok) {
                    console.log(`✅ Successfully sent to ${user.email}`);
                } else {
                    console.log(`❌ Failed to send to ${user.email}: ${result}`);
                }
                
            } catch (error) {
                console.log(`❌ Error sending to ${user.email}: ${error.message}`);
            }
            
            console.log(''); // Empty line for readability
        }

        console.log('🎯 Announcement complete!');
        console.log('📊 Summary: 3 users notified about the new achievements feature');
        
    } catch (error) {
        console.log(`❌ Announcement failed: ${error.message}`);
    }
}

// Check if RESEND_API_KEY is provided
if (!RESEND_API_KEY || RESEND_API_KEY === 'your-resend-api-key-here') {
    console.log('❌ Please set RESEND_API_KEY environment variable');
    console.log('Usage: RESEND_API_KEY=your_key_here node send-achievements-direct.js');
    process.exit(1);
}

sendAchievementsAnnouncement();
