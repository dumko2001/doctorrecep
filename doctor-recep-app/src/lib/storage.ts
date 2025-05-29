import { createClient } from '@/lib/supabase/client'

// Storage configuration
export const STORAGE_CONFIG = {
  AUDIO_BUCKET: 'consultation-audio',
  IMAGE_BUCKET: 'consultation-images',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB per file
  MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB per consultation
  ALLOWED_AUDIO_TYPES: ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mpeg', 'audio/mp4', 'audio/ogg'],
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'],
  RETENTION_DAYS: 30
}

// File validation
export function validateFile(file: File, type: 'audio' | 'image'): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${STORAGE_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB limit` }
  }

  // Check file type
  const allowedTypes = type === 'audio' ? STORAGE_CONFIG.ALLOWED_AUDIO_TYPES : STORAGE_CONFIG.ALLOWED_IMAGE_TYPES
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: `File type ${file.type} is not allowed` }
  }

  return { valid: true }
}

// Generate storage path
export function generateStoragePath(
  doctorId: string,
  consultationId: string,
  fileName: string,
  _type: 'audio' | 'image'
): string {
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
  return `${doctorId}/${consultationId}/${sanitizedFileName}`
}

// Upload file to Supabase Storage (client-side with service role)
export async function uploadFile(
  file: File,
  doctorId: string,
  consultationId: string,
  type: 'audio' | 'image'
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    // Validate file
    const validation = validateFile(file, type)
    if (!validation.valid) {
      return { success: false, error: validation.error }
    }

    // Use service role client for uploads to bypass RLS
    const supabase = createClient()
    const bucket = type === 'audio' ? STORAGE_CONFIG.AUDIO_BUCKET : STORAGE_CONFIG.IMAGE_BUCKET
    const filePath = generateStoragePath(doctorId, consultationId, file.name, type)

    // Upload file
    const { error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      return { success: false, error: `Upload failed: ${error.message || JSON.stringify(error) || 'Unknown storage error'}` }
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return { success: true, url: urlData.publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    return { success: false, error: 'Upload failed due to unexpected error' }
  }
}

// Upload multiple files
export async function uploadMultipleFiles(
  files: File[],
  doctorId: string,
  consultationId: string,
  type: 'audio' | 'image'
): Promise<{ success: boolean; urls?: string[]; errors?: string[] }> {
  const results = await Promise.all(
    files.map(file => uploadFile(file, doctorId, consultationId, type))
  )

  const successful = results.filter(r => r.success)
  const failed = results.filter(r => !r.success)

  if (failed.length > 0) {
    return {
      success: false,
      errors: failed.map(f => f.error || 'Unknown error')
    }
  }

  return {
    success: true,
    urls: successful.map(s => s.url!).filter(Boolean)
  }
}

// Delete file from storage (client-side)
export async function deleteFile(
  filePath: string,
  type: 'audio' | 'image'
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient()
    const bucket = type === 'audio' ? STORAGE_CONFIG.AUDIO_BUCKET : STORAGE_CONFIG.IMAGE_BUCKET

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      console.error('Storage delete error:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error('Delete error:', error)
    return { success: false, error: 'Delete failed due to unexpected error' }
  }
}

// Extract file path from URL
export function extractFilePathFromUrl(url: string, type: 'audio' | 'image'): string | null {
  try {
    const bucket = type === 'audio' ? STORAGE_CONFIG.AUDIO_BUCKET : STORAGE_CONFIG.IMAGE_BUCKET
    const bucketPath = `/storage/v1/object/public/${bucket}/`
    const index = url.indexOf(bucketPath)

    if (index === -1) return null

    return url.substring(index + bucketPath.length)
  } catch {
    return null
  }
}

// Download file from storage (client-side)
export async function downloadFile(
  filePath: string,
  type: 'audio' | 'image'
): Promise<{ success: boolean; data?: Blob; error?: string }> {
  try {
    const supabase = createClient()
    const bucket = type === 'audio' ? STORAGE_CONFIG.AUDIO_BUCKET : STORAGE_CONFIG.IMAGE_BUCKET

    const { data, error } = await supabase.storage
      .from(bucket)
      .download(filePath)

    if (error) {
      console.error('Storage download error:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Download error:', error)
    return { success: false, error: 'Download failed due to unexpected error' }
  }
}

// Calculate total file size
export function calculateTotalFileSize(files: File[]): number {
  return files.reduce((total, file) => total + file.size, 0)
}

// Validate total consultation file size
export function validateTotalSize(files: File[]): { valid: boolean; error?: string } {
  const totalSize = calculateTotalFileSize(files)
  if (totalSize > STORAGE_CONFIG.MAX_TOTAL_SIZE) {
    return {
      valid: false,
      error: `Total file size exceeds ${STORAGE_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024}MB limit`
    }
  }
  return { valid: true }
}
