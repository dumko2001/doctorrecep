#!/usr/bin/env node

/**
 * Script to check all doctors and fix their approval/quota status
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkAndFixDoctors() {
  try {
    console.log('👨‍⚕️ Checking All Doctors');
    console.log('========================\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get all doctors
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select('id, name, email, approved, monthly_quota, quota_used, approved_at, created_at')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching doctors:', error.message);
      return;
    }

    console.log(`Found ${doctors.length} doctors:\n`);

    doctors.forEach((doc, i) => {
      console.log(`${i + 1}. ${doc.name} (${doc.email})`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Approved: ${doc.approved}`);
      console.log(`   Quota: ${doc.quota_used}/${doc.monthly_quota}`);
      console.log(`   Created: ${new Date(doc.created_at).toLocaleDateString()}`);
      if (doc.approved_at) {
        console.log(`   Approved: ${new Date(doc.approved_at).toLocaleDateString()}`);
      }
      console.log('');
    });

    // Find doctors that need fixing
    const doctorsToFix = doctors.filter(doc => !doc.approved || doc.monthly_quota === null);

    if (doctorsToFix.length > 0) {
      console.log('🔧 Fixing doctors that need approval/quota setup...\n');

      for (const doctor of doctorsToFix) {
        console.log(`Fixing: ${doctor.name} (${doctor.email})`);

        const updates = {};
        
        if (!doctor.approved) {
          updates.approved = true;
          updates.approved_at = new Date().toISOString();
          console.log('  ✅ Setting approved = true');
        }

        if (!doctor.monthly_quota || doctor.monthly_quota === 0) {
          updates.monthly_quota = 100;
          console.log('  📊 Setting monthly_quota = 100');
        }

        if (!doctor.quota_used && doctor.quota_used !== 0) {
          updates.quota_used = 0;
          console.log('  🔄 Setting quota_used = 0');
        }

        // Apply updates
        const { error: updateError } = await supabase
          .from('doctors')
          .update(updates)
          .eq('id', doctor.id);

        if (updateError) {
          console.log(`  ❌ Error updating: ${updateError.message}`);
        } else {
          console.log('  ✅ Updated successfully');
        }
        console.log('');
      }
    } else {
      console.log('✅ All doctors are properly configured!');
    }

    // Show final status
    console.log('📊 Final Status:');
    console.log('================');
    
    const { data: finalDoctors } = await supabase
      .from('doctors')
      .select('name, email, approved, monthly_quota, quota_used')
      .order('created_at', { ascending: true });

    finalDoctors.forEach((doc, i) => {
      const status = doc.approved ? '✅ Approved' : '⏳ Pending';
      console.log(`${i + 1}. ${doc.name} - ${status} - Quota: ${doc.quota_used}/${doc.monthly_quota}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
checkAndFixDoctors();
