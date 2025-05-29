"""
Doctor Reception System - Python Backend
Using FastAPI and Google Gemini 2.5 Flash Preview with Base64 Inline Data
"""

import os
import logging
import mimetypes
import asyncio
from typing import List, Optional, Tuple, Any # Added Any for gather results
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import httpx
import tempfile
# import aiofiles # Removed as it's not used
from datetime import datetime
from urllib.parse import urlparse
import ffmpeg
import io
from PIL import Image
from google import genai
from google.genai import types # Correctly placed at top level

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

# Context manager for Gemini client
class GeminiClientManager:
    """Context manager for Gemini client"""
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.client = None

    async def __aenter__(self):
        try:
            # This instantiation is synchronous. If it ever becomes blocking,
            # it might need to be wrapped in asyncio.to_thread as well.
            # For now, SDK client instantiations are typically lightweight.
            self.client = genai.Client(api_key=self.api_key)
            logger.info("✅ Gemini client initialized successfully")
            return self.client
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini client: {e}")
            raise

    async def __aexit__(self, exc_type, exc_value, traceback):
        if self.client:
            # The google-generativeai client typically manages its own connections.
            # client.aio (AsyncGenerativeModel) does not have a .close() method.
            # Explicitly closing might not be necessary or supported this way.
            # If specific cleanup is needed, refer to SDK documentation.
            # Commenting out the erroneous close call.
            # try:
            #     await self.client.aio.close() # This line caused an AttributeError
            #     logger.info("✅ Gemini client closed successfully")
            # except Exception as e:
            #     logger.error(f"❌ Error closing Gemini client: {e}")
            logger.info("✅ Gemini client manager exiting.")


# Initialize Gemini client manager
gemini_manager = GeminiClientManager(api_key=os.getenv("GEMINI_API_KEY"))

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
    client_connected = False
    try:
        # Temporarily enter the context to check client initialization
        # This is a lightweight check.
        temp_client = genai.Client(api_key=gemini_manager.api_key)
        if temp_client: # Basic check if client object was created
            client_connected = True
        # Note: A more robust check would involve making a lightweight API call,
        # but that might incur costs or have rate limits.
    except Exception:
        client_connected = False

    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "gemini_client": "connected" if client_connected else "disconnected (initialization check)",
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

async def detect_mime_type(url: str, content_type: str) -> str:
    """Detect MIME type from URL and content-type header"""
    if content_type:
        mime_type = get_mime_type_from_content_type(content_type)
        if mime_type:
            return mime_type
    
    url_extension = get_file_extension_from_url(url)
    if url_extension:
        guessed_type_tuple = await asyncio.to_thread(mimetypes.guess_type, f"file.{url_extension}")
        guessed_type = guessed_type_tuple[0] if guessed_type_tuple else None
        if guessed_type:
            return guessed_type
        
        extension_map = {
            'mp3': 'audio/mpeg', 'wav': 'audio/wav', 'm4a': 'audio/mp4',
            'webm': 'audio/webm', 'ogg': 'audio/ogg', 'aac': 'audio/aac',
            'flac': 'audio/flac', 'jpg': 'image/jpeg', 'jpeg': 'image/jpeg',
            'png': 'image/png', 'webp': 'image/webp', 'heic': 'image/heic'
        }
        return extension_map.get(url_extension, 'application/octet-stream')
    
    return 'application/octet-stream'

async def download_file_from_url(url: str) -> tuple[bytes, str]:
    """Download file from URL and return bytes with detected MIME type"""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client_http:
            response = await client_http.get(url)
            response.raise_for_status()
            content_type = response.headers.get("content-type", "")
            mime_type = await detect_mime_type(url, content_type)
            logger.info(f"📥 Downloaded file: {url} (MIME: {mime_type}, Size: {len(response.content)} bytes)")
            return response.content, mime_type
    except Exception as e:
        logger.error(f"Failed to download file from {url}: {e}")
        raise HTTPException(status_code=400, detail=f"Failed to download file from {url}: {str(e)}")

async def convert_audio_to_wav(file_bytes: bytes) -> tuple[bytes, str]:
    """Convert audio to WAV format with 16kHz mono"""
    def _blocking_ffmpeg_operations():
        tmp_in_name, tmp_out_name = None, None
        try:
            with tempfile.NamedTemporaryFile(suffix='.tmp', delete=False) as tmp_in:
                tmp_in_name = tmp_in.name
                tmp_in.write(file_bytes)
                tmp_in.flush()
            
            with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_out:
                tmp_out_name = tmp_out.name

            process = (
                ffmpeg
                .input(tmp_in_name)
                .output(tmp_out_name, acodec='pcm_s16le', ac=1, ar=16000)
                .overwrite_output()
                .run_async(pipe_stdout=True, pipe_stderr=True)
            )
            stdout, stderr = process.communicate()
            if process.returncode != 0:
                raise RuntimeError(f"FFmpeg failed: {stderr.decode() if stderr else 'Unknown error'}")
            with open(tmp_out_name, 'rb') as f:
                wav_bytes = f.read()
            return wav_bytes, 'audio/wav'
        finally:
            if tmp_in_name:
                try: os.unlink(tmp_in_name)
                except OSError: pass
            if tmp_out_name:
                try: os.unlink(tmp_out_name)
                except OSError: pass
                    
    return await asyncio.to_thread(_blocking_ffmpeg_operations)

async def convert_image_to_png(file_bytes: bytes, max_size: int = 1024) -> tuple[bytes, str]:
    """Convert image to PNG format and resize if needed"""
    def _blocking_pil_operations():
        img = Image.open(io.BytesIO(file_bytes))
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        width, height = img.size
        if width > max_size or height > max_size:
            ratio = min(max_size/width, max_size/height)
            new_width = int(width * ratio)
            new_height = int(height * ratio)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        output = io.BytesIO()
        img.save(output, format='PNG', optimize=True)
        png_bytes = output.getvalue()
        return png_bytes, 'image/png'
        
    return await asyncio.to_thread(_blocking_pil_operations)

# Modified return type to be more consistent for easier processing after gather
async def process_single_audio_file(audio_url: str, audio_file_identifier: str) -> Tuple[Optional[types.Part], str, str, Optional[str]]:
    """Process a single audio file. Returns (part, identifier, url, error_message_if_any)."""
    logger.info(f"📤 Processing {audio_file_identifier} audio file: {audio_url}")
    try:
        file_bytes, _ = await download_file_from_url(audio_url)
        wav_bytes, wav_mime_type = await convert_audio_to_wav(file_bytes)
        audio_part = types.Part.from_bytes(data=wav_bytes, mime_type=wav_mime_type)
        logger.info(f"✅ {audio_file_identifier.replace('_', ' ').capitalize()} audio processed successfully (MIME: {wav_mime_type}, Size: {len(wav_bytes)} bytes)")
        return audio_part, audio_file_identifier, audio_url, None
    except Exception as e:
        error_msg = f"Failed to process {audio_file_identifier} audio {audio_url}: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return None, audio_file_identifier, audio_url, error_msg

# Modified return type to be more consistent
async def process_single_image_file(image_url: str, image_file_identifier: str) -> Tuple[Optional[types.Part], str, str, Optional[str]]:
    """Process a single image file. Returns (part, identifier, url, error_message_if_any)."""
    logger.info(f"📤 Processing {image_file_identifier} image file: {image_url}")
    try:
        file_bytes, _ = await download_file_from_url(image_url)
        png_bytes, png_mime_type = await convert_image_to_png(file_bytes)
        image_part = types.Part.from_bytes(data=png_bytes, mime_type=png_mime_type)
        logger.info(f"✅ {image_file_identifier.replace('_', ' ').capitalize()} image processed successfully (MIME: {png_mime_type}, Size: {len(png_bytes)} bytes)")
        return image_part, image_file_identifier, image_url, None
    except Exception as e:
        error_msg = f"Failed to process {image_file_identifier} image {image_url}: {str(e)}"
        logger.error(f"❌ {error_msg}")
        return None, image_file_identifier, image_url, error_msg

@app.post("/api/generate-summary", response_model=GenerateSummaryResponse)
async def generate_summary(request: GenerateSummaryRequest):
    """Generate AI summary using Gemini 2.5 Flash Preview with Base64 Inline Data"""

    async with gemini_manager as client: # client from context manager
        if not client: # Should be handled by __aenter__ raising an error
             raise HTTPException(status_code=503, detail="Gemini client not available")

        logger.info("🎯 Processing consultation with Gemini 2.5 Flash Preview (Base64 Inline Data)...")

        try:
            prompt = generate_prompt(request.template_config, request.submitted_by)
            contents: List[Any] = [prompt] # Use Any for mixed Part/str types initially
            files_processed = {"audio": 0, "images": 0, "errors": []}
            
            all_file_processing_tasks = []

            # Prepare audio tasks
            all_audio_urls = [request.primary_audio_url] + (request.additional_audio_urls or [])
            logger.info(f"🎵 Preparing {len(all_audio_urls)} audio file task(s)...")
            for i, audio_url in enumerate(all_audio_urls):
                file_identifier = f"primary_audio" if i == 0 else f"additional_audio_{i}"
                all_file_processing_tasks.append(
                    process_single_audio_file(audio_url, file_identifier)
                )

            # Prepare image tasks
            image_urls = request.image_urls or []
            logger.info(f"🖼️ Preparing {len(image_urls)} image file task(s)...")
            for i, image_url in enumerate(image_urls):
                file_identifier = f"image_{i}"
                all_file_processing_tasks.append(
                    process_single_image_file(image_url, file_identifier)
                )
            
            if not all_file_processing_tasks:
                 logger.warning("No files to process.")
                 # Decide if this should be an error or proceed with only prompt
                 # For now, assuming at least primary_audio_url is always there.

            logger.info(f"🚀 Launching processing for {len(all_file_processing_tasks)} files concurrently...")
            # We are using return_exceptions=False here because process_single_* functions
            # now catch their own exceptions and return an error message.
            # If they were to raise exceptions, gather would stop on first error.
            # To handle individual errors and continue, we'll check the error_msg in results.
            # Using return_exceptions=True is also an option, then result could be an Exception object.
            # For this pattern (returning error messages), False is fine.
            all_results = await asyncio.gather(*all_file_processing_tasks) # No return_exceptions needed with current error handling

            for result_tuple in all_results:
                part, identifier, url, error_message = result_tuple
                
                if error_message:
                    files_processed["errors"].append(error_message)
                    # Optionally, you could add more details like which URL failed
                    # logger.error(f"Error processing {identifier} from {url}: {error_message}")
                elif part:
                    contents.append(part)
                    if "audio" in identifier:
                        files_processed["audio"] += 1
                    elif "image" in identifier:
                        files_processed["images"] += 1
                else:
                    # This case should ideally not happen if error_message is set when part is None
                    unknown_error_msg = f"Unknown issue processing {identifier} from {url} - no part and no error message."
                    logger.error(unknown_error_msg)
                    files_processed["errors"].append(unknown_error_msg)


            total_files_successfully_processed = files_processed["audio"] + files_processed["images"]
            logger.info(f"🤖 Generating summary with Gemini 2.5 Flash Preview...")
            logger.info(f"📊 Total files successfully processed for Gemini: {total_files_successfully_processed} ({files_processed['audio']} audio + {files_processed['images']} images)")

            if files_processed["errors"]:
                logger.warning(f"⚠️ {len(files_processed['errors'])} file(s) had processing errors: {files_processed['errors']}")

            if total_files_successfully_processed == 0 and not request.primary_audio_url: # Or more robust check
                 # If even the primary audio failed or no files were ever meant to be processed (unlikely with schema)
                 raise HTTPException(status_code=400, detail="No files were successfully processed to generate a summary.")
            
            # Ensure contents for Gemini are of type List[Part | str]
            gemini_contents: List[types.Part | str] = []
            for item in contents:
                if isinstance(item, (types.Part, str)):
                    gemini_contents.append(item)
                else:
                    logger.warning(f"Skipping unexpected item type in contents: {type(item)}")


                   # Log content structure for debugging
            for idx, item in enumerate(gemini_contents):
                if isinstance(item, str):
                    logger.info(f"gemini_contents[{idx}] type: str (prompt) length: {len(item)}")
                elif isinstance(item, types.Part):
                    # Access mime_type via inline_data for parts created from bytes
                    if hasattr(item, 'inline_data') and item.inline_data:
                        logger.info(f"gemini_contents[{idx}] type: Part, mime_type: {item.inline_data.mime_type}")
                    elif hasattr(item, 'text') and item.text: # Handle parts that might just be text
                        logger.info(f"gemini_contents[{idx}] type: Part (text only), length: {len(item.text)}")
                    else:
                        logger.info(f"gemini_contents[{idx}] type: Part (structure not logged in detail)")
                # The 'else' case for unknown types in gemini_contents should ideally not be hit
                # because you filter gemini_contents to be List[types.Part | str]
                # else:
                #    logger.info(f"gemini_contents[{idx}] type: {type(item)} (unexpected type in gemini_contents)")
            response = await client.aio.models.generate_content(
                model="gemini-2.0-flash",
                contents=gemini_contents # Use the filtered and typed list
            )

            summary_text = response.text
            logger.info(f"✅ Summary generated successfully ({len(summary_text)} characters)")
            logger.info(f"📈 Processing complete: {files_processed['audio']} audio + {files_processed['images']} images processed successfully.")

            return GenerateSummaryResponse(
                summary=summary_text,
                model="gemini-2.0-flash",
                timestamp=datetime.now().isoformat(),
                files_processed=files_processed
            )

        except HTTPException: # Re-raise HTTPExceptions directly
            raise
        except Exception as e:
            logger.error(f"❌ Error generating summary: {e}", exc_info=True) # Add exc_info for traceback
            raise HTTPException(
                status_code=500,
                detail=f"Failed to generate summary: {str(e)}"
            )

# Error handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception caught by handler: {exc}", exc_info=True) # Add exc_info
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "detail": str(exc)}
    )

# Add a startup event to log environment info
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 Application starting up...")
    # Example: You might want to log the detected environment (dev, staging, prod)
    # logger.info(f"Environment: {os.getenv('APP_ENV', 'development')}")

if __name__ == "__main__":
    # For local development only
    import uvicorn
    # The app object is already defined, no need to use "main:app" string for uvicorn.run when in the same file.
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", 8080)), log_level="info")