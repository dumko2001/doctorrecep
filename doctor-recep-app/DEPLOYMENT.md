# Deployment Guide - Doctor Reception System

This guide will help you deploy both the frontend (Next.js) and backend (Python FastAPI) to production.

## Prerequisites

- Google Cloud account with billing enabled
- Supabase account with configured storage buckets
- Vercel account (for frontend)
- Gemini API key
- Domain name (optional but recommended)

## Step 1: Backend Deployment (Google Cloud Run)

### 1.1 Setup Google Cloud Project

```bash
# Install Google Cloud CLI
# https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 1.2 Deploy Python Backend API

```bash
# Navigate to python-backend directory
cd python-backend

# Set required environment variables
export PROJECT_ID=your-gcp-project-id
export GEMINI_API_KEY=your_gemini_api_key
export FRONTEND_URL=https://your-frontend-domain.com

# Deploy using the automated script
./deploy.sh

# Or deploy manually:
gcloud builds submit --config cloudbuild.yaml
```

### 1.3 Verify Deployment

```bash
# Get the service URL
SERVICE_URL=$(gcloud run services describe doctor-recep-api --region=us-central1 --format="value(status.url)")

# Test health endpoint
curl $SERVICE_URL/health

# View API documentation
open $SERVICE_URL/docs
```

## Step 2: Database Setup (Supabase)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the database to be ready

### 2.2 Run Database Schema

1. Go to SQL Editor in Supabase dashboard
2. Copy and paste the contents of `database/schema.sql`
3. Run the query to create tables and policies

### 2.3 Configure Storage Buckets

1. Go to Storage in Supabase dashboard
2. Create two buckets:
   - `consultation-audio` (for audio files)
   - `consultation-images` (for image files)
3. Set up RLS policies for each bucket:
   - Allow service_role to INSERT (for uploads)
   - Allow public to SELECT (for downloads)

### 2.4 Configure Authentication

1. Go to Authentication > Settings
2. Configure your site URL
3. Add redirect URLs for your domain

## Step 3: Frontend Deployment (Vercel)

### 3.1 Prepare Environment Variables

Set the following environment variables:

```bash
# Supabase Configuration
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
export SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Session Secret (generate a random 32-character string)
export SESSION_SECRET=your_32_character_random_string

# Backend API URL (from Cloud Run deployment)
export NEXT_PUBLIC_API_URL=https://doctor-recep-api-xxx-uc.a.run.app
```

### 3.2 Deploy to Vercel

```bash
# Navigate to project root
cd doctor-recep-app

# Deploy using the automated script
./deploy-frontend.sh

# Or deploy manually:
npm i -g vercel
vercel login
vercel --prod
```

### 3.3 Verify Frontend Deployment

1. Visit your Vercel deployment URL
2. Test the PWA installation on mobile
3. Verify all features work correctly
4. Check that API calls reach your Cloud Run backend

## Step 4: Domain Configuration

### 4.1 Custom Domain (Optional)

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed

### 4.2 Update CORS Settings

Update your backend environment variables with the final domain:

```bash
gcloud run services update doctor-recep-api \
  --region us-central1 \
  --set-env-vars="FRONTEND_URL=https://your-final-domain.com"
```

## Step 5: PWA Configuration

### 5.1 Generate Icons

Create PWA icons in the following sizes and place in `public/icons/`:
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

You can use tools like:
- [PWA Icon Generator](https://www.pwabuilder.com/imageGenerator)
- [Favicon.io](https://favicon.io/)

### 5.2 Test PWA

1. Open your deployed app in Chrome
2. Check for "Install app" option in address bar
3. Test offline functionality
4. Verify manifest.json is accessible at `/manifest.json`

## Step 6: Testing & Verification

### 6.1 Test Complete Flow

1. **Registration**: Create a new doctor account
2. **Recording**: Test audio recording and image upload
3. **AI Generation**: Submit consultation and generate summary
4. **Dashboard**: Review and approve summaries

### 6.2 Performance Testing

```bash
# Test API endpoints
curl https://your-api-url.com/health
curl -X POST https://your-api-url.com/api/generate-summary \
  -H "Content-Type: application/json" \
  -d '{"audio_base64":"test","template_config":{},"submitted_by":"doctor"}'
```

### 6.3 Mobile Testing

1. Test on actual mobile devices
2. Verify PWA installation works
3. Test camera and microphone permissions
4. Check responsive design

## Step 7: Monitoring & Maintenance

### 7.1 Set Up Monitoring

1. **Google Cloud Monitoring**: Monitor Cloud Run performance
2. **Vercel Analytics**: Track frontend performance
3. **Supabase Dashboard**: Monitor database usage

### 7.2 Backup Strategy

1. **Database**: Supabase provides automatic backups
2. **Code**: Ensure code is in version control
3. **Environment Variables**: Keep secure backup of all env vars

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check FRONTEND_URL environment variable
2. **Database Connection**: Verify Supabase credentials
3. **API Timeouts**: Check Cloud Run memory/CPU limits
4. **PWA Not Installing**: Verify manifest.json and HTTPS

### Logs

```bash
# View Cloud Run logs
gcloud logs read --service=doctor-recep-api --region=us-central1

# View Vercel logs
vercel logs your-deployment-url
```

## Security Checklist

- [ ] All environment variables are secure
- [ ] HTTPS is enabled everywhere
- [ ] Database RLS policies are active
- [ ] API rate limiting is configured
- [ ] File upload size limits are set
- [ ] Session security is properly configured

## Cost Optimization

1. **Cloud Run**: Set max instances and CPU limits
2. **Supabase**: Monitor database usage
3. **Vercel**: Use appropriate plan for your usage
4. **Gemini API**: Monitor API usage and costs

---

Your Doctor Reception System is now deployed and ready for production use!

For support, check the main README.md or create an issue in the repository.
