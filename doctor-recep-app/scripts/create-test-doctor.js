#!/usr/bin/env node

/**
 * Script to create a test doctor for testing the quota system
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function createTestDoctor() {
  try {
    console.log('👨‍⚕️ Creating Test Doctor');
    console.log('========================\n');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test doctor details
    const doctorData = {
      name: 'Dr. Test Doctor',
      email: 'test.doctor@example.com',
      password: 'doctor123',
      clinic_name: 'Test Clinic',
      phone: '+1234567890'
    };

    console.log('🔄 Creating test doctor...');
    console.log(`Name: ${doctorData.name}`);
    console.log(`Email: ${doctorData.email}`);
    console.log(`Clinic: ${doctorData.clinic_name}`);

    // Check if doctor already exists
    const { data: existingDoctor } = await supabase
      .from('doctors')
      .select('id, approved')
      .eq('email', doctorData.email)
      .single();

    if (existingDoctor) {
      console.log('✅ Doctor already exists');
      console.log(`Doctor ID: ${existingDoctor.id}`);
      console.log(`Approved: ${existingDoctor.approved}`);
      
      if (!existingDoctor.approved) {
        console.log('🔄 Approving doctor...');
        await supabase
          .from('doctors')
          .update({ 
            approved: true, 
            approved_at: new Date().toISOString() 
          })
          .eq('id', existingDoctor.id);
        console.log('✅ Doctor approved');
      }
      
      console.log('\n🌐 Login Details:');
      console.log(`URL: http://localhost:3000/login`);
      console.log(`Email: ${doctorData.email}`);
      console.log(`Password: ${doctorData.password}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(doctorData.password, 10);

    // Insert doctor with approval
    const { data: doctor, error } = await supabase
      .from('doctors')
      .insert({
        name: doctorData.name,
        email: doctorData.email,
        password_hash: hashedPassword,
        clinic_name: doctorData.clinic_name,
        phone: doctorData.phone,
        approved: true, // Auto-approve for testing
        approved_at: new Date().toISOString(),
        monthly_quota: 100,
        quota_used: 0
      })
      .select('id, name, email, approved, monthly_quota, quota_used')
      .single();

    if (error) {
      console.error('❌ Failed to create doctor:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }

    console.log('\n✅ Test doctor created successfully!');
    console.log('===================================');
    console.log(`ID: ${doctor.id}`);
    console.log(`Name: ${doctor.name}`);
    console.log(`Email: ${doctor.email}`);
    console.log(`Approved: ${doctor.approved}`);
    console.log(`Quota: ${doctor.quota_used}/${doctor.monthly_quota}`);
    console.log('\n🌐 Login Details:');
    console.log(`URL: http://localhost:3000/login`);
    console.log(`Email: ${doctorData.email}`);
    console.log(`Password: ${doctorData.password}`);

  } catch (error) {
    console.error('❌ Error creating doctor:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createTestDoctor();
