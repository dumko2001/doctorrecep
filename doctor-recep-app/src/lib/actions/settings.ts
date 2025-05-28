'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/auth/dal'
import { ApiResponse, Database } from '@/lib/types'

export async function updateDoctorSettings(
  doctorId: string,
  templateConfig: Database['public']['Tables']['doctors']['Row']['template_config']
): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifySession()
    if (!session || session.userId !== doctorId) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Update doctor's template config
    const { error } = await supabase
      .from('doctors')
      .update({
        template_config: templateConfig
      })
      .eq('id', doctorId)

    if (error) {
      console.error('Update settings error:', error)
      return { success: false, error: 'Failed to update settings' }
    }

    revalidatePath('/settings')
    revalidatePath('/dashboard')

    return { success: true, data: true }
  } catch (error) {
    console.error('Update settings error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
