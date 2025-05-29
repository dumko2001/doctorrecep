-- Fix RLS Policy UUID Type Error
-- This script fixes the "operator does not exist: text = uuid" error
-- Run this in your Supabase SQL Editor

-- Drop all existing RLS policies that might have type mismatches
DROP POLICY IF EXISTS "Doctors can view their own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON doctors;
DROP POLICY IF EXISTS "Allow doctor registration" ON doctors;
DROP POLICY IF EXISTS "Doctors can access their own consultations" ON consultations;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on consultations" ON consultations;
DROP POLICY IF EXISTS "Allow all operations on admins" ON admins;
DROP POLICY IF EXISTS "Allow all operations on usage_logs" ON usage_logs;

-- Since we're using custom session-based authentication (not Supabase Auth),
-- we'll create permissive policies and handle authorization in the application layer

-- Doctors table policies
CREATE POLICY "Allow all operations on doctors" ON doctors
  FOR ALL USING (true) WITH CHECK (true);

-- Consultations table policies  
CREATE POLICY "Allow all operations on consultations" ON consultations
  FOR ALL USING (true) WITH CHECK (true);

-- Admins table policies
CREATE POLICY "Allow all operations on admins" ON admins
  FOR ALL USING (true) WITH CHECK (true);

-- Usage logs table policies
CREATE POLICY "Allow all operations on usage_logs" ON usage_logs
  FOR ALL USING (true) WITH CHECK (true);

-- If you want to implement proper RLS later with custom auth, use these examples:
-- Note: These are commented out since we use application-level authorization

/*
-- Example of proper RLS with custom auth (for future reference):
-- You would need to set custom claims in your JWT tokens

CREATE POLICY "Doctors can view own data" ON doctors
  FOR SELECT USING (
    id = (current_setting('request.jwt.claims', true)::json ->> 'doctor_id')::uuid
  );

CREATE POLICY "Doctors can update own data" ON doctors  
  FOR UPDATE USING (
    id = (current_setting('request.jwt.claims', true)::json ->> 'doctor_id')::uuid
  );

CREATE POLICY "Doctors can access own consultations" ON consultations
  FOR ALL USING (
    doctor_id = (current_setting('request.jwt.claims', true)::json ->> 'doctor_id')::uuid
  );
*/

-- Verify policies are created correctly
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('doctors', 'consultations', 'admins', 'usage_logs')
ORDER BY tablename, policyname;