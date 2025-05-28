'use server'

import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { createClient } from '@/lib/supabase/server'
import { createSession, deleteSession } from '@/lib/auth/session'
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