#!/bin/bash

# ============================================================================
# TEST EMAIL PREFERENCES FUNCTION
# ============================================================================
# This script tests the email preferences function directly

echo "🧪 Testing Email Preferences Function..."

# Get user ID 1's external ID first
echo "📋 Getting user external ID..."
USER_EXTERNAL_ID=$(curl -s "https://ihlaenwiyxtmkehfoesg.supabase.co/rest/v1/users?select=externalid&id=eq.1" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o" \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o" | \
  jq -r '.[0].externalid')

echo "🔑 User external ID: $USER_EXTERNAL_ID"

if [ "$USER_EXTERNAL_ID" = "null" ] || [ -z "$USER_EXTERNAL_ID" ]; then
    echo "❌ Could not get user external ID"
    exit 1
fi

# Test the email preferences function
echo "🌐 Testing email preferences function..."
PREFERENCES_URL="https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1/email-preferences?eid=$USER_EXTERNAL_ID"

echo "📧 Testing URL: $PREFERENCES_URL"

curl -v "$PREFERENCES_URL" \
  -H "Accept: text/html" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"

echo ""
echo "✅ Test completed!"
echo "📊 Check the response above for any errors"
