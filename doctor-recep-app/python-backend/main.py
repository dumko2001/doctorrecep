"""
Doctor Reception System - Python Backend
Using FastAPI and Google Gemini 2.5 Flash Preview with Base64 Inline Data
"""

import os
import logging
import mimetypes
from typing import List, Optional
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import tempfile
import aiofiles
from datetime import datetime
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Doctor Reception API",
    description="AI-powered consultation summary system using Gemini 2.5 Flash with Base64 Inline Data",
    version="2.0.0"
)

# Configure CORS - keep it simple and working
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Gemini client
try:
    from google import genai
    from google.genai import types
    client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
    logger.info("✅ Gemini client initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize Gemini client: {e}")
    client = None

# Pydantic models
class TemplateConfig(BaseModel):
    prescription_format: str = "structured"
    language: str = "English"
    tone: str = "professional"
    sections: List[str] = [
        "Chief Complaint", "History", "Examination",
        "Diagnosis", "Treatment Plan", "Follow-up"
    ]

class GenerateSummaryRequest(BaseModel):
    primary_audio_url: str
    additional_audio_urls: Optional[List[str]] = []
    image_urls: Optional[List[str]] = []
    template_config: Optional[TemplateConfig] = TemplateConfig()
    submitted_by: str = "doctor"

class GenerateSummaryResponse(BaseModel):
    summary: str
    model: str
    timestamp: str
    files_processed: dict

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_client": "connected" if client else "disconnected",
        "model": "gemini-2.5-flash-preview-05-20"
    }

def generate_prompt(template_config: TemplateConfig, submitted_by: str) -> str:
    """Generate AI prompt based on template configuration"""
    context_note = (
        "This consultation was recorded by the doctor during patient visit."
        if submitted_by == "doctor"
        else "This consultation is being reviewed by the receptionist for final summary."
    )

    sections_text = ", ".join(template_config.sections)

    return f"""
You are an AI assistant helping Indian doctors create concise patient consultation summaries.

Context: {context_note}

IMPORTANT: Only include information that was actually mentioned by the doctor in the audio. Do not add assumptions, differential diagnoses, or recommendations not explicitly stated.

Requirements:
- Language: {template_config.language}
- Tone: {template_config.tone}
- Format: {template_config.prescription_format}
- Include sections: {sections_text}

Instructions:
1. **PRIMARY FOCUS**: Transcribe and analyze the audio recording(s) - this is the main source of information
2. Extract key medical information mentioned in the audio conversations
3. **SECONDARY**: If images are provided, analyze them and mention relevant visual findings (handwritten notes, prescriptions, medical images, etc.)
4. Process ALL audio files provided (primary + additional recordings) for complete context
5. Keep the summary concise and factual based on what was actually said/shown
6. Use appropriate medical terminology for Indian healthcare context
7. Only include medications, dosages, and advice explicitly mentioned by the doctor in audio
8. Do not add assumptions or recommendations not explicitly stated in the audio
9. If information is missing from audio, simply omit that section rather than noting it's missing
10. **IMPORTANT**: If images are provided, include a brief mention of visual findings or observations from the images in your summary

Please provide a concise, factual patient consultation summary based primarily on the audio recording(s), supplemented by any relevant visual information from images. If images are present, include observations about what is visible in them.
    """.strip()

def get_file_extension_from_url(url: str) -> str:
    """Extract file extension from URL"""
    parsed_url = urlparse(url)
    path = parsed_url.path
    if '.' in path:
        return path.split('.')[-1].lower()
    return ""

def get_mime_type_from_content_type(content_type: str) -> str:
    """Extract MIME type from content-type header"""
    if content_type:
        return content_type.split(';')[0].strip()
    return ""

def detect_mime_type(url: str, content_type: str) -> str:
    """Detect MIME type from URL and content-type header"""
    # First try content-type header
    if content_type:
        mime_type = get_mime_type_from_content_type(content_type)
        if mime_type:
            return mime_type
    
    # Fallback to URL extension
    url_extension = get_file_extension_from_url(url)
    if url_extension:
        # Use mimetypes to guess from extension
        guessed_type = mimetypes.guess_type(f"file.{url_extension}")[0]
        if guessed_type:
            return guessed_type
        
        # Manual mapping for common extensions
        extension_map = {
            'mp3': 'audio/mpeg',
            'wav': 'audio/wav',
            'm4a': 'audio/mp4',
            'webm': 'audio/webm',
            'ogg': 'audio/ogg',
            'aac': 'audio/aac',
            'flac': 'audio/flac',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'webp': 'image/webp',
            'heic': 'image/heic'
        }
        return extension_map.get(url_extension, 'application/octet-stream')
    
    return 'application/octet-stream'

async def download_file_from_url(url: str) -> tuple[bytes, str]:
    """Download file from URL and return bytes with detected MIME type"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client_http:
            response = await client_http.get(url)
            response.raise_for_status()

            # Get MIME type from response headers
            content_type = response.headers.get("content-type", "")
            
            # Detect the actual MIME type
            mime_type = detect_mime_type(url, content_type)
            
            logger.info(f"📥 Downloaded file: {url} (MIME: {mime_type}, Size: {len(response.content)} bytes)")

            return response.content, mime_type
            
    except Exception as e:
        logger.error(f"Failed to download file from {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download file: {str(e)}")

@app.post("/api/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest):
    """Generate AI summary using Gemini 2.5 Flash Preview with Base64 Inline Data"""

    if not client:
        raise HTTPException(status_code=500, detail="Gemini client not initialized")

    logger.info("🎯 Processing consultation with Gemini 2.5 Flash Preview (Base64 Inline Data)...")

    try:
        # Generate prompt
        prompt = generate_prompt(request.template_config, request.submitted_by)

        # Prepare content parts - start with the prompt
        contents = [prompt]
        files_processed = {"audio": 0, "images": 0, "errors": []}

        # Process all audio files (primary + additional)
        all_audio_urls = [request.primary_audio_url] + (request.additional_audio_urls or [])
        logger.info(f"🎵 Processing {len(all_audio_urls)} audio file(s): 1 primary + {len(request.additional_audio_urls or [])} additional")

        for i, audio_url in enumerate(all_audio_urls):
            try:
                file_type = "primary" if i == 0 else f"additional-{i}"
                logger.info(f"📤 Processing {file_type} audio file: {audio_url}")

                # Download file as bytes with MIME type detection
                file_bytes, mime_type = await download_file_from_url(audio_url)

                # Create Part from bytes
                audio_part = types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=mime_type
                )
                contents.append(audio_part)
                files_processed["audio"] += 1

                logger.info(f"✅ {file_type.capitalize()} audio processed successfully (MIME: {mime_type}, Size: {len(file_bytes)} bytes)")

            except Exception as e:
                error_msg = f"Failed to process {file_type} audio {audio_url}: {str(e)}"
                logger.error(f"❌ {error_msg}")
                files_processed["errors"].append(error_msg)

        # Process image files
        image_urls = request.image_urls or []
        logger.info(f"🖼️ Processing {len(image_urls)} image file(s)")

        for i, image_url in enumerate(image_urls):
            try:
                logger.info(f"📤 Processing image file {i+1}/{len(image_urls)}: {image_url}")

                # Download file as bytes with MIME type detection
                file_bytes, mime_type = await download_file_from_url(image_url)

                # Create Part from bytes
                image_part = types.Part.from_bytes(
                    data=file_bytes,
                    mime_type=mime_type
                )
                contents.append(image_part)
                files_processed["images"] += 1

                logger.info(f"✅ Image {i+1} processed successfully (MIME: {mime_type}, Size: {len(file_bytes)} bytes)")

            except Exception as e:
                error_msg = f"Failed to process image {i+1} {image_url}: {str(e)}"
                logger.error(f"❌ {error_msg}")
                files_processed["errors"].append(error_msg)

        # Generate content using Gemini 2.5 Flash Preview
        total_files = files_processed["audio"] + files_processed["images"]
        logger.info(f"🤖 Generating summary with Gemini 2.5 Flash Preview...")
        logger.info(f"📊 Total files being processed: {total_files} ({files_processed['audio']} audio + {files_processed['images']} images)")

        if files_processed["errors"]:
            logger.warning(f"⚠️ {len(files_processed['errors'])} file(s) failed to process: {files_processed['errors']}")

        if total_files == 0:
            raise HTTPException(status_code=400, detail="No files were successfully processed")

        # Log content structure for debugging
        for idx, item in enumerate(contents):
            if isinstance(item, str):
                logger.info(f"contents[{idx}] type: str (prompt) length: {len(item)}")
            else:
                logger.info(f"contents[{idx}] type: {type(item)} (file part)")

        response = client.models.generate_content(
            model="gemini-2.5-flash-preview-05-20",
            contents=contents
        )

        summary = response.text
        logger.info(f"✅ Summary generated successfully ({len(summary)} characters)")
        logger.info(f"📈 Processing complete: {files_processed['audio']} audio + {files_processed['images']} images processed")

        return GenerateSummaryResponse(
            summary=summary,
            model="gemini-2.5-flash-preview-05-20",
            timestamp=datetime.now().isoformat(),
            files_processed=files_processed
        )

    except Exception as e:
        logger.error(f"❌ Error generating summary: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate summary: {str(e)}"
        )

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8080))  # Cloud Run uses 8080 by default
    reload = os.getenv("NODE_ENV") != "production"  # Only reload in development

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=reload,
        log_level="info"
    )