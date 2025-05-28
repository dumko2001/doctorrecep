#!/usr/bin/env node

/**
 * Script to test if database functions exist and work
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function testFunctions() {
  try {
    console.log('🧪 Testing Database Functions');
    console.log('=============================\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test 1: Check if we can call a simple function
    console.log('Test 1: Testing basic function call...');
    try {
      const { data, error } = await supabase.rpc('check_and_update_quota', {
        doctor_uuid: '00000000-0000-0000-0000-000000000000'
      });
      
      if (error) {
        console.log('❌ Function not found:', error.message);
        console.log('\n📋 You need to create the database functions manually in Supabase:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the contents of: database/create-functions.sql');
        console.log('4. Execute the SQL');
        console.log('5. Run this test again');
      } else {
        console.log('✅ Function exists and returned:', data);
      }
    } catch (err) {
      console.log('❌ Error calling function:', err.message);
    }

    // Test 2: Check available functions
    console.log('\nTest 2: Checking available RPC functions...');
    try {
      // Try to get schema information
      const { data: functions, error } = await supabase
        .from('pg_proc')
        .select('proname')
        .like('proname', '%quota%');
      
      if (error) {
        console.log('ℹ️ Cannot query pg_proc (expected with anon key)');
      } else {
        console.log('Available quota functions:', functions);
      }
    } catch (err) {
      console.log('ℹ️ Cannot access system tables (expected with anon key)');
    }

    // Test 3: Test with real doctor
    console.log('\nTest 3: Testing with real doctor...');
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, name, email')
      .eq('approved', true)
      .limit(1);

    if (doctors && doctors.length > 0) {
      const doctor = doctors[0];
      console.log(`Found doctor: ${doctor.name} (${doctor.email})`);
      
      try {
        const { data, error } = await supabase.rpc('check_and_update_quota', {
          doctor_uuid: doctor.id
        });
        
        if (error) {
          console.log('❌ Function call failed:', error.message);
        } else {
          console.log('✅ Function call successful, result:', data);
        }
      } catch (err) {
        console.log('❌ Function call error:', err.message);
      }
    } else {
      console.log('ℹ️ No approved doctors found for testing');
    }

    console.log('\n📋 Next Steps:');
    console.log('1. If functions are missing, execute database/create-functions.sql in Supabase');
    console.log('2. Run: npm run test-quota');
    console.log('3. Start the development server: npm run dev');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
testFunctions();
