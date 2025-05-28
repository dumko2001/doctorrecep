-- Update Patient Numbering to be Daily-Based
-- Execute this in Supabase SQL Editor

-- Drop and recreate the patient numbering function to be daily-based
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
