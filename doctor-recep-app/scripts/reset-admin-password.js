#!/usr/bin/env node

/**
 * Script to reset admin password
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting Admin Password');
    console.log('===========================\n');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in environment variables');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if admin exists
    const { data: admin, error: fetchError } = await supabase
      .from('admins')
      .select('id, email, password_hash')
      .eq('email', 'admin@doctorreception.com')
      .single();

    if (fetchError || !admin) {
      console.error('❌ Admin not found');
      process.exit(1);
    }

    console.log('✅ Admin found:', admin.email);

    // Test current password
    const isCurrentValid = await bcrypt.compare('admin123', admin.password_hash);
    console.log('Current password valid:', isCurrentValid);

    if (!isCurrentValid) {
      console.log('🔄 Updating password hash...');
      
      // Generate new hash
      const newHash = await bcrypt.hash('admin123', 10);
      
      // Update password
      const { error: updateError } = await supabase
        .from('admins')
        .update({ password_hash: newHash })
        .eq('id', admin.id);

      if (updateError) {
        console.error('❌ Failed to update password:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Password updated successfully!');
    } else {
      console.log('✅ Password is already correct!');
    }

    console.log('\n🌐 Login Details:');
    console.log('URL: http://localhost:3000/admin/login');
    console.log('Email: admin@doctorreception.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the script
resetAdminPassword();
