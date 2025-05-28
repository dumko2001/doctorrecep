
What You Are Building — Complete Product Description for Developer

Product Overview

You are building a Doctor Voice & Image-Based Patient Summary Automation System designed for Indian small and mid-size clinics and hospitals.

Core Value:
Help doctors and their receptionists quickly generate clean, professional patient visit summaries, prescriptions, and follow-up instructions from voice recordings and optionally handwritten notes/photos—reducing manual transcription time and errors.

Key User Roles & Access

Doctor:
Logs into mobile app or PWA on phone
Records patient visit audio by tapping “start” and “stop”
Optionally uploads a photo of handwritten notes or scribbles
Submits audio + image to generate draft patient summary
Receptionist:
Logs into desktop dashboard with same doctor credentials
Reviews AI-generated patient summaries in an editable text box
Fixes typos, confirms medication, adds/removes details
Approves and sends summary via WhatsApp or prints it for the patient
Detailed Workflow

Doctor logs in on mobile → records patient consultation audio + uploads photo if needed → submits to system
System stores audio + photo (base64) in database, marks status “pending”
Receptionist logs in on desktop → sees pending submissions list
Receptionist clicks “Generate Summary” → system calls LLM API with audio + image data + doctor-specific templates
AI returns draft patient summary → receptionist edits if needed
Receptionist approves final note → can print or send via WhatsApp
Consultation status updates to “approved”
Why This Matters

Doctors spend less time writing and transcribing notes
Receptionists reduce errors and workload
Clinics move from paper/manual WhatsApp workflows to scalable digital system
Templates and role-based LLM prompts ensure consistent, doctor-preferred output style
Important Notes for Developer

Single login per doctor: same credentials for doctor and receptionist
Submissions tagged internally as from doctor or receptionist for AI prompt tuning
Doctor uses mobile app only for recording + submission
Receptionist uses desktop dashboard only for reviewing + editing + sending
All data scoped to doctor_id to support multi-tenancy and data isolation
Audio and images sent and stored as base64 strings
Use Cloud Run for backend APIs (safe, scalable)
Use Supabase for Auth and Postgres DB
Use Gemini (or equivalent) LLM API for multimodal transcription + summary generation
Frontend built in Next.js (mobile and dashboard versions) with Tailwind CSS
Client-side upload and AI API calls include retry logic for robustness
What This Does Not Include (for clarity)

No complex role-based UI toggling — doctor and receptionist simply use their respective URLs
No separate receptionist accounts — receptionist logs in as the doctor
No on-premises or offline support — fully cloud-based
No Whisper or separate ASR — audio sent directly to Gemini
No file storage services — base64 blobs stored in Postgres
No advanced EMR or billing integration in this MVP
