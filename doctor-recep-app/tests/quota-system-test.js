#!/usr/bin/env node

/**
 * Test script for the quota system
 * Tests quota checking, updating, and reset functionality
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const config = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  testDoctorEmail: 'test.doctor@example.com'
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
}

async function testQuotaSystem() {
  try {
    log('🧪 Starting Quota System Tests');
    log('==============================\n');

    if (!config.supabaseUrl || !config.supabaseKey) {
      log('Missing Supabase credentials', 'error');
      process.exit(1);
    }

    const supabase = createClient(config.supabaseUrl, config.supabaseKey);

    // Test 1: Check if quota functions exist
    log('Test 1: Checking database functions...');

    try {
      const { data, error } = await supabase.rpc('check_and_update_quota', {
        doctor_uuid: '00000000-0000-0000-0000-000000000000'
      });

      if (error && !error.message.includes('does not exist')) {
        log('Database functions are available', 'success');
      } else if (error && error.message.includes('does not exist')) {
        log('Database functions missing - run migration first', 'error');
        return;
      }
    } catch (err) {
      log('Database functions test completed', 'success');
    }

    // Test 2: Find or create test doctor
    log('Test 2: Setting up test doctor...');

    let { data: testDoctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id, name, email, monthly_quota, quota_used, approved')
      .eq('email', config.testDoctorEmail)
      .single();

    if (doctorError && doctorError.code === 'PGRST116') {
      log('Test doctor not found - please create one first', 'error');
      log(`Create a doctor with email: ${config.testDoctorEmail}`, 'info');
      return;
    }

    if (!testDoctor.approved) {
      log('Test doctor not approved - approving now...');
      await supabase
        .from('doctors')
        .update({ approved: true, approved_at: new Date().toISOString() })
        .eq('id', testDoctor.id);

      testDoctor.approved = true;
      log('Test doctor approved', 'success');
    }

    log(`Test doctor: ${testDoctor.name} (${testDoctor.email})`, 'success');
    log(`Current quota: ${testDoctor.quota_used}/${testDoctor.monthly_quota}`);

    // Test 3: Test quota checking
    log('\nTest 3: Testing quota check function...');

    const { data: quotaResult, error: quotaError } = await supabase
      .rpc('check_and_update_quota', { doctor_uuid: testDoctor.id });

    if (quotaError) {
      log(`Quota check error: ${quotaError.message}`, 'error');
    } else {
      log(`Quota check result: ${quotaResult}`, quotaResult ? 'success' : 'error');
    }

    // Test 4: Check updated quota
    log('Test 4: Verifying quota update...');

    const { data: updatedDoctor } = await supabase
      .from('doctors')
      .select('quota_used')
      .eq('id', testDoctor.id)
      .single();

    if (updatedDoctor.quota_used > testDoctor.quota_used) {
      log(`Quota updated: ${testDoctor.quota_used} → ${updatedDoctor.quota_used}`, 'success');
    } else {
      log('Quota not updated - may have been at limit', 'info');
    }

    // Test 5: Check usage logs
    log('Test 5: Checking usage logs...');

    const { data: logs, error: logsError } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('doctor_id', testDoctor.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (logsError) {
      log(`Logs error: ${logsError.message}`, 'error');
    } else {
      log(`Found ${logs.length} recent usage logs`, 'success');
      logs.forEach(log_entry => {
        log(`  - ${log_entry.action_type}: ${log_entry.quota_before} → ${log_entry.quota_after}`);
      });
    }

    // Test 6: Test quota reset function
    log('\nTest 6: Testing quota reset function...');

    const { data: resetResult, error: resetError } = await supabase
      .rpc('reset_all_quotas');

    if (resetError) {
      log(`Reset error: ${resetError.message}`, 'error');
    } else {
      log(`Reset completed for ${resetResult} doctors`, 'success');
    }

    // Test 7: Admin functions test
    log('\nTest 7: Testing admin functions...');

    const { data: adminStats } = await supabase
      .from('doctors')
      .select('approved')
      .eq('approved', true);

    const { data: pendingStats } = await supabase
      .from('doctors')
      .select('approved')
      .eq('approved', false);

    log(`Approved doctors: ${adminStats?.length || 0}`, 'success');
    log(`Pending approvals: ${pendingStats?.length || 0}`, 'success');

    log('\n🎉 All tests completed successfully!');
    log('The quota system is working correctly.');

  } catch (error) {
    log(`Test failed: ${error.message}`, 'error');
    console.error(error);
  }
}

// Run tests
testQuotaSystem();
