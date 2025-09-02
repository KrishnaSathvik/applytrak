// @ts-nocheck
import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SB_URL")!;
const SB_SERVICE_ROLE_KEY = Deno.env.get("SB_SERVICE_ROLE_KEY")!;
const LOGO_URL = Deno.env.get("APPLYTRAK_LOGO_URL") || "https://ihlaenwiyxtmkehfoesg.supabase.co/storage/v1/object/public/assets/logo.png?cb=" + Date.now();
const CTA_URL = Deno.env.get("APPLYTRAK_APP_URL") || "https://applytrak.com";
const PREFS_ENDPOINT =
    Deno.env.get("APPLYTRAK_PREFS_ENDPOINT") || `${SUPABASE_URL}/functions/v1/email-preferences`;

const supabase = createClient(SUPABASE_URL, SB_SERVICE_ROLE_KEY);

interface MilestoneData {
    type: 'applications' | 'interviews' | 'goals' | 'streak' | 'first_offer';
    value: number;
    title: string;
    description: string;
    emoji: string;
    color: string;
    nextMilestone?: string;
}

// Milestone achievement email template
function renderMilestoneHTML({ 
    name, 
    logoUrl, 
    ctaUrl, 
    settingsUrl, 
    milestone,
    userStats
}: {
    name: string; 
    logoUrl: string; 
    ctaUrl: string; 
    settingsUrl: string;
    milestone: MilestoneData;
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
    .header { background:linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}dd 100%); text-align:center; padding:40px 24px; position:relative; }
    .header::before { content:''; position:absolute; top:0; left:0; right:0; bottom:0; background:url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>'); opacity:0.3; }
    .logo { display:block; margin:0 auto 12px; position:relative; z-index:1; }
    .brand { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#ffffff; margin:0; position:relative; z-index:1; }
    .tagline { font:400 14px/1.4 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:rgba(255,255,255,0.9); margin:4px 0 0; position:relative; z-index:1; }
    .content { padding:32px 24px; font:400 16px/1.6 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#374151; }
    .h1 { font:700 32px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 16px; text-align:center; }
    .h2 { font:600 20px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#1f2937; margin:24px 0 12px; }
    .milestone-card { background:linear-gradient(135deg, ${milestone.color}15 0%, ${milestone.color}08 100%); border:2px solid ${milestone.color}; border-radius:20px; padding:32px; margin:24px 0; text-align:center; }
    .milestone-emoji { font-size:48px; margin-bottom:16px; display:block; }
    .milestone-title { font:700 24px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:${milestone.color}; margin:0 0 8px; }
    .milestone-value { font:700 36px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#111827; margin:0 0 12px; }
    .milestone-desc { font:400 16px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#4b5563; margin:0; }
    .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin:24px 0; }
    .stat-card { background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; padding:20px; text-align:center; box-shadow:0 1px 3px 0 rgba(0,0,0,0.1); }
    .stat-number { font:700 24px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#0ea5e9; margin:0 0 4px; }
    .stat-label { font:500 14px/1.2 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#64748b; margin:0; }
    .next-milestone { background:linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border:1px solid #f59e0b; border-radius:12px; padding:20px; margin:16px 0; }
    .next-title { font:600 16px/1.3 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0 0 8px; }
    .next-text { font:400 14px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; color:#92400e; margin:0; }
    .cta-wrap { text-align:center; padding:16px 0 8px; }
    .cta {
      display:inline-block; background:linear-gradient(135deg, ${milestone.color} 0%, ${milestone.color}dd 100%); color:#fff !important;
      text-decoration:none; padding:16px 32px; border-radius:12px;
      font:600 16px/1 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      box-shadow:0 4px 6px -1px ${milestone.color}40, 0 2px 4px -1px ${milestone.color}20;
    }
    .footer { background:linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); color:#64748b; font:400 13px/1.5 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding:24px; border-top:1px solid #e2e8f0; }
    .footer a { color:#0ea5e9; text-decoration:none; font-weight:500; }
    .emoji { font-size:18px; }
    @media (max-width: 600px) {
      .wrap { padding:16px; }
      .container { border-radius:12px; }
      .content { padding:24px 20px; }
      .stats-grid { grid-template-columns:1fr; gap:12px; }
      .h1 { font-size:28px; }
      .milestone-emoji { font-size:36px; }
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
          <p class="tagline">🎉 Achievement Unlocked!</p>
        </td></tr>
        <tr><td class="content">
          <h1 class="h1">Congratulations, ${name}! <span class="emoji">🎉</span></h1>
          <p style="text-align:center; font-size:18px; color:#4b5563; margin-bottom:24px;">You've reached an amazing milestone in your job search journey!</p>
          
          <div class="milestone-card">
            <span class="milestone-emoji">${milestone.emoji}</span>
            <div class="milestone-title">${milestone.title}</div>
            <div class="milestone-value">${milestone.value}</div>
            <div class="milestone-desc">${milestone.description}</div>
          </div>

          <h2 class="h2">📊 Your Journey So Far</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-number">${userStats.totalApplications || 0}</div>
              <div class="stat-label">Total<br>Applications</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${userStats.interviewsScheduled || 0}</div>
              <div class="stat-label">Interviews<br>Scheduled</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${userStats.successRate || 0}%</div>
              <div class="stat-label">Success<br>Rate</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${userStats.daysActive || 0}</div>
              <div class="stat-label">Days<br>Active</div>
            </div>
          </div>

          ${milestone.nextMilestone ? `
          <div class="next-milestone">
            <div class="next-title">🎯 Next Milestone</div>
            <div class="next-text">
              ${milestone.nextMilestone}
            </div>
          </div>
          ` : ''}

          <div class="cta-wrap">
            <a href="${ctaUrl}" class="cta">Keep Up the Great Work! →</a>
          </div>
        </td></tr>
        <tr><td class="footer">
          <div style="margin-bottom:12px;">
            <strong>ApplyTrak</strong> · Celebrating your success
          </div>
          <div>
            <a href="${settingsUrl}">Email preferences</a> · 
            <a href="${ctaUrl}">Open app</a> · 
            <a href="mailto:support@applytrak.com">Get help</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getMilestoneData(type: string, value: number): MilestoneData {
    const milestones = {
        applications: {
            10: {
                title: "Application Pioneer",
                description: "You've submitted your first 10 applications! You're building momentum.",
                emoji: "🚀",
                color: "#0ea5e9",
                nextMilestone: "Reach 25 applications to unlock 'Application Warrior'"
            },
            25: {
                title: "Application Warrior",
                description: "25 applications submitted! Your persistence is paying off.",
                emoji: "⚔️",
                color: "#8b5cf6",
                nextMilestone: "Reach 50 applications to unlock 'Application Master'"
            },
            50: {
                title: "Application Master",
                description: "50 applications! You're showing incredible dedication to your career goals.",
                emoji: "👑",
                color: "#f59e0b",
                nextMilestone: "Reach 100 applications to unlock 'Application Legend'"
            },
            100: {
                title: "Application Legend",
                description: "100 applications! You're a true job search champion.",
                emoji: "🏆",
                color: "#ef4444",
                nextMilestone: "Keep going! Your next goal is 150 applications"
            }
        },
        interviews: {
            1: {
                title: "First Interview",
                description: "Your first interview! This is a huge step forward.",
                emoji: "🎯",
                color: "#10b981",
                nextMilestone: "Schedule 3 more interviews to unlock 'Interview Pro'"
            },
            5: {
                title: "Interview Pro",
                description: "5 interviews scheduled! You're getting noticed by employers.",
                emoji: "💼",
                color: "#0ea5e9",
                nextMilestone: "Schedule 10 interviews to unlock 'Interview Expert'"
            },
            10: {
                title: "Interview Expert",
                description: "10 interviews! You're clearly doing something right.",
                emoji: "🎓",
                color: "#8b5cf6",
                nextMilestone: "Schedule 20 interviews to unlock 'Interview Master'"
            }
        },
        goals: {
            1: {
                title: "Goal Setter",
                description: "You've set your first weekly goal! Planning leads to success.",
                emoji: "📋",
                color: "#0ea5e9",
                nextMilestone: "Achieve 5 weekly goals to unlock 'Goal Achiever'"
            },
            5: {
                title: "Goal Achiever",
                description: "5 weekly goals achieved! You're building great habits.",
                emoji: "✅",
                color: "#10b981",
                nextMilestone: "Achieve 10 weekly goals to unlock 'Goal Master'"
            }
        },
        streak: {
            7: {
                title: "Week Warrior",
                description: "7-day application streak! Consistency is your superpower.",
                emoji: "🔥",
                color: "#ef4444",
                nextMilestone: "Maintain a 14-day streak to unlock 'Streak Master'"
            },
            14: {
                title: "Streak Master",
                description: "14-day application streak! You're unstoppable.",
                emoji: "⚡",
                color: "#f59e0b",
                nextMilestone: "Maintain a 30-day streak to unlock 'Streak Legend'"
            }
        },
        first_offer: {
            1: {
                title: "Offer Received!",
                description: "Congratulations! You've received your first job offer!",
                emoji: "🎉",
                color: "#10b981",
                nextMilestone: "This is a major milestone - celebrate your success!"
            }
        }
    };

    const milestone = milestones[type as keyof typeof milestones]?.[value as keyof typeof milestones[typeof type]];
    
    if (!milestone) {
        // Default milestone
        return {
            type: type as any,
            value,
            title: "Milestone Achieved!",
            description: "You've reached an important milestone in your job search journey.",
            emoji: "🎯",
            color: "#0ea5e9"
        };
    }

    return {
        type: type as any,
        value,
        ...milestone
    };
}

async function getUserStats(userId: number) {
    // Get user's applications
    const { data: applications } = await supabase
        .from("applications")
        .select("*")
        .eq("userid", userId);

    const apps = applications || [];
    const totalApplications = apps.length;
    const interviewsScheduled = apps.filter(app => app.status === 'Interview').length;
    
    // Calculate success rate
    const successRate = totalApplications > 0 ? Math.round((interviewsScheduled / totalApplications) * 100) : 0;
    
    // Calculate days active (mock data for now)
    const daysActive = Math.floor(Math.random() * 30) + 1;

    return {
        totalApplications,
        interviewsScheduled,
        successRate,
        daysActive
    };
}

serve(async (req) => {
    try {
        const { email, name, milestoneType, milestoneValue } = await req.json();

        // Get user data
        const { data: user, error } = await supabase
            .from("users")
            .select("id, externalid")
            .eq("email", email)
            .maybeSingle();
        
        if (error || !user) {
            console.error("User lookup error:", error);
            return new Response("User not found", { status: 404 });
        }

        // Get milestone data
        const milestone = getMilestoneData(milestoneType, milestoneValue);
        const userStats = await getUserStats(user.id);

        const settingsUrl = user.externalid
            ? `${PREFS_ENDPOINT}?eid=${user.externalid}`
            : CTA_URL;

        const html = renderMilestoneHTML({
            name: name || "there",
            logoUrl: LOGO_URL,
            ctaUrl: CTA_URL,
            settingsUrl,
            milestone,
            userStats
        });

        const r = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${RESEND_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                from: "ApplyTrak <milestones@resend.dev>",
                to: email,
                subject: `🎉 Achievement Unlocked: ${milestone.title} - ${milestone.value} ${milestoneType}`,
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
        return new Response("Failed to send milestone email", { status: 500 });
    }
});
