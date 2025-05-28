'use client'

import { useState } from 'react'
import { Send, CheckCircle, AlertCircle } from 'lucide-react'
import { createConsultationWithFiles } from '@/lib/actions/consultations'
import { retryWithBackoff } from '@/lib/utils'
import { ImageFile } from '@/lib/types'

interface SubmissionFormProps {
  audioFile?: File
  imageFiles?: ImageFile[]
  canSubmit: boolean
  isSubmitting: boolean
  onSubmissionStateChange: (isSubmitting: boolean) => void
}

export function SubmissionForm({
  audioFile,
  imageFiles,
  canSubmit,
  isSubmitting,
  onSubmissionStateChange,
}: SubmissionFormProps) {
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')

  const handleSubmit = async () => {
    if (!audioFile || isSubmitting) return

    onSubmissionStateChange(true)
    setSubmitStatus('idle')
    setErrorMessage('')
    setSuccessMessage('')

    try {
      // Extract File objects from ImageFile array
      const imageFileObjects = imageFiles?.map(img => img.file) || []

      // Submit with retry logic
      const result = await retryWithBackoff(
        () => createConsultationWithFiles(
          audioFile,
          imageFileObjects,
          [], // No additional audio files for now
          'doctor'
        ),
        {
          maxAttempts: 3,
          baseDelay: 1000,
          maxDelay: 5000,
        }
      )

      if (result.success) {
        setSubmitStatus('success')
        setSuccessMessage(
          `Consultation submitted successfully! Patient #${result.data?.patient_number || 'N/A'} is ready for processing.`
        )

        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setSubmitStatus('idle')
          setSuccessMessage('')
        }, 5000)
      } else {
        setSubmitStatus('error')
        setErrorMessage(result.error || 'Failed to submit consultation')
      }
    } catch (error) {
      console.error('Submission error:', error)
      setSubmitStatus('error')
      setErrorMessage('Network error. Please check your connection and try again.')
    } finally {
      onSubmissionStateChange(false)
    }
  }

  const getSubmitButtonContent = () => {
    if (isSubmitting) {
      return (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span>Submitting...</span>
        </>
      )
    }

    if (submitStatus === 'success') {
      return (
        <>
          <CheckCircle className="w-4 h-4" />
          <span>Submitted!</span>
        </>
      )
    }

    return (
      <>
        <Send className="w-4 h-4" />
        <span>Submit Consultation</span>
      </>
    )
  }

  const getSubmitButtonClass = () => {
    const baseClass = "w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-md text-sm font-medium transition-colors"

    if (!canSubmit) {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`
    }

    if (isSubmitting) {
      return `${baseClass} bg-blue-400 text-white cursor-not-allowed`
    }

    if (submitStatus === 'success') {
      return `${baseClass} bg-green-500 text-white`
    }

    return `${baseClass} bg-blue-500 hover:bg-blue-600 text-white`
  }

  return (
    <div className="space-y-4">
      {/* Submission Summary */}
      <div className="bg-gray-50 rounded-md p-3">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Ready to Submit:</h4>
        <div className="space-y-1 text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Audio Recording:</span>
            <span className={audioFile ? 'text-green-600' : 'text-red-600'}>
              {audioFile ? '✓ Ready' : '✗ Required'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span>Handwritten Notes:</span>
            <span className={imageFiles && imageFiles.length > 0 ? 'text-green-600' : 'text-gray-500'}>
              {imageFiles && imageFiles.length > 0 ? `✓ ${imageFiles.length} image(s)` : '○ Optional'}
            </span>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit || isSubmitting}
        className={getSubmitButtonClass()}
      >
        {getSubmitButtonContent()}
      </button>

      {/* Status Messages */}
      {submitStatus === 'success' && successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {submitStatus === 'error' && errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-red-700">{errorMessage}</p>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                className="mt-2 text-xs text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      {submitStatus === 'idle' && (
        <div className="bg-blue-50 rounded-md p-3">
          <p className="text-xs text-blue-700">
            <strong>Next steps:</strong> After submission, your receptionist can review and generate
            the patient summary from the dashboard. The consultation will be assigned a patient number
            for easy tracking.
          </p>
        </div>
      )}
    </div>
  )
}
