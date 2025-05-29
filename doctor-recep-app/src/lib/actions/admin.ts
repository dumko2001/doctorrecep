'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminSession } from '@/lib/auth/admin-dal'
import { ApiResponse, DoctorWithStats, AdminDashboardStats, AdminActionRequest, jsonToTemplateConfig, Json } from '@/lib/types'

export async function getAdminDashboardStats(): Promise<ApiResponse<AdminDashboardStats>> {
  try {
    const session = await verifyAdminSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { count: totalDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })

    const { count: pendingApprovals } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('approved', false)

    const { count: approvedDoctors } = await supabase
      .from('doctors')
      .select('*', { count: 'exact', head: true })
      .eq('approved', true)

    const { count: totalConsultations } = await supabase
      .from('consultations')
      .select('*', { count: 'exact', head: true })

    const { count: totalAiGenerations } = await supabase
      .from('usage_logs')
      .select('*', { count: 'exact', head: true })
      .eq('action_type', 'ai_generation')

    const { data: quotaData } = await supabase
      .from('doctors')
      .select('monthly_quota, quota_used')
      .eq('approved', true)

    let quotaUsagePercentage = 0
    if (quotaData && quotaData.length > 0) {
      const totalQuota = quotaData.reduce((sum, doctor) => sum + doctor.monthly_quota, 0)
      const totalUsed = quotaData.reduce((sum, doctor) => sum + doctor.quota_used, 0)
      quotaUsagePercentage = totalQuota > 0 ? Math.round((totalUsed / totalQuota) * 100) : 0
    }

    const stats: AdminDashboardStats = {
      total_doctors: totalDoctors || 0,
      pending_approvals: pendingApprovals || 0,
      approved_doctors: approvedDoctors || 0,
      total_consultations: totalConsultations || 0,
      total_ai_generations: totalAiGenerations || 0,
      quota_usage_percentage: quotaUsagePercentage,
    }

    return { success: true, data: stats }
  } catch (error) {
    console.error('Get admin dashboard stats error:', error)
    return { success: false, error: 'Failed to fetch dashboard stats' }
  }
}

export async function getAllDoctorsWithStats(): Promise<ApiResponse<DoctorWithStats[]>> {
  try {
    const session = await verifyAdminSession()
    if (!session) {
      return { success: false, error: 'Not authenticated. Please log in again.' }
    }

    const supabase = await createClient()

    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        *,
        consultations(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to fetch doctors' }
    }

    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)

    const doctorsWithStats: DoctorWithStats[] = await Promise.all(
      doctors.map(async (doctor) => {
        const { consultations, ...restOfDoctorData } = doctor;

        const { count: thisMonthGenerations } = await supabase
          .from('usage_logs')
          .select('*', { count: 'exact', head: true })
          .eq('doctor_id', restOfDoctorData.id)
          .eq('action_type', 'ai_generation')
          .gte('created_at', currentMonth.toISOString())

        const { data: lastConsultation } = await supabase
          .from('consultations')
          .select('created_at')
          .eq('doctor_id', restOfDoctorData.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const quotaPercentage = restOfDoctorData.monthly_quota > 0
          ? Math.round((restOfDoctorData.quota_used / restOfDoctorData.monthly_quota) * 100)
          : 0

        return {
          ...restOfDoctorData,
          phone: restOfDoctorData.phone ?? undefined,
          clinic_name: restOfDoctorData.clinic_name ?? undefined,
          approved_by: restOfDoctorData.approved_by ?? undefined,
          approved_at: restOfDoctorData.approved_at ?? undefined,
          template_config: restOfDoctorData.template_config ? jsonToTemplateConfig(restOfDoctorData.template_config) : {
            prescription_format: 'standard',
            language: 'english',
            tone: 'professional',
            sections: ['symptoms', 'diagnosis', 'prescription', 'advice', 'follow_up']
          },
          total_consultations: consultations?.[0]?.count || 0,
          this_month_generations: thisMonthGenerations || 0,
          quota_percentage: quotaPercentage,
          last_activity: lastConsultation?.created_at ?? undefined,
        }
      })
    )

    return { success: true, data: doctorsWithStats }
  } catch (error) {
    console.error('Get doctors with stats error:', error)
    return { success: false, error: 'Failed to fetch doctors' }
  }
}

export async function performAdminAction(request: AdminActionRequest): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifyAdminSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    switch (request.action) {
      case 'approve':
        const { error: approveError } = await supabase
          .from('doctors')
          .update({
            approved: true,
            approved_by: session.adminId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', request.doctor_id)

        if (approveError) {
          return { success: false, error: 'Failed to approve doctor' }
        }
        break

      case 'reject':
        const { error: rejectError } = await supabase
          .from('doctors')
          .delete()
          .eq('id', request.doctor_id)

        if (rejectError) {
          return { success: false, error: 'Failed to reject doctor' }
        }
        break

      case 'update_quota':
        if (!request.data?.quota) {
          return { success: false, error: 'Quota value is required' }
        }

        const { error: quotaError } = await supabase
          .from('doctors')
          .update({
            monthly_quota: request.data.quota,
          })
          .eq('id', request.doctor_id)

        if (quotaError) {
          return { success: false, error: 'Failed to update quota' }
        }

        await supabase
          .from('usage_logs')
          .insert({
            doctor_id: request.doctor_id,
            action_type: 'quota_update',
            quota_after: request.data.quota,
            metadata: {
              admin_id: session.adminId,
              reason: request.data.reason || 'Admin update',
            },
          })
        break

      case 'disable':
        const { error: disableError } = await supabase
          .from('doctors')
          .update({
            approved: false,
          })
          .eq('id', request.doctor_id)

        if (disableError) {
          return { success: false, error: 'Failed to disable doctor' }
        }
        break

      case 'enable':
        const { error: enableError } = await supabase
          .from('doctors')
          .update({
            approved: true,
            approved_by: session.adminId,
            approved_at: new Date().toISOString(),
          })
          .eq('id', request.doctor_id)

        if (enableError) {
          return { success: false, error: 'Failed to enable doctor' }
        }
        break

      default:
        return { success: false, error: 'Invalid action' }
    }

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/doctors')
    
    return { success: true, data: true }
  } catch (error) {
    console.error('Perform admin action error:', error)
    return { success: false, error: 'Failed to perform action' }
  }
}

export async function resetDoctorQuota(doctorId: string): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifyAdminSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { data: doctor } = await supabase
      .from('doctors')
      .select('quota_used')
      .eq('id', doctorId)
      .single()

    if (!doctor) {
      return { success: false, error: 'Doctor not found' }
    }

    const { error } = await supabase
      .from('doctors')
      .update({
        quota_used: 0,
        quota_reset_at: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1).toISOString(),
      })
      .eq('id', doctorId)

    if (error) {
      return { success: false, error: 'Failed to reset quota' }
    }

    await supabase
      .from('usage_logs')
      .insert({
        doctor_id: doctorId,
        action_type: 'quota_reset',
        quota_before: doctor.quota_used,
        quota_after: 0,
        metadata: {
          admin_id: session.adminId,
          reason: 'Manual admin reset',
        },
      })

    revalidatePath('/admin/dashboard')
    revalidatePath('/admin/doctors')
    
    return { success: true, data: true }
  } catch (error) {
    console.error('Reset doctor quota error:', error)
    return { success: false, error: 'Failed to reset quota' }
  }
}

export async function updateDoctorTemplate(doctorId: string, templateConfig: Json): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifyAdminSession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    const { error } = await supabase
      .from('doctors')
      .update({
        template_config: templateConfig,
        updated_at: new Date().toISOString()
      })
      .eq('id', doctorId)

    if (error) {
      console.error('Update template error:', error)
      return { success: false, error: 'Failed to update template configuration' }
    }

    revalidatePath('/admin/dashboard')
    
    return { success: true, data: true }
  } catch (error) {
    console.error('Update doctor template error:', error)
    return { success: false, error: 'Failed to update template configuration' }
  }
}