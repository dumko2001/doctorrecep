#!/bin/bash

# Doctor Reception System - Vercel Deployment Script

set -e

echo "🚀 Deploying Doctor Reception Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_URL environment variable is required"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable is required"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required"
    exit 1
fi

if [ -z "$SESSION_SECRET" ]; then
    echo "❌ SESSION_SECRET environment variable is required"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ NEXT_PUBLIC_API_URL environment variable is required"
    echo "   This should be your Cloud Run API URL"
    exit 1
fi

echo "📋 Configuration:"
echo "   Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "   API URL: $NEXT_PUBLIC_API_URL"
echo "   Environment: production"

# Login to Vercel (if not already logged in)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "   Please login to Vercel:"
    vercel login
fi

# Set environment variables in Vercel
echo "🔧 Setting environment variables..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "$NEXT_PUBLIC_SUPABASE_URL"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
vercel env add SUPABASE_SERVICE_ROLE_KEY production <<< "$SUPABASE_SERVICE_ROLE_KEY"
vercel env add SESSION_SECRET production <<< "$SESSION_SECRET"
vercel env add NEXT_PUBLIC_API_URL production <<< "$NEXT_PUBLIC_API_URL"
vercel env add NODE_ENV production <<< "production"

# Deploy to production
echo "🏗️ Deploying to production..."
vercel --prod

echo "✅ Frontend deployment completed successfully!"
echo "🌐 Your app is now live on Vercel"
echo "📱 The app is PWA-ready for mobile installation"
