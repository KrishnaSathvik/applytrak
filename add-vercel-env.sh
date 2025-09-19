#!/bin/bash

echo "🚀 Adding Vercel Environment Variables..."

# Supabase Configuration
echo "Adding REACT_APP_SUPABASE_URL..."
vercel env add REACT_APP_SUPABASE_URL production <<< "https://ihlaenwiyxtmkehfoesg.supabase.co"

echo "Adding REACT_APP_SUPABASE_ANON_KEY..."
echo "Please manually add REACT_APP_SUPABASE_ANON_KEY to Vercel environment variables"

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
echo "Please manually add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables"

echo "✅ All environment variables added successfully!"
echo "🔄 Redeploy your project to apply changes"
