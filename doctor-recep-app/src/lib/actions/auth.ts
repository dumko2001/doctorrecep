'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createSession, deleteSession, refreshSession } from '@/lib/auth/session'
import { SignupFormSchema, LoginFormSchema } from '@/lib/validations'
import { FormState } from '@/lib/types'

export async function signup(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    clinic_name: formData.get('clinic_name'),
    phone: formData.get('phone'),
  })

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      // Provide required 'success' and 'message' properties
      success: false,
      message: 'Invalid form fields.', // A generic message for validation failure
      // Use 'fieldErrors' as defined in FormState, and pass the specific field errors
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  // Prepare data for insertion into database
  const { name, email, password, clinic_name, phone } = validatedFields.data
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const supabase = await createClient()

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('doctors')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        success: false, // Ensure 'success' is explicitly false for errors
        message: 'An account with this email already exists.',
      }
    }

    // Insert the user into the database with approval required
    const { data: user, error } = await supabase
      .from('doctors')
      .insert({
        name,
        email,
        password_hash: hashedPassword,
        clinic_name,
        phone,
        approved: false, // New doctors require approval
      })
      .select('id, approved')
      .single()

    if (error) {
      console.error('Database error:', error)
      return {
        success: false, // Ensure 'success' is explicitly false for errors
        message: 'An error occurred while creating your account.',
      }
    }

    if (!user) {
      return {
        success: false, // Ensure 'success' is explicitly false for errors
        message: 'An error occurred while creating your account.',
      }
    }

    // Don't create session for unapproved users
    if (!user.approved) {
      return {
        success: true, // This is a success state, but with an informative message
        message: 'Account created successfully! Please wait for admin approval before you can log in.',
      }
    }

    // Create user session (only for approved users)
    await createSession(user.id)
  } catch (error) {
    console.error('Signup error:', error)
    return {
      success: false, // Ensure 'success' is explicitly false for unexpected errors
      message: 'An unexpected error occurred.',
    }
  }

  // If execution reaches here, it means signup was successful and session created (if approved)
  // or a success message was returned for pending approval.
  // The redirect will handle navigation, but a FormState must be returned for useActionState.
  redirect('/dashboard')
  // This return is theoretically unreachable but satisfies the Promise<FormState> return type
  return { success: true, message: 'Redirecting...' };
}

export async function login(state: FormState, formData: FormData): Promise<FormState> {
  // Validate form fields
  const validatedFields = LoginFormSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  // If any form fields are invalid, return early
  if (!validatedFields.success) {
    return {
      // Provide required 'success' and 'message' properties
      success: false,
      message: 'Invalid form fields.',
      // Use 'fieldErrors' as defined in FormState, and pass the specific field errors
      fieldErrors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { email, password } = validatedFields.data

  try {
    const supabase = await createClient()

    // Get user from database
    const { data: user, error } = await supabase
      .from('doctors')
      .select('id, password_hash, approved')
      .eq('email', email)
      .single()

    if (error || !user) {
      return {
        success: false, // Ensure 'success' is explicitly false for errors
        message: 'Invalid email or password.',
      }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash)

    if (!isValidPassword) {
      return {
        success: false, // Ensure 'success' is explicitly false for errors
        message: 'Invalid email or password.',
      }
    }

    // Check if user is approved
    if (!user.approved) {
      return {
        success: false, // This is an error state, preventing login
        message: 'Your account is pending admin approval. Please wait for approval before logging in.',
      }
    }

    // Create user session
    await createSession(user.id)
  } catch (error) {
    console.error('Login error:', error)
    return {
      success: false, // Ensure 'success' is explicitly false for unexpected errors
      message: 'An unexpected error occurred.',
    }
  }

  // If execution reaches here, it means login was successful and session created.
  // The redirect will handle navigation, but a FormState must be returned for useActionState.
  redirect('/dashboard')
  // This return is theoretically unreachable but satisfies the Promise<FormState> return type
  return { success: true, message: 'Redirecting...' };
}

export async function logout() {
  await deleteSession()
  redirect('/login')
}

export async function changePassword(doctorId: string, formData: FormData): Promise<FormState> {
  const currentPassword = formData.get('currentPassword') as string
  const newPassword = formData.get('newPassword') as string
  const confirmPassword = formData.get('confirmPassword') as string

  // Basic validation
  if (!currentPassword || !newPassword || !confirmPassword) {
    return {
      success: false,
      message: 'All fields are required.',
    }
  }

  if (newPassword !== confirmPassword) {
    return {
      success: false,
      message: 'New passwords do not match.',
    }
  }

  if (newPassword.length < 8) {
    return {
      success: false,
      message: 'New password must be at least 8 characters long.',
    }
  }

  try {
    const supabase = await createClient()

    // Get current password hash
    const { data: doctor, error: fetchError } = await supabase
      .from('doctors')
      .select('password_hash')
      .eq('id', doctorId)
      .single()

    if (fetchError || !doctor) {
      return {
        success: false,
        message: 'Doctor not found.',
      }
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, doctor.password_hash)

    if (!isValidPassword) {
      return {
        success: false,
        message: 'Current password is incorrect.',
      }
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password
    const { error: updateError } = await supabase
      .from('doctors')
      .update({ password_hash: hashedNewPassword })
      .eq('id', doctorId)

    if (updateError) {
      console.error('Password update error:', updateError)
      return {
        success: false,
        message: 'Failed to update password.',
      }
    }

    // Refresh session with updated credentials
    await refreshSession(doctorId)

    return {
      success: true,
      message: 'Password changed successfully!',
    }
  } catch (error) {
    console.error('Password change error:', error)
    return {
      success: false,
      message: 'An unexpected error occurred.',
    }
  }
}