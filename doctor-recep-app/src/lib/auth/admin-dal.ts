import 'server-only'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { decryptAdminSession } from './admin-session'
import { createClient } from '@/lib/supabase/server'
import { Admin } from '@/lib/types'

export const verifyAdminSession = cache(async () => {
  const cookieStore = await cookies()
  const cookie = cookieStore.get('admin_session')?.value
  const session = await decryptAdminSession(cookie)

  if (!session?.adminId) {
    redirect('/admin/login')
  }

  return { isAuth: true, adminId: session.adminId, role: session.role }
})

export const getAdmin = cache(async (): Promise<Admin | null> => {
  const session = await verifyAdminSession()
  if (!session) return null

  try {
    const supabase = await createClient()
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', session.adminId)
      .single()

    if (error) {
      console.error('Failed to fetch admin:', error)
      return null
    }

    return admin as Admin
  } catch (error) {
    console.error('Failed to fetch admin:', error)
    return null
  }
})

export const getAdminById = cache(async (adminId: string): Promise<Admin | null> => {
  try {
    const supabase = await createClient()
    const { data: admin, error } = await supabase
      .from('admins')
      .select('id, email, name, role, created_at, updated_at')
      .eq('id', adminId)
      .single()

    if (error) {
      console.error('Failed to fetch admin by ID:', error)
      return null
    }

    return admin as Admin
  } catch (error) {
    console.error('Failed to fetch admin by ID:', error)
    return null
  }
})

// Check if user has admin privileges (for regular user routes that need admin access)
export const checkAdminAccess = cache(async (): Promise<boolean> => {
  try {
    const cookieStore = await cookies()
    const cookie = cookieStore.get('admin_session')?.value
    const session = await decryptAdminSession(cookie)

    return !!session?.adminId
  } catch {
    return false
  }
})
