-- Migration: Add Quota System and Admin Dashboard
-- This migration adds quota tracking, admin system, and approval workflow
-- Run this on existing databases to add the new features

-- Step 1: Add new columns to doctors table
ALTER TABLE doctors 
ADD COLUMN IF NOT EXISTS monthly_quota INT NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS quota_used INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS quota_reset_at TIMESTAMPTZ NOT NULL DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
ADD COLUMN IF NOT EXISTS approved BOOLEAN NOT NULL DEFAULT TRUE, -- Existing doctors are auto-approved
ADD COLUMN IF NOT EXISTS approved_by UUID NULL,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ NULL;

-- Step 2: Create admin users table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 3: Create usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES consultations(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('ai_generation', 'quota_reset', 'quota_update')),
  quota_before INT,
  quota_after INT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 4: Add new indexes
CREATE INDEX IF NOT EXISTS idx_doctors_approved ON doctors(approved);
CREATE INDEX IF NOT EXISTS idx_doctors_quota_reset_at ON doctors(quota_reset_at);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_doctor_id ON usage_logs(doctor_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_logs_action_type ON usage_logs(action_type);

-- Step 5: Enable RLS on new tables
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies for new tables
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
CREATE POLICY "Allow all operations on admins" ON admins FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all operations on usage_logs" ON usage_logs;
CREATE POLICY "Allow all operations on usage_logs" ON usage_logs FOR ALL USING (true);

-- Step 7: Add triggers for new tables
DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Set approved_at for existing doctors
UPDATE doctors 
SET approved_at = created_at 
WHERE approved = TRUE AND approved_at IS NULL;

-- Step 9: Create quota management functions (see main schema.sql for full functions)
-- These functions are included in the main schema file

-- Migration completed successfully
-- Next steps:
-- 1. Create your first admin user manually in the admins table
-- 2. Update your application code to use the new quota system
-- 3. Test the admin dashboard functionality
