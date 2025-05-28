#!/usr/bin/env node

/**
 * Script to create the first admin user
 * Usage: node scripts/create-admin.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createAdmin() {
  try {
    console.log('🔐 Creating Admin User for Doctor Reception System');
    console.log('================================================\n');

    // Get Supabase credentials
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('❌ Missing Supabase credentials in environment variables');
      console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
      process.exit(1);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get admin details
    const name = await question('Admin Name: ');
    const email = await question('Admin Email: ');
    const password = await question('Admin Password: ');
    const role = await question('Role (admin/super_admin) [admin]: ') || 'admin';

    if (!name || !email || !password) {
      console.error('❌ All fields are required');
      process.exit(1);
    }

    if (!['admin', 'super_admin'].includes(role)) {
      console.error('❌ Role must be either "admin" or "super_admin"');
      process.exit(1);
    }

    console.log('\n🔄 Creating admin user...');

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single();

    if (existingAdmin) {
      console.error('❌ Admin with this email already exists');
      process.exit(1);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert admin
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        role,
      })
      .select('id, name, email, role')
      .single();

    if (error) {
      console.error('❌ Failed to create admin:', error.message);
      process.exit(1);
    }

    console.log('\n✅ Admin user created successfully!');
    console.log('================================');
    console.log(`ID: ${admin.id}`);
    console.log(`Name: ${admin.name}`);
    console.log(`Email: ${admin.email}`);
    console.log(`Role: ${admin.role}`);
    console.log('\n🌐 You can now login at: http://localhost:3000/admin/login');

  } catch (error) {
    console.error('❌ Error creating admin:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the script
createAdmin();
