#!/bin/bash

# ============================================================================
# TRIGGER WELCOME EMAIL FOR USER ID 1
# ============================================================================
# This script manually triggers the welcome email for user ID 1

echo "🚀 Triggering welcome email for user ID 1..."

# Set your Supabase function URL
FUNCTIONS_BASE="https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1"

# User details (update these if needed)
USER_EMAIL="krishnasathvikm@gmail.com"
USER_NAME="Krishna"

echo "📧 Sending welcome email to: $USER_EMAIL"
echo "👤 User name: $USER_NAME"

# Call the welcome email function
curl -X POST "$FUNCTIONS_BASE/welcome-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o" \
  -d "{
    \"email\": \"$USER_EMAIL\",
    \"name\": \"$USER_NAME\"
  }" \
  -v

echo ""
echo "✅ Welcome email request sent!"
echo "📧 Check your email inbox for the welcome email."
echo "📊 Check Supabase Functions logs for any errors."
