#!/bin/bash

# ============================================================================
# TEST EMAIL PREFERENCES FUNCTION
# ============================================================================
# This script tests the email preferences function directly

echo "🧪 Testing Email Preferences Function..."

# Get user ID 1's external ID first
echo "📋 Getting user external ID..."
USER_EXTERNAL_ID=$(curl -s "https://ihlaenwiyxtmkehfoesg.supabase.co/rest/v1/users?select=externalid&id=eq.1" \
  -H "Authorization: Bearer $REACT_APP_SUPABASE_ANON_KEY" \
  -H "apikey: $REACT_APP_SUPABASE_ANON_KEY" | \
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
