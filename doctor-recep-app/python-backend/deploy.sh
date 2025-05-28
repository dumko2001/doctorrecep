#!/bin/bash

# Doctor Reception System - Cloud Run Deployment Script

set -e

echo "🚀 Deploying Doctor Reception API to Google Cloud Run..."

# Check if required environment variables are set
if [ -z "$PROJECT_ID" ]; then
    echo "❌ PROJECT_ID environment variable is required"
    echo "   Set it with: export PROJECT_ID=your-gcp-project-id"
    exit 1
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo "❌ GEMINI_API_KEY environment variable is required"
    echo "   Set it with: export GEMINI_API_KEY=your-gemini-api-key"
    exit 1
fi

if [ -z "$FRONTEND_URL" ]; then
    echo "❌ FRONTEND_URL environment variable is required"
    echo "   Set it with: export FRONTEND_URL=https://your-frontend-domain.com"
    exit 1
fi

# Set default region if not provided
REGION=${REGION:-us-central1}

echo "📋 Configuration:"
echo "   Project ID: $PROJECT_ID"
echo "   Region: $REGION"
echo "   Frontend URL: $FRONTEND_URL"
echo "   Gemini API Key: [HIDDEN]"

# Authenticate with Google Cloud (if not already authenticated)
echo "🔐 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "   Please authenticate with Google Cloud:"
    gcloud auth login
fi

# Set the project
echo "🎯 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and deploy using Cloud Build
echo "🏗️ Building and deploying with Cloud Build..."
gcloud builds submit --config cloudbuild.yaml \
    --substitutions=_GEMINI_API_KEY="$GEMINI_API_KEY",_FRONTEND_URL="$FRONTEND_URL"

# Get the service URL
SERVICE_URL=$(gcloud run services describe doctor-recep-api --region=$REGION --format="value(status.url)")

echo "✅ Deployment completed successfully!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 Health check: $SERVICE_URL/health"
echo "📚 API docs: $SERVICE_URL/docs"

# Set environment variables
echo "🔧 Setting environment variables..."
gcloud run services update doctor-recep-api \
    --region=$REGION \
    --set-env-vars="GEMINI_API_KEY=$GEMINI_API_KEY,FRONTEND_URL=$FRONTEND_URL,PORT=8080"

echo "🎉 Doctor Reception API is now live at: $SERVICE_URL"
