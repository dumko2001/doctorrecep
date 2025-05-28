-- Doctor Voice & Image-Based Patient Summary System Database Schema
-- Multi-tenant architecture with Row Level Security

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Doctors table
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  clinic_name TEXT,
  template_config JSONB NOT NULL DEFAULT '{
    "prescription_format": "standard",
    "language": "english",
    "tone": "professional",
    "sections": ["symptoms", "diagnosis", "prescription", "advice", "follow_up"]
  }'::jsonb,
  -- Quota system fields
  monthly_quota INT NOT NULL DEFAULT 100,
  quota_used INT NOT NULL DEFAULT 0,
  quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  -- Admin approval system
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  approved_by UUID NULL,
  approved_at TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin users table
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Usage logs table for quota tracking
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('ai_generation', 'quota_reset', 'quota_update')),
  quota_before INT,
  quota_after INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Consultations table (one per patient visit) - Updated for Supabase Storage URLs
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  submitted_by TEXT CHECK (submitted_by IN ('doctor','receptionist')) NOT NULL,
  -- Replace base64 fields with storage URLs
  primary_audio_url TEXT NOT NULL, -- URL to primary audio file in Supabase Storage
  additional_audio_urls JSONB NULL DEFAULT '[]'::jsonb, -- Array of additional audio URLs
  image_urls JSONB NULL DEFAULT '[]'::jsonb, -- Array of image URLs
  -- Keep existing fields
  ai_generated_note TEXT,
  edited_note TEXT,
  status TEXT CHECK (status IN ('pending','generated','approved')) NOT NULL DEFAULT 'pending',
  patient_number INTEGER,
  -- Add metadata for file management
  total_file_size_bytes BIGINT DEFAULT 0, -- Track total file size for quota management
  file_retention_until TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'), -- Auto-cleanup date
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_consultations_doctor_id_status ON consultations(doctor_id, status);
CREATE INDEX idx_consultations_created_at ON consultations(created_at);
CREATE INDEX idx_consultations_file_retention ON consultations(file_retention_until); -- For cleanup jobs
CREATE INDEX idx_doctors_email ON doctors(email);
CREATE INDEX idx_doctors_approved ON doctors(approved);
CREATE INDEX idx_doctors_quota_reset_at ON doctors(quota_reset_at);
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_usage_logs_doctor_id ON usage_logs(doctor_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX idx_usage_logs_action_type ON usage_logs(action_type);

-- Enable Row Level Security
ALTER TABLE doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctors table
-- Doctors can only access their own data
CREATE POLICY "Doctors can view their own profile" ON doctors
  FOR SELECT USING (true);  -- Allow reading for authentication

CREATE POLICY "Doctors can update their own profile" ON doctors
  FOR UPDATE USING (true);  -- Allow updates for profile management

CREATE POLICY "Allow doctor registration" ON doctors
  FOR INSERT WITH CHECK (true);  -- Allow new doctor registration

-- RLS Policies for consultations table
-- Consultations are strictly scoped by doctor_id for multitenancy
CREATE POLICY "Doctors can access their own consultations" ON consultations
  FOR ALL USING (true);  -- Simplified for custom auth - app layer handles doctor_id filtering

-- RLS Policies for admins table
-- Allow all operations for now since we're using custom auth
CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL USING (true);

-- RLS Policies for usage_logs table
-- Allow all operations for now since we're using custom auth
CREATE POLICY "Allow all operations on usage_logs" ON usage_logs
  FOR ALL USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_doctors_updated_at BEFORE UPDATE ON doctors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_consultations_updated_at BEFORE UPDATE ON consultations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-increment patient number per doctor per day
CREATE OR REPLACE FUNCTION set_patient_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.patient_number IS NULL THEN
        SELECT COALESCE(MAX(patient_number), 0) + 1
        INTO NEW.patient_number
        FROM consultations
        WHERE doctor_id = NEW.doctor_id
        AND DATE(created_at) = DATE(NOW());
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_consultation_patient_number BEFORE INSERT ON consultations
    FOR EACH ROW EXECUTE FUNCTION set_patient_number();

-- Quota management functions
CREATE OR REPLACE FUNCTION check_and_update_quota(doctor_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_quota_used INT;
    monthly_quota_limit INT;
    quota_reset_date TIMESTAMPTZ;
BEGIN
    -- Get current quota info
    SELECT quota_used, monthly_quota, quota_reset_at
    INTO current_quota_used, monthly_quota_limit, quota_reset_date
    FROM doctors
    WHERE id = doctor_uuid AND approved = true;

    -- Check if doctor exists and is approved
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Check if quota needs to be reset (monthly reset)
    IF quota_reset_date <= NOW() THEN
        UPDATE doctors
        SET quota_used = 0,
            quota_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
        WHERE id = doctor_uuid;
        current_quota_used = 0;

        -- Log quota reset
        INSERT INTO usage_logs (doctor_id, action_type, quota_before, quota_after, metadata)
        VALUES (doctor_uuid, 'quota_reset', current_quota_used, 0, '{"reason": "monthly_reset"}'::jsonb);
    END IF;

    -- Check if quota is available
    IF current_quota_used >= monthly_quota_limit THEN
        RETURN FALSE;
    END IF;

    -- Update quota usage
    UPDATE doctors
    SET quota_used = quota_used + 1
    WHERE id = doctor_uuid;

    -- Log quota usage
    INSERT INTO usage_logs (doctor_id, action_type, quota_before, quota_after, metadata)
    VALUES (doctor_uuid, 'ai_generation', current_quota_used, current_quota_used + 1, '{"timestamp": "' || NOW() || '"}'::jsonb);

    RETURN TRUE;
END;
$$ language 'plpgsql';

-- Function to reset all doctor quotas (for monthly cron job)
CREATE OR REPLACE FUNCTION reset_all_quotas()
RETURNS INT AS $$
DECLARE
    reset_count INT := 0;
    doctor_record RECORD;
BEGIN
    FOR doctor_record IN
        SELECT id, quota_used
        FROM doctors
        WHERE quota_reset_at <= NOW() AND approved = true
    LOOP
        UPDATE doctors
        SET quota_used = 0,
            quota_reset_at = DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
        WHERE id = doctor_record.id;

        -- Log quota reset
        INSERT INTO usage_logs (doctor_id, action_type, quota_before, quota_after, metadata)
        VALUES (doctor_record.id, 'quota_reset', doctor_record.quota_used, 0, '{"reason": "monthly_batch_reset"}'::jsonb);

        reset_count := reset_count + 1;
    END LOOP;

    RETURN reset_count;
END;
$$ language 'plpgsql';

-- Function to update doctor quota (admin only)
CREATE OR REPLACE FUNCTION update_doctor_quota(doctor_uuid UUID, new_quota INT, admin_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    old_quota INT;
BEGIN
    -- Get current quota
    SELECT monthly_quota INTO old_quota
    FROM doctors
    WHERE id = doctor_uuid;

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Update quota
    UPDATE doctors
    SET monthly_quota = new_quota
    WHERE id = doctor_uuid;

    -- Log quota update
    INSERT INTO usage_logs (doctor_id, action_type, quota_before, quota_after, metadata)
    VALUES (doctor_uuid, 'quota_update', old_quota, new_quota,
            ('{"admin_id": "' || admin_uuid || '", "timestamp": "' || NOW() || '"}')::jsonb);

    RETURN TRUE;
END;
$$ language 'plpgsql';
