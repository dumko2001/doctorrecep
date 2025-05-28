import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decrypt } from './session'
import { createClient } from '@/lib/supabase/server'
import { Doctor, jsonToTemplateConfig } from '@/lib/types'

export const verifySession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('session')?.value
  const session = await decrypt(cookie)

  if (!session?.userId) {
    redirect('/login')
  }

  return { isAuth: true, userId: session.userId }
})

export const getUser = cache(async (): Promise<Doctor | null> => {
  const session = await verifySession()
  if (!session) return null

  try {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('doctors')
      .select('id, email, name, phone, clinic_name, template_config, monthly_quota, quota_used, quota_reset_at, approved, approved_by, approved_at, created_at, updated_at, password_hash')
      .eq('id', session.userId)
      .single()

    if (error) {
      console.error('Failed to fetch user:', error)
      return null
    }

    if (!user) return null
    // Convert template_config from Json to TemplateConfig
    return {
      ...user,
      template_config: jsonToTemplateConfig(user.template_config),
      password_hash: user.password_hash
    } as Doctor
  } catch (error) {
    console.error('Failed to fetch user:', error)
    return null
  }
})

export const getUserById = cache(async (userId: string): Promise<Doctor | null> => {
  try {
    const supabase = await createClient()
    const { data: user, error } = await supabase
      .from('doctors')
      .select('id, email, name, phone, clinic_name, template_config, monthly_quota, quota_used, quota_reset_at, approved, approved_by, approved_at, created_at, updated_at, password_hash')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch user by ID:', error)
      return null
    }

    if (!user) return null
    // Convert template_config from Json to TemplateConfig
    return {
      ...user,
      template_config: jsonToTemplateConfig(user.template_config),
      password_hash: user.password_hash
    } as Doctor
  } catch (error) {
    console.error('Failed to fetch user by ID:', error)
    return null
  }
})

// Get quota information for a doctor
export const getDoctorQuota = cache(async (userId: string) => {
  try {
    const supabase = await createClient()
    const { data: doctor, error } = await supabase
      .from('doctors')
      .select('monthly_quota, quota_used, quota_reset_at')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Failed to fetch quota:', error)
      return null
    }

    const quotaRemaining = doctor.monthly_quota - doctor.quota_used
    const quotaPercentage = Math.round((doctor.quota_used / doctor.monthly_quota) * 100)
    const resetDate = new Date(doctor.quota_reset_at)
    const daysUntilReset = Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))

    return {
      monthly_quota: doctor.monthly_quota,
      quota_used: doctor.quota_used,
      quota_remaining: quotaRemaining,
      quota_percentage: quotaPercentage,
      quota_reset_at: doctor.quota_reset_at,
      days_until_reset: Math.max(0, daysUntilReset),
    }
  } catch (error) {
    console.error('Failed to fetch quota:', error)
    return null
  }
})
