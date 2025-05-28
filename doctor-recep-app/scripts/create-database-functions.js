#!/usr/bin/env node

/**
 * Script to create the missing database functions in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const quotaCheckFunction = `
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
`;

const resetAllQuotasFunction = `
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
`;

const updateQuotaFunction = `
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
`;

async function createDatabaseFunctions() {
  try {
    console.log('🔧 Creating Database Functions');
    console.log('==============================\n');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      console.error('Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔄 Creating check_and_update_quota function...');
    const { error: error1 } = await supabase.rpc('exec', { sql: quotaCheckFunction });
    if (error1) {
      console.error('❌ Error creating quota check function:', error1.message);
    } else {
      console.log('✅ check_and_update_quota function created');
    }

    console.log('🔄 Creating reset_all_quotas function...');
    const { error: error2 } = await supabase.rpc('exec', { sql: resetAllQuotasFunction });
    if (error2) {
      console.error('❌ Error creating reset function:', error2.message);
    } else {
      console.log('✅ reset_all_quotas function created');
    }

    console.log('🔄 Creating update_doctor_quota function...');
    const { error: error3 } = await supabase.rpc('exec', { sql: updateQuotaFunction });
    if (error3) {
      console.error('❌ Error creating update function:', error3.message);
    } else {
      console.log('✅ update_doctor_quota function created');
    }

    console.log('\n🎉 Database functions setup complete!');
    console.log('You can now run: npm run test-quota');

  } catch (error) {
    console.error('❌ Error creating functions:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createDatabaseFunctions();
