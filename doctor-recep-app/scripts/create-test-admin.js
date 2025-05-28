#!/usr/bin/env node

/**
 * Script to create a test admin user automatically
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function createTestAdmin() {
  try {
    console.log('🔐 Creating Test Admin User');
    console.log('===========================\n');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in environment variables');
      console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test admin details
    const adminData = {
      name: 'Test Admin',
      email: 'admin@doctorreception.com',
      password: 'admin123',
      role: 'super_admin'
    };

    console.log('🔄 Creating admin user...');
    console.log(`Name: ${adminData.name}`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Role: ${adminData.role}`);

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', adminData.email)
      .single();

    if (existingAdmin) {
      console.log('✅ Admin with this email already exists');
      console.log(`Admin ID: ${existingAdmin.id}`);
      console.log('\n🌐 You can login at: http://localhost:3000/admin/login');
      console.log(`Email: ${adminData.email}`);
      console.log(`Password: ${adminData.password}`);
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, 10);

    // Insert admin
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        name: adminData.name,
        email: adminData.email,
        password_hash: hashedPassword,
        role: adminData.role,
      })
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('❌ Failed to create admin:', error.message);
      console.error('Full error:', error);
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log(`ID: ${admin.id}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log('\n🌐 Login Details:');
    console.log(`URL: http://localhost:3000/admin/login`);
    console.log(`Email: ${adminData.email}`);
    console.log(`Password: ${adminData.password}`);

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
createTestAdmin();
