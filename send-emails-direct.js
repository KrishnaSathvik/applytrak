// Direct email sending using Resend API (bypassing Supabase Edge Functions)
const RESEND_API_KEY = 're_1234567890abcdef'; // You'll need to get this from Resend dashboard

// Your 3 users from database
const users = [
  {
    email: 'krishnasathvikm@gmail.com',
    name: 'Krishna'
  },
  {
    email: 'saitejaswinithumpala@gmail.com', 
    name: 'Tejuu'
  },
  {
    email: 'divyakodanganti@gmail.com',
    name: 'Divya Kodanganti'
  }
];

// Welcome email template
function renderWelcomeHTML({ name }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="color-scheme" content="light only">
  <meta name="supported-color-schemes" content="light">
  <style>
    body { margin:0; padding:0; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); }
    .wrap { width:100%; table-layout:fixed; background:linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%); padding:32px 0; }
    .container { max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04); border:1px solid #e2e8f0; }
    .header { background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); text-align:center; padding:32px 24px; position:relative; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; }
    .h1 { font:700 28px/1.2 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; color:#0f172a; margin:0 0 16px; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1);
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Geist', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#3b82f6; text-decoration:none; font-weight:500; }
  </style>
</head>
<body>
  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="header">
          <img src="https://applytrak.com/logo192.png" width="56" height="56" class="logo" alt="ApplyTrak logo" style="display:block;">
          <p class="brand">ApplyTrak</p>
          <p class="tagline">Your job search, organized and optimized</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Welcome to ApplyTrak, ${name}! 🎉</h1>
          <p>You're now part of a community of job seekers who are taking control of their career journey. Let's make your job search more effective and less stressful.</p>
          
          <div class="cta-wrap">
            <a href="https://applytrak.com" class="cta">Start Your Job Search Journey →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <p><strong>ApplyTrak</strong> · Built for job seekers like you</p>
          <p><a href="https://applytrak.com">Open app</a> · <a href="mailto:support@applytrak.com">Get help</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Achievements announcement email template
function renderAchievementsHTML({ name }) {
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
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .new-badge { background:rgba(255,255,255,0.2); color:#ffffff; padding:6px 12px; border-radius:20px; font:600 12px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; display:inline-block; margin-top:8px; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 28px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; }
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
  </style>
</head>
<body>
  <table role="presentation" class="wrap" width="100%" cellspacing="0" cellpadding="0" border="0">
    <tr><td align="center">
      <table role="presentation" class="container" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="header">
          <img src="https://applytrak.com/logo192.png" width="56" height="56" class="logo" alt="ApplyTrak logo" style="display:block;">
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
              <li><strong>22 Achievements</strong> to unlock as you progress</li>
              <li><strong>XP & Leveling System</strong> - Earn points and level up</li>
              <li><strong>Real-time Unlocking</strong> - Achievements unlock instantly</li>
              <li><strong>Gamification</strong> - Make job searching fun and rewarding</li>
              <li><strong>Special Achievements</strong> - Like "FAANG Hunter" for top tech companies</li>
              <li><strong>Progress Tracking</strong> - Visual progress bars and statistics</li>
            </ul>
          </div>
          
          <p><strong>How it works:</strong></p>
          <p>Your existing applications will automatically unlock eligible achievements, so you might already have some waiting for you! The system tracks your progress in real-time and celebrates your milestones.</p>
          
          <div class="cta-wrap">
            <a href="https://applytrak.com/#achievements" class="cta">🚀 Check Out Your Achievements Now!</a>
          </div>
          
          <p>Happy job hunting! 🎉</p>
          
        </td></tr>
        <tr><td class="footer">
          <p><strong>The ApplyTrak Team</strong></p>
          <p>Questions? Just reply to this email - we'd love to hear from you!</p>
          <p style="margin-top:16px;">
            <a href="https://applytrak.com/#profile">Manage Email Preferences</a> • 
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
</html>`;
}

// Function to send welcome email
async function sendWelcomeEmail(user) {
  try {
    console.log(`📧 Sending welcome email to ${user.name} (${user.email})...`);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ApplyTrak <onboarding@applytrak.com>",
        to: user.email,
        subject: "Welcome to ApplyTrak! 🎉 Your job search just got smarter",
        html: renderWelcomeHTML({ name: user.name }),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Welcome email sent to ${user.name}: SUCCESS`);
    } else {
      console.error(`❌ Welcome email failed for ${user.name}: FAILED`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${JSON.stringify(result)}`);
    }
    return response.ok;
  } catch (error) {
    console.error(`❌ Welcome email failed for ${user.name}: ERROR`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Function to send achievements announcement email
async function sendAchievementsAnnouncementEmail(user) {
  try {
    console.log(`🏆 Sending achievements announcement email to ${user.name} (${user.email})...`);
    
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ApplyTrak <announcements@applytrak.com>",
        to: user.email,
        subject: "🎉 New Achievements Feature - ApplyTrak",
        html: renderAchievementsHTML({ name: user.name }),
      }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log(`✅ Achievements announcement email sent to ${user.name}: SUCCESS`);
    } else {
      console.error(`❌ Achievements announcement email failed for ${user.name}: FAILED`);
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${JSON.stringify(result)}`);
    }
    return response.ok;
  } catch (error) {
    console.error(`❌ Achievements announcement email failed for ${user.name}: ERROR`);
    console.error(`   Error: ${error.message}`);
    return false;
  }
}

// Delay function
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Main function to send emails to all users
async function sendEmailsToAllUsers() {
  console.log('🚀 Starting email campaign to all 3 users...');
  console.log('📋 Users: ' + users.map(u => `${u.name} (${u.email})`).join(', '));
  console.log('⏰ Will wait 1 minute between each user');
  console.log('');

  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    console.log(`👤 Processing user ${i + 1}/${users.length}: ${user.name}`);
    console.log('==================================================');

    // Send welcome email
    await sendWelcomeEmail(user);
    await delay(30 * 1000); // Wait 30 seconds

    // Send achievements announcement email
    await sendAchievementsAnnouncementEmail(user);

    if (i < users.length - 1) {
      console.log(`\n⏳ Waiting 1 minute before processing next user...`);
      await delay(60 * 1000); // Wait 1 minute before next user
    }
    console.log('');
  }
  console.log('🎉 Email campaign completed for all users!');
}

// Run the main function
sendEmailsToAllUsers();
