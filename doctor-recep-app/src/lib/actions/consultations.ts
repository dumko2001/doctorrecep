'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/auth/dal'
import { ConsultationCreateSchema, ConsultationUpdateSchema } from '@/lib/validations'
import { ApiResponse, Consultation, Database } from '@/lib/types'
import { uploadFile, uploadMultipleFiles, calculateTotalFileSize, validateTotalSize } from '@/lib/storage'

// Helper to parse a Json | null array field from Supabase
function parseJsonStringArray(field: unknown): string[] {
  if (!field) return []
  if (Array.isArray(field)) return field as string[]
  if (typeof field === 'string') {
    try {
      return JSON.parse(field)
    } catch {
      return []
    }
  }
  return []
}

// New function to handle file uploads and consultation creation
export async function createConsultationWithFiles(
  audioFile: File,
  imageFiles: File[],
  additionalAudioFiles: File[],
  submittedBy: 'doctor' | 'receptionist'
): Promise<ApiResponse<Consultation>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate total file size
    const allFiles = [audioFile, ...imageFiles, ...additionalAudioFiles]
    const totalSizeValidation = validateTotalSize(allFiles)
    if (!totalSizeValidation.valid) {
      return { success: false, error: totalSizeValidation.error! }
    }

    // Generate consultation ID for file organization
    const consultationId = crypto.randomUUID()

    // Upload primary audio file
    const audioUploadResult = await uploadFile(audioFile, session.userId, consultationId, 'audio')
    if (!audioUploadResult.success) {
      return { success: false, error: `Audio upload failed: ${audioUploadResult.error}` }
    }

    // Upload additional audio files
    let additionalAudioUrls: string[] = []
    if (additionalAudioFiles.length > 0) {
      const additionalAudioResult = await uploadMultipleFiles(additionalAudioFiles, session.userId, consultationId, 'audio')
      if (!additionalAudioResult.success) {
        return { success: false, error: `Additional audio upload failed: ${additionalAudioResult.errors?.join(', ')}` }
      }
      additionalAudioUrls = additionalAudioResult.urls || []
    }

    // Upload image files
    let imageUrls: string[] = []
    if (imageFiles.length > 0) {
      const imageUploadResult = await uploadMultipleFiles(imageFiles, session.userId, consultationId, 'image')
      if (!imageUploadResult.success) {
        return { success: false, error: `Image upload failed: ${imageUploadResult.errors?.join(', ')}` }
      }
      imageUrls = imageUploadResult.urls || []
    }

    const totalFileSize = calculateTotalFileSize(allFiles)

    const supabase = await createClient()

    // Insert consultation with pre-generated ID
    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert({
        id: consultationId,
        doctor_id: session.userId,
        primary_audio_url: audioUploadResult.url!,
        additional_audio_urls: additionalAudioUrls,
        image_urls: imageUrls,
        submitted_by: submittedBy,
        status: 'pending',
        total_file_size_bytes: totalFileSize,
      } as Database['public']['Tables']['consultations']['Insert'])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create consultation' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/mobile')

    return { success: true, data: consultation as Consultation }
  } catch (error) {
    console.error('Create consultation with files error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function createConsultation(formData: FormData): Promise<ApiResponse<Consultation>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    // Extract URLs from form data
    const primaryAudioUrl = formData.get('primary_audio_url') as string
    const additionalAudioUrlsString = formData.get('additional_audio_urls') as string
    const imageUrlsString = formData.get('image_urls') as string
    const totalFileSizeString = formData.get('total_file_size_bytes') as string

    let additionalAudioUrls: string[] = []
    let imageUrls: string[] = []
    let totalFileSize = 0

    // Parse additional audio URLs
    if (additionalAudioUrlsString) {
      try {
        additionalAudioUrls = JSON.parse(additionalAudioUrlsString)
      } catch (error) {
        console.error('Error parsing additional_audio_urls:', error)
      }
    }

    // Parse image URLs
    if (imageUrlsString) {
      try {
        imageUrls = JSON.parse(imageUrlsString)
      } catch (error) {
        console.error('Error parsing image_urls:', error)
      }
    }

    // Parse total file size
    if (totalFileSizeString) {
      totalFileSize = parseInt(totalFileSizeString, 10) || 0
    }

    // Validate form data
    const validatedFields = ConsultationCreateSchema.safeParse({
      primary_audio_url: primaryAudioUrl,
      additional_audio_urls: additionalAudioUrls,
      image_urls: imageUrls,
      submitted_by: formData.get('submitted_by'),
      total_file_size_bytes: totalFileSize,
    })

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Invalid form data: ' + JSON.stringify(validatedFields.error.flatten().fieldErrors)
      }
    }

    const { primary_audio_url, additional_audio_urls, image_urls, submitted_by, total_file_size_bytes } = validatedFields.data

    const supabase = await createClient()

    // Insert consultation
    const { data: consultation, error } = await supabase
      .from('consultations')
      .insert({
        doctor_id: session.userId,
        primary_audio_url,
        additional_audio_urls: additional_audio_urls || [],
        image_urls: image_urls || [],
        submitted_by,
        status: 'pending',
        total_file_size_bytes: total_file_size_bytes || 0,
      } as Database['public']['Tables']['consultations']['Insert'])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to create consultation' }
    }

    revalidatePath('/dashboard')
    revalidatePath('/mobile')

    return { success: true, data: consultation as Consultation }
  } catch (error) {
    console.error('Create consultation error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function getConsultations(status?: 'pending' | 'generated' | 'approved'): Promise<ApiResponse<Consultation[]>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    let query = supabase
      .from('consultations')
      .select('id, doctor_id, submitted_by, primary_audio_url, additional_audio_urls, image_urls, ai_generated_note, edited_note, status, patient_number, total_file_size_bytes, file_retention_until, created_at, updated_at')
      .eq('doctor_id', session.userId)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: consultations, error } = await query

    if (error) {
      console.error('Database error:', error)
      return { success: false, error: 'Failed to fetch consultations' }
    }

    // Map to Consultation[]
    const typedConsultations = (consultations || []).map((row: Database['public']['Tables']['consultations']['Row']) => {
      return {
        id: row.id,
        doctor_id: row.doctor_id!,
        submitted_by: row.submitted_by as 'doctor' | 'receptionist',
        primary_audio_url: row.primary_audio_url,
        additional_audio_urls: parseJsonStringArray(row.additional_audio_urls),
        image_urls: parseJsonStringArray(row.image_urls),
        ai_generated_note: row.ai_generated_note ?? undefined,
        edited_note: row.edited_note ?? undefined,
        status: row.status as 'pending' | 'generated' | 'approved',
        patient_number: row.patient_number ?? undefined,
        total_file_size_bytes: row.total_file_size_bytes ?? 0,
        file_retention_until: row.file_retention_until,
        created_at: row.created_at,
        updated_at: row.updated_at,
      } as Consultation
    })

    return { success: true, data: typedConsultations }
  } catch (error) {
    console.error('Get consultations error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function generateSummary(consultationId: string, additionalImages?: string[]): Promise<ApiResponse<string>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Check quota before proceeding
    const { data: quotaCheck } = await supabase
      .rpc('check_and_update_quota', { doctor_uuid: session.userId })

    if (!quotaCheck) {
      return {
        success: false,
        error: 'Quota exceeded. You have reached your monthly AI generation limit. Please contact admin or wait for next month.'
      }
    }

    // Get consultation and doctor data
    const { data: consultation, error: consultationError } = await supabase
      .from('consultations')
      .select('id, doctor_id, submitted_by, primary_audio_url, additional_audio_urls, image_urls, ai_generated_note, edited_note, status, patient_number, created_at, updated_at, doctors(template_config)')
      .eq('id', consultationId)
      .eq('doctor_id', session.userId)
      .single()

    if (consultationError || !consultation) {
      return { success: false, error: 'Consultation not found' }
    }

    // Strictly type consultation
    type ConsultationRow = Database['public']['Tables']['consultations']['Row'] & { doctors: { template_config: unknown } }
    const typedConsultation = consultation as ConsultationRow

    // Parse additional_audio_urls and image_urls from JSON if needed
    const additionalAudioUrls = parseJsonStringArray(typedConsultation.additional_audio_urls)
    const imageUrls = parseJsonStringArray(typedConsultation.image_urls)
    const allImageUrls = [...imageUrls, ...(additionalImages || [])]

    // Call Gemini API with URLs
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/generate-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        primary_audio_url: typedConsultation.primary_audio_url,
        additional_audio_urls: additionalAudioUrls,
        image_urls: allImageUrls,
        template_config: typedConsultation.doctors.template_config,
        submitted_by: typedConsultation.submitted_by,
      }),
    })

    if (!response.ok) {
      return { success: false, error: 'Failed to generate summary' }
    }

    const responseData = await response.json()
    const generated_summary = responseData.summary || responseData.generated_summary

    // Update consultation with generated summary
    const { error: updateError } = await supabase
      .from('consultations')
      .update({
        ai_generated_note: generated_summary,
        status: 'generated',
      } as Database['public']['Tables']['consultations']['Update'])
      .eq('id', consultationId)

    if (updateError) {
      console.error('Update error:', updateError)
      return { success: false, error: 'Failed to save generated summary' }
    }

    revalidatePath('/dashboard')

    return { success: true, data: generated_summary }
  } catch (error) {
    console.error('Generate summary error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function approveConsultation(
  consultationId: string,
  editedNote: string
): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    // Validate edited note
    const validatedFields = ConsultationUpdateSchema.safeParse({
      edited_note: editedNote,
    })

    if (!validatedFields.success) {
      return { success: false, error: 'Invalid note content' }
    }

    const supabase = await createClient()

    // Update consultation
    const { error } = await supabase
      .from('consultations')
      .update({
        edited_note: editedNote,
        status: 'approved',
      } as Database['public']['Tables']['consultations']['Update'])
      .eq('id', consultationId)
      .eq('doctor_id', session.userId)

    if (error) {
      console.error('Update error:', error)
      return { success: false, error: 'Failed to approve consultation' }
    }

    revalidatePath('/dashboard')

    return { success: true, data: true }
  } catch (error) {
    console.error('Approve consultation error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function updateConsultationImages(consultationId: string, imageUrls: string[]): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }

    const supabase = await createClient()

    // Update consultation with new image URLs
    const { error } = await supabase
      .from('consultations')
      .update({
        image_urls: imageUrls,
      } as Database['public']['Tables']['consultations']['Update'])
      .eq('id', consultationId)
      .eq('doctor_id', session.userId)

    if (error) {
      console.error('Update consultation images error:', error)
      return { success: false, error: 'Failed to update consultation images' }
    }

    revalidatePath('/dashboard')
    return { success: true, data: true }
  } catch (error) {
    console.error('Update consultation images error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

export async function addAdditionalAudio(consultationId: string, audioFile: File): Promise<ApiResponse<boolean>> {
  try {
    const session = await verifySession()
    if (!session) {
      return { success: false, error: 'Unauthorized' }
    }
    const supabase = await createClient()

    // Fetch the consultation
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('additional_audio_urls, status')
      .eq('id', consultationId)
      .eq('doctor_id', session.userId)
      .single()
    if (fetchError || !consultation) {
      return { success: false, error: 'Consultation not found' }
    }
    if (consultation.status === 'approved') {
      return { success: false, error: `Cannot add audio to approved consultations. Current status: ${consultation.status}` }
    }

    // Upload the additional audio file
    const uploadResult = await uploadFile(audioFile, session.userId, consultationId, 'audio')
    if (!uploadResult.success) {
      return { success: false, error: `Audio upload failed: ${uploadResult.error}` }
    }

    const additionalAudioUrls = parseJsonStringArray(consultation.additional_audio_urls)
    additionalAudioUrls.push(uploadResult.url!)

    // Update the consultation
    const { error: updateError } = await supabase
      .from('consultations')
      .update({ additional_audio_urls: additionalAudioUrls } as Database['public']['Tables']['consultations']['Update'])
      .eq('id', consultationId)
    if (updateError) {
      return { success: false, error: 'Failed to add additional audio' }
    }
    revalidatePath('/dashboard')
    revalidatePath('/record')
    return { success: true, data: true }
  } catch (error) {
    console.error('Add additional audio error:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
