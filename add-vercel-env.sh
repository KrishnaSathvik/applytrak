#!/bin/bash

echo "🚀 Adding Vercel Environment Variables..."

# Supabase Configuration
echo "Adding REACT_APP_SUPABASE_URL..."
vercel env add REACT_APP_SUPABASE_URL production <<< "https://ihlaenwiyxtmkehfoesg.supabase.co"

echo "Adding REACT_APP_SUPABASE_ANON_KEY..."
vercel env add REACT_APP_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0Mjk1NDMsImV4cCI6MjA3MDAwNTU0M30.rkubJuDwXZN411f341hHvoUejy8Bj2BdjsDrZsceV_o"

echo "Adding REACT_APP_FUNCTIONS_BASE..."
vercel env add REACT_APP_FUNCTIONS_BASE production <<< "https://ihlaenwiyxtmkehfoesg.supabase.co/functions/v1"

# Application Configuration
echo "Adding REACT_APP_NAME..."
vercel env add REACT_APP_NAME production <<< "ApplyTrak"

echo "Adding REACT_APP_DESCRIPTION..."
vercel env add REACT_APP_DESCRIPTION production <<< "Track your job search journey"

echo "Adding REACT_APP_URL..."
vercel env add REACT_APP_URL production <<< "https://applytrak.com"

# Server-side Configuration
echo "Adding SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlobGFlbndpeXh0bWtlaGZvZXNnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQyOTU0MywiZXhwIjoyMDcwMDA1NTQzfQ.jZMxPrFq1yiwRHSrJhlyfkAWeA7IIRgsmRG4UkFh-Fg"

echo "✅ All environment variables added successfully!"
echo "🔄 Redeploy your project to apply changes"
