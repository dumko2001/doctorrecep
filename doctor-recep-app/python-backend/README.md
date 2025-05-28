# Doctor Reception System - Python Backend

## 🎯 **What It Does**

The Python backend is a **FastAPI-based AI processing service** that powers the core functionality of the Doctor Reception System. It serves as the **AI brain** that processes audio recordings and images from medical consultations to generate intelligent summaries using Google's Gemini 2.5 Flash Preview model.

### **Core Functionality**
- **🎵 Audio Processing**: Downloads and processes multiple audio files (primary + additional recordings)
- **🖼️ Image Analysis**: Handles medical images, prescriptions, and handwritten notes
- **🤖 AI Generation**: Uses Gemini Files API to generate contextual medical summaries
- **📊 Dynamic File Handling**: Processes varying numbers of files (1-N audio, 0-N images)
- **🔄 Multi-format Support**: Handles various audio/image formats with proper MIME type detection

## 🏗️ **How It Works**

### **Architecture Overview**
```
Frontend (Next.js) → Python Backend (FastAPI) → Gemini Files API → AI Summary
                                ↓
                        Supabase Storage URLs
```

### **Request Flow**
1. **Receives Request**: Gets consultation data with Supabase storage URLs
2. **Downloads Files**: Fetches audio/image files from Supabase storage
3. **Uploads to Gemini**: Sends files to Gemini Files API with proper MIME types
4. **Generates Summary**: Uses Gemini 2.5 Flash Preview for AI processing
5. **Returns Response**: Sends back generated summary with processing metadata

### **Key Components**

#### **1. File Processing Pipeline**
```python
# Dynamic file handling
all_audio_urls = [primary_audio] + additional_audio_urls
for audio_url in all_audio_urls:
    local_path = await download_file_from_url(audio_url)
    uploaded_file = client.files.upload(file=local_path)
    contents.append(uploaded_file)
```

#### **2. MIME Type Detection**
- **Smart Detection**: Uses HTTP headers + URL extensions
- **Fallback Logic**: Handles cases where MIME type is missing
- **Format Support**: Audio (mp3, wav, webm, m4a) + Images (jpg, png, webp, heic)

#### **3. Error Handling**
- **Graceful Degradation**: Continues processing even if some files fail
- **Detailed Logging**: Comprehensive logs for debugging
- **Partial Success**: Returns summary even with some file upload failures

## 👥 **Who It's For**

### **Primary Users**
- **🩺 Doctors**: Generate AI summaries from consultation recordings
- **👩‍⚕️ Nurses**: Review and approve generated summaries
- **🏥 Clinics**: Multi-tenant system supporting multiple doctors

### **Technical Users**
- **DevOps Engineers**: Deploy and monitor the service
- **System Administrators**: Manage scaling and performance
- **Healthcare IT**: Integrate with existing clinic systems

## 🚀 **Production Deployment**

### **Google Cloud Run Deployment**
```bash
# Set environment variables
export PROJECT_ID=your-gcp-project
export GEMINI_API_KEY=your-gemini-key
export FRONTEND_URL=https://your-frontend.vercel.app

# Deploy
cd python-backend
./deploy.sh
```

### **Environment Variables**
```bash
# Required
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=https://your-frontend-domain.com
PORT=8080

# Optional
NODE_ENV=production
```

### **Docker Configuration**
- **Base Image**: Python 3.11 slim
- **Security**: Non-root user, minimal dependencies
- **Health Checks**: Built-in health monitoring
- **Port**: 8080 (Cloud Run standard)

## 📊 **Scalability & Performance**

### **Cloud Run Configuration**
- **Memory**: 2GB (handles large audio files)
- **CPU**: 2 vCPU (parallel file processing)
- **Concurrency**: 80 requests per instance
- **Max Instances**: 10 (auto-scaling)
- **Timeout**: 300 seconds (for large file processing)

### **Performance Optimizations**
- **Async Processing**: Non-blocking file downloads
- **Temporary Files**: Automatic cleanup after processing
- **HTTP Client**: Optimized with 30-second timeouts
- **Logging**: Structured logging for monitoring

## 🔒 **Security Features**

### **CORS Configuration**
- **Origin Control**: Only allows configured frontend URL
- **Credentials**: Supports authentication cookies
- **Methods**: Restricted to necessary HTTP methods

### **File Security**
- **Temporary Storage**: Files deleted immediately after processing
- **URL Validation**: Validates Supabase storage URLs
- **Size Limits**: Handled by frontend (50MB per file, 100MB total)

### **Error Handling**
- **No Data Leakage**: Generic error messages in production
- **Comprehensive Logging**: Detailed logs for debugging
- **Graceful Failures**: System continues operating with partial failures

## 🛠️ **Development Setup**

### **Local Development**
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GEMINI_API_KEY=your_key
export FRONTEND_URL=http://localhost:3000

# Run development server
python main.py
```

### **API Documentation**
- **Development**: http://localhost:8080/docs
- **Health Check**: http://localhost:8080/health
- **Interactive API**: Swagger UI available in development

## 📈 **Monitoring & Observability**

### **Health Monitoring**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "gemini_client": "connected",
  "model": "gemini-2.5-flash-preview-05-20"
}
```

### **Logging Structure**
- **Request Tracking**: Each request logged with unique identifiers
- **File Processing**: Detailed logs for each file upload/processing step
- **Error Tracking**: Comprehensive error logging with context
- **Performance Metrics**: Processing times and file counts

### **Cloud Run Monitoring**
- **Stackdriver Integration**: Automatic log aggregation
- **Performance Metrics**: CPU, memory, request latency
- **Error Rates**: Track failed requests and processing errors
- **Scaling Events**: Monitor auto-scaling behavior

## 🔧 **API Endpoints**

### **POST /api/generate-summary**
**Purpose**: Generate AI summary from consultation files

**Request Body**:
```json
{
  "primary_audio_url": "https://supabase-url/audio.mp3",
  "additional_audio_urls": ["https://supabase-url/audio2.wav"],
  "image_urls": ["https://supabase-url/image.jpg"],
  "template_config": {
    "prescription_format": "structured",
    "language": "English",
    "tone": "professional",
    "sections": ["symptoms", "diagnosis", "prescription"]
  },
  "submitted_by": "doctor"
}
```

**Response**:
```json
{
  "summary": "Generated medical summary...",
  "model": "gemini-2.5-flash-preview-05-20",
  "timestamp": "2024-01-01T00:00:00Z",
  "files_processed": {
    "audio": 2,
    "images": 1,
    "errors": []
  }
}
```

### **GET /health**
**Purpose**: Health check for monitoring and load balancers

## 🎯 **Key Benefits**

1. **🚀 Scalable**: Auto-scales based on demand
2. **🔒 Secure**: Proper CORS, error handling, and file cleanup
3. **📊 Observable**: Comprehensive logging and monitoring
4. **🔄 Reliable**: Graceful error handling and partial success support
5. **⚡ Fast**: Optimized for concurrent file processing
6. **🌐 Production-Ready**: Designed for real-world healthcare environments

## 🤝 **Integration Points**

- **Frontend**: Receives requests from Next.js application
- **Supabase Storage**: Downloads files from storage URLs
- **Gemini API**: Uploads files and generates summaries
- **Cloud Run**: Deployed as containerized service
- **Monitoring**: Integrates with Google Cloud monitoring stack
