
1. Authentication & Multi-Tenancy

Auth Service: Supabase Auth
Users: One account per doctor; receptionist shares that login
Tenancy: Every record (consultation, template) is scoped by doctor_id via Supabase Row-Level Security
2. Data Model (Postgres on Supabase)

-- Doctors
CREATE TABLE doctors (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  template_config JSONB NOT NULL  -- prescription format, sections, tone, language
);

-- Consultations (one per patient visit)
CREATE TABLE consultations (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id),
  submitted_by TEXT CHECK (submitted_by IN ('doctor','receptionist')) NOT NULL,
  audio_base64 TEXT NOT NULL,       -- base64-encoded audio
  image_base64 TEXT NULL,           -- OPTIONAL photo of scribble
  ai_generated_note TEXT,
  edited_note TEXT,
  status TEXT CHECK (status IN ('pending','generated','approved')) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
3. Storage

Audio & Image: Sent as base64 strings in JSON to your API—no separate file service needed
Consultations: Stored entirely in Postgres rows
4. Backend APIs (Deployed on Cloud Run)

All endpoints accept/return JSON over HTTPS with JWT auth from Supabase.

POST /v1/consultations
Body: { audio_base64, image_base64?, submitted_by }
Action: Insert row with status = 'pending'
POST /v1/consultations/{id}/generate
Action:
Fetch consultation + doctor’s template_config
Build LLM prompt:
Context: submission by [submitted_by]
Template: [template_config]
Transcript & OCR inputs: [audio_base64 → Gemini], [image_base64 → Gemini]
Task: “Generate patient summary with prescription, advice, follow-up.”
Send base64 audio & image directly to Gemini multimodal API
Receive text → save to ai_generated_note, set status = 'generated'
POST /v1/consultations/{id}/approve
Body: { edited_note }
Action: Update edited_note, set status = 'approved'
GET /v1/consultations?status=pending|generated
Action: Return list scoped to doctor_id
5. Frontend Apps (Next.js + Tailwind)

A. Doctor Mobile (PWA) – /mobile
UI Elements:
🎙️ Start/Stop Recording (records to base64)
📷 Upload Photo (captures to base64)
✅ Submit (calls POST /v1/consultations)
Client-Side Retry: On upload failure, retry up to 3× with exponential back-off
Tech Notes: Async functions for recording + upload to maximize concurrency
B. Receptionist Dashboard – /dashboard
UI Elements:
Pending Consults List (Consult #, timestamp)
“Generate Summary” button (calls POST /v1/consultations/{id}/generate)
Editable Rich-text Box pre-filled with ai_generated_note
“Approve” button (calls POST /v1/consultations/{id}/approve)
“Print” / “Copy Reminder” controls
Client-Side Retry: Wrap LLM generation and approve calls in retry logic
Async Handling: Non-blocking UI—use Promise.all for concurrent API calls if batching
6. LLM Integration

Model: Google Gemini or equivalent multimodal API
Input: Base64 audio + Base64 image + dynamic prompt (injected from template_config + submitted_by flag)
Output: Plain text summary
7. Operations & Scaling

Cloud Run Concurrency: Set concurrency to 80 to maximize instance utilization
Auto-Scaling: CPU-based scaling up to 10 instances initially
Monitoring: Use Stackdriver (Cloud Monitoring) on Cloud Run to track errors and latencies
Security: All traffic over HTTPS; JWT validation via Supabase Auth in Cloud Run service
📊 Summary of Responsibilities
Component	Responsibility
Supabase Auth/DB	User auth, data storage, multi-tenancy security
Cloud Run API	Audio/image ingestion, LLM orchestration, status transitions
Next.js Frontend	Mobile PWA for doctors; Dashboard for receptionists
Gemini API	Transcription + OCR + content generation
Client-Side Logic	Retry logic, async uploads, user interactions
This is the complete, production-ready stack you deploy for each doctor. No assumptions—just what we discussed, fully aligned to your requirements.