'use client'

import { useState } from 'react'
import { AudioRecorder } from './audio-recorder'
import { ImageCapture } from './image-capture'
import { SubmissionForm } from './submission-form'
import { AudioRecordingState, ImageCaptureState } from '@/lib/types'

export function MobileRecordingInterface() {
  const [audioState, setAudioState] = useState<AudioRecordingState>({
    isRecording: false,
    duration: 0,
  })

  const [imageState, setImageState] = useState<ImageCaptureState>({ images: [], error: null })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAudioStateChange = (newState: Partial<AudioRecordingState>) => {
    setAudioState(prev => ({ ...prev, ...newState }))
  }

  const handleImageStateChange = (newState: Partial<ImageCaptureState>) => {
    setImageState(prev => ({ ...prev, ...newState }))
  }

  const canSubmit = !!audioState.audioFile && !isSubmitting

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="text-lg font-medium text-blue-900 mb-2">
          Record Patient Consultation
        </h2>
        <p className="text-sm text-blue-700">
          1. Tap the microphone to start recording your consultation
          <br />
          2. Optionally, take a photo of any handwritten notes
          <br />
          3. Submit to generate patient summary
        </p>
      </div>

      {/* Audio Recording */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Audio Recording
        </h3>
        <AudioRecorder
          audioState={audioState}
          onStateChange={handleAudioStateChange}
        />
      </div>

      {/* Image Capture */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Handwritten Notes (Optional)
        </h3>
        <ImageCapture
          imageState={imageState}
          onStateChange={handleImageStateChange}
        />
      </div>

      {/* Submission */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Submit Consultation
        </h3>
        <SubmissionForm
          audioFile={audioState.audioFile}
          imageFiles={imageState.images}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onSubmissionStateChange={setIsSubmitting}
        />
      </div>

      {/* Status */}
      {(audioState.error || imageState.error) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Errors:</h4>
          {audioState.error && (
            <p className="text-sm text-red-700">Audio: {audioState.error}</p>
          )}
          {imageState.error && (
            <p className="text-sm text-red-700">Image: {imageState.error}</p>
          )}
        </div>
      )}
    </div>
  )
}
