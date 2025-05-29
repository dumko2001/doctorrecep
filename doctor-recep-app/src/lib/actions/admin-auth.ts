'use server'

import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
// Ensure createAdminSession is used if it's imported
import { createAdminSession, deleteSession } from '@/lib/auth/admin-session'
import { AdminLoginFormSchema } from '@/lib/validations'
import { FormState } from '@/lib/types'

export async function adminLogin(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = AdminLoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      success: false,
      message: 'Invalid form fields.',
    }
  }

  const { email, password } = validatedFields.data

  try {
    const supabase = await createClient()

    // Get admin from database
    const { data: admin /* , error */ } = await supabase
      .from('admins')
      .select('id, password_hash, role') // 'role' is selected here, which we need
      .eq('email', email)
      .single()

    if (!admin) {
      return {
        success: false,
        message: 'Invalid email or password.',
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)
    if (!isValidPassword) {
      return {
        success: false,
        message: 'Invalid email or password.',
      }
    }

    // *** CRITICAL CHANGE: Pass the 'role' argument to createAdminSession ***
    // Ensure admin.role is correctly typed as 'admin' | 'super_admin'
    await createAdminSession(admin.id, admin.role as "admin" | "super_admin");

    // Return success instead of redirecting (to avoid Next.js 15 grey screen issue)
    return {
      success: true,
      message: 'Login successful! Redirecting...',
    }

  } catch (error) {
    console.error("Admin Login Error:", error);
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}

export async function adminLogout() {
  await deleteSession()
  // Return success instead of redirecting (to avoid Next.js 15 grey screen issue)
  return { success: true }
}

export async function createAdminUser(
  email: string,
  password: string,
  name: string,
  role: 'admin' | 'super_admin' = 'admin'
): Promise<{ success: boolean; error?: string; adminId?: string }> {
  try {
    const supabase = await createClient()

    // Check if admin already exists
    const { data: existingAdmin } = await supabase
      .from('admins')
      .select('id')
      .eq('email', email)
      .single()

    if (existingAdmin) {
      return {
        success: false,
        error: 'An admin with this email already exists.',
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Insert the admin into the database
    const { data: admin, error } = await supabase
      .from('admins')
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        role,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false,
        error: 'An error occurred while creating the admin account.',
      }
    }

    if (!admin) {
      return {
        success: false,
        error: 'An error occurred while creating the admin account.',
      }
    }

    return {
      success: true,
      adminId: admin.id,
    }
  } catch (error) {
    console.error('Create admin error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred.',
    }
  }
}