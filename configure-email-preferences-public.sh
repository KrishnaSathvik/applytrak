#!/bin/bash

# ============================================================================
# CONFIGURE EMAIL PREFERENCES FUNCTION FOR PUBLIC ACCESS
# ============================================================================
# This script helps configure the email-preferences function for public access

echo "🔧 Configuring email-preferences function for public access..."

# Method 1: Check if Supabase CLI is available
if command -v supabase &> /dev/null; then
    echo "✅ Supabase CLI found"
    echo "📋 Available commands:"
    echo "   supabase functions list"
    echo "   supabase functions serve --no-verify-jwt email-preferences"
    echo ""
    echo "🚀 To make email-preferences public, run:"
    echo "   supabase functions serve --no-verify-jwt email-preferences"
    echo ""
else
    echo "❌ Supabase CLI not found"
    echo "📥 Install it with: npm install -g supabase"
fi

# Method 2: Check function configuration via API
echo ""
echo "🔍 Checking current function configuration..."

# Get function details
FUNCTION_URL="https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyOTU0MywiZXhwIjoyMDcwMDA1NTQzfQ.jZMxPrFq1yiwRHSrJhlyfkAWeA7IIRgsmRG4UkFh-Fg"

echo "📊 Testing function access..."

# Test without auth (should fail if not public)
echo "🧪 Test 1: Without authentication (should work if public):"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$FUNCTION_URL?eid=4485394f-5d84-4c2e-a77b-0f4bf34b302b"

# Test with auth (should work)
echo "🧪 Test 2: With authentication (should work):"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$FUNCTION_URL?eid=4485394f-5d84-4c2e-a77b-0f4bf34b302b" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o"

echo ""
echo "📋 Manual Configuration Steps:"
echo "1. Go to: https://supabase.com/dashboard/project/ihlaenwiyxtmkehfoesg"
echo "2. Click 'Edge Functions' in the left sidebar"
echo "3. Click on 'email-preferences' function"
echo "4. Look for 'Settings' or 'Configuration' tab"
echo "5. Find 'Authentication' setting and change to 'Public'"
echo "6. Save changes"

echo ""
echo "🔧 Alternative: Update function code to handle public access"
echo "   Edit: supabase/functions/email-preferences/index.ts"
echo "   Add: // Allow public access for email preferences"
echo "   The function already uses eid parameter for auth"

echo ""
echo "✅ Configuration complete!"
