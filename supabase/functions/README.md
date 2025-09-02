# ApplyTrak Email Templates

This directory contains all the Supabase Edge Functions for sending various types of emails to ApplyTrak users. All templates are designed with a consistent, modern design that matches the analytics dashboard aesthetic.

## 📧 Email Templates Overview

### 1. Welcome Email (`welcome-email/`)
**Purpose**: Sent to new users upon signup
- **Features**:
  - Modern gradient design with analytics-inspired styling
  - Quick start guide with actionable steps
  - Statistics cards showing user benefits
  - Pro tip section with the "20-Minute Rule"
  - Responsive design for mobile devices

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/welcome-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

### 2. Weekly Goals Email (`weekly-goals-email/`)
**Purpose**: Weekly progress reports with goal tracking
- **Features**:
  - Progress bar showing goal completion
  - Weekly statistics (applications, interviews, follow-ups)
  - Success rate tracking
  - Personalized insights based on job sources
  - Dynamic progress indicators and emojis

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/weekly-goals-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

### 3. Weekly Tips Email (`weekly-tips-email/`)
**Purpose**: Personalized job search tips and insights
- **Features**:
  - Tip of the week based on user behavior
  - Job search insights and metrics
  - Actionable recommendations
  - Top performing job sources analysis
  - Follow-up reminders

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/weekly-tips-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

### 4. Milestone Email (`milestone-email/`)
**Purpose**: Celebrate user achievements and milestones
- **Features**:
  - Dynamic milestone types (applications, interviews, goals, streaks, offers)
  - Color-coded achievements with custom emojis
  - Progress tracking and next milestone hints
  - User journey statistics
  - Motivational messaging

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/milestone-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe", "milestoneType": "applications", "milestoneValue": 25}'
```

### 5. Monthly Analytics Email (`monthly-analytics-email/`)
**Purpose**: Comprehensive monthly performance reports
- **Features**:
  - Monthly summary with trend indicators
  - Performance metrics and success rates
  - Top job sources analysis
  - Personalized recommendations
  - Goal achievement tracking

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/monthly-analytics-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

### 6. Inactivity Reminder Email (`inactivity-reminder-email/`)
**Purpose**: Re-engage inactive users
- **Features**:
  - Days since last activity tracking
  - Urgency indicators based on inactivity duration
  - Pending follow-up reminders
  - Recent opportunities they might have missed
  - Actionable re-engagement steps

**Usage**:
```bash
curl -X POST https://your-project.supabase.co/functions/v1/inactivity-reminder-email \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "name": "John Doe"}'
```

### 7. Email Preferences (`email-preferences/`)
**Purpose**: Manage user email preferences
- **Features**:
  - Toggle controls for all email types
  - One-click preference updates
  - Clean, user-friendly interface
  - Immediate preference application

## 🎨 Design System

All email templates follow a consistent design system:

### Colors
- **Primary**: `#0ea5e9` (Sky Blue)
- **Secondary**: `#0284c7` (Darker Blue)
- **Success**: `#10b981` (Green)
- **Warning**: `#f59e0b` (Orange)
- **Error**: `#ef4444` (Red)
- **Neutral**: `#64748b` (Gray)

### Typography
- **Font Family**: Inter, -apple-system, BlinkMacSystemFont, sans-serif
- **Headings**: 700 weight, optimized line heights
- **Body**: 400 weight, 1.6 line height
- **Labels**: 500 weight for emphasis

### Layout
- **Container**: 600px max-width, centered
- **Cards**: 16px border radius, subtle shadows
- **Spacing**: Consistent 16px, 24px, 32px increments
- **Responsive**: Mobile-first design with breakpoints

### Components
- **Gradient Headers**: Branded with subtle patterns
- **Stat Cards**: Clean, minimal data presentation
- **Progress Bars**: Visual goal tracking
- **Action Buttons**: Prominent CTAs with hover effects
- **Insight Cards**: Highlighted tips and recommendations

## 🔧 Environment Variables

All functions require these environment variables:

```bash
RESEND_API_KEY=your_resend_api_key
SB_URL=your_supabase_url
SB_SERVICE_ROLE_KEY=your_service_role_key
APPLYTRAK_LOGO_URL=https://applytrak.com/favicon.svg
APPLYTRAK_APP_URL=https://applytrak.com
APPLYTRAK_PREFS_ENDPOINT=https://your-project.supabase.co/functions/v1/email-preferences
```

## 📊 Analytics Integration

All templates integrate with the existing analytics system:

- **User Metrics**: Track email engagement and user behavior
- **Application Data**: Real-time application statistics
- **Goal Tracking**: Weekly and monthly goal progress
- **Success Rates**: Interview and offer conversion tracking
- **Activity Monitoring**: User engagement patterns

## 🚀 Deployment

To deploy all functions:

```bash
# Deploy individual functions
supabase functions deploy welcome-email
supabase functions deploy weekly-goals-email
supabase functions deploy weekly-tips-email
supabase functions deploy milestone-email
supabase functions deploy monthly-analytics-email
supabase functions deploy inactivity-reminder-email
supabase functions deploy email-preferences

# Or deploy all at once
supabase functions deploy
```

## 📈 Email Preferences Database Schema

The `email_preferences` table includes these fields:

```sql
CREATE TABLE email_preferences (
  weekly_goals boolean DEFAULT true,
  weekly_tips boolean DEFAULT true,
  monthly_analytics boolean DEFAULT true,
  milestone_emails boolean DEFAULT true,
  inactivity_reminders boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  userid bigint REFERENCES users(id)
);
```

## 🎯 Best Practices

1. **Personalization**: All emails include user names and personalized data
2. **Analytics**: Track email opens, clicks, and user engagement
3. **Testing**: Test all templates across different email clients
4. **Accessibility**: Ensure proper contrast ratios and alt text
5. **Mobile**: Optimize for mobile viewing (60%+ of email opens)
6. **Frequency**: Respect user preferences and avoid spam

## 🔄 Automation Ideas

Consider setting up automated triggers for these emails:

- **Welcome**: On user signup
- **Weekly Goals**: Every Sunday at 9 AM
- **Weekly Tips**: Every Wednesday at 10 AM
- **Milestones**: On achievement detection
- **Monthly Analytics**: First day of each month
- **Inactivity**: After 7, 14, and 30 days of inactivity

## 📝 Future Enhancements

Potential improvements for future versions:

1. **A/B Testing**: Test different subject lines and content
2. **Dynamic Content**: More personalized recommendations
3. **Interactive Elements**: Embedded forms and surveys
4. **Social Proof**: Include community statistics
5. **Gamification**: More achievement badges and rewards
6. **Integration**: Connect with task management tools
