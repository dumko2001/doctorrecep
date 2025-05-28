-- Fix RLS Policies for Doctor Reception System
-- Run this in your Supabase SQL Editor to fix the signup issue

-- First, drop existing policies
DROP POLICY IF EXISTS "Doctors can view their own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can update their own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can insert their own profile" ON doctors;
DROP POLICY IF EXISTS "Doctors can access their own consultations" ON consultations;
DROP POLICY IF EXISTS "Allow all operations on doctors" ON doctors;
DROP POLICY IF EXISTS "Allow all operations on consultations" ON consultations;

-- Create new permissive policies for custom auth system
-- Since we're using custom JWT sessions instead of Supabase Auth,
-- we'll allow all operations and handle authorization in the application layer

CREATE POLICY "Allow all operations on doctors" ON doctors
  FOR ALL USING (true);

CREATE POLICY "Allow all operations on consultations" ON consultations
  FOR ALL USING (true);

-- Verify the policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('doctors', 'consultations')
ORDER BY tablename, policyname;
