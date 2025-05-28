import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
// RetryConfig type definition
export type RetryConfig = {
  maxAttempts: number
  baseDelay: number
  maxDelay: number
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// File utility functions for Supabase storage
export function createFileFromBlob(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type })
}

// Format duration in seconds to MM:SS
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format date for display (SSR-safe)
export function formatDate(dateString: string): string {
  const date = new Date(dateString)

  // Use a consistent format that works on both server and client
  const year = date.getFullYear()
  const month = date.toLocaleDateString('en-US', { month: 'short' })
  const day = date.getDate().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
  const displayHours = date.getHours() % 12 || 12

  return `${day} ${month} ${year} at ${displayHours.toString().padStart(2, '0')}:${minutes} ${ampm}`
}

// Format relative time (e.g., "2 hours ago")
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  } else {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
}

// Retry function with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000
  }
): Promise<T> {
  let lastError: Error

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error

      if (attempt === config.maxAttempts) {
        throw lastError
      }

      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt - 1),
        config.maxDelay
      )

      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError!
}

// Validate URL string
export function isValidUrl(str: string): boolean {
  try {
    new URL(str)
    return true
  } catch {
    return false
  }
}

// Generate patient summary prompt for Gemini
export function generatePrompt(
  templateConfig: unknown,
  submittedBy: 'doctor' | 'receptionist'
): string {
  const { prescription_format, language, tone, sections } = templateConfig as { prescription_format: string, language: string, tone: string, sections: string[] }

  const contextNote = submittedBy === 'doctor'
    ? 'This consultation was recorded by the doctor during patient visit.'
    : 'This consultation is being reviewed by the receptionist for final summary.'

  return `
You are an AI assistant helping Indian doctors create patient consultation summaries.

Context: ${contextNote}

Please analyze the provided audio recording and any handwritten notes (if image provided) to generate a comprehensive patient summary.

Requirements:
- Language: ${language}
- Tone: ${tone}
- Format: ${prescription_format}
- Include sections: ${sections.join(', ')}

Instructions:
1. Transcribe the audio accurately
2. Extract key medical information
3. If image provided, include any relevant handwritten notes
4. Structure the summary according to the specified sections
5. Use appropriate medical terminology
6. Ensure the summary is clear and professional

Please provide a well-structured patient consultation summary based on the audio and image inputs.
  `.trim()
}

// Truncate text with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// Check if device supports audio recording
export function supportsAudioRecording(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Check if device supports camera
export function supportsCamera(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}
