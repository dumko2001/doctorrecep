-- Database Functions for Quota Management
-- Execute this in Supabase SQL Editor

-- Function to check and update quota
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
    VALUES (doctor_uuid, 'ai_generation', current_quota_used, current_quota_used + 1,
            json_build_object('timestamp', NOW())::jsonb);

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
            json_build_object('admin_id', admin_uuid, 'timestamp', NOW())::jsonb);

    RETURN TRUE;
END;
$$ language 'plpgsql';
