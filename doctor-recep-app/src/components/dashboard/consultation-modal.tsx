'use client'

import { useState, useRef, useEffect } from 'react'
import { X, Play, Pause, Wand2, Save, Copy, Camera, Upload, Mic, Square } from 'lucide-react'
import { Consultation } from '@/lib/types'
import { formatDate } from '@/lib/utils'
import { generateSummary, approveConsultation, addAdditionalAudio } from '@/lib/actions/consultations'
import Image from 'next/image'

interface ConsultationModalProps {
  consultation: Consultation
  onClose: () => void
  onConsultationUpdate?: (updatedConsultation: Consultation) => void
}

export function ConsultationModal({ consultation, onClose, onConsultationUpdate }: ConsultationModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [editedNote, setEditedNote] = useState(consultation.edited_note || consultation.ai_generated_note || '')
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null)
  const [success, setSuccess] = useState<string>('')
  const [additionalImages, setAdditionalImages] = useState<Array<{ id: string; url: string; preview?: string }>>([])
  const [isRecordingAdditional, setIsRecordingAdditional] = useState(false)
  const [additionalAudioBlob, setAdditionalAudioBlob] = useState<Blob | null>(null)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Sync editedNote state when consultation data changes
  useEffect(() => {
    setEditedNote(consultation.edited_note || consultation.ai_generated_note || '')
  }, [consultation.edited_note, consultation.ai_generated_note])

  // Handle additional image upload - Upload to Supabase Storage
  const handleImageUpload = async (files: FileList) => {
    try {
      setSuccess('Uploading images...')

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) continue
        if (file.size > 10 * 1024 * 1024) continue // 10MB limit

        // Upload to Supabase Storage
        const { uploadFile } = await import('@/lib/storage')
        const uploadResult = await uploadFile(file, consultation.doctor_id || '', consultation.id, 'image')

        if (uploadResult.success && uploadResult.url) {
          const preview = URL.createObjectURL(file)
          setAdditionalImages(prev => [...prev, {
            id: `${Date.now()}-${i}`,
            url: uploadResult.url!,
            preview
          }])
        } else {
          setSuccess(`Failed to upload ${file.name}: ${uploadResult.error}`)
          return
        }
      }

      setSuccess('Images uploaded successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (_error) {
      setSuccess('Failed to upload images')
    }
  }

  // Remove additional image
  const removeAdditionalImage = (id: string) => {
    setAdditionalImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove && imageToRemove.preview && typeof imageToRemove.preview === 'string') {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const handleGenerateSummary = async () => {
    setIsGenerating(true)
    setSuccess('')

    try {
      // Combine original images with additional images
      const allImages = [
        ...(Array.isArray(consultation.image_urls) ? consultation.image_urls : []),
        ...additionalImages.map(img => img.url)
      ].filter((img): img is string => typeof img === 'string' && img !== null)

      // Update the consultation with additional images before generating summary
      if (additionalImages.length > 0) {
        const { updateConsultationImages } = await import('@/lib/actions/consultations')
        await updateConsultationImages(consultation.id, allImages)
      }

      const result = await generateSummary(consultation.id, allImages)

      if (result.success) {
        setEditedNote(result.data || '')
        setSuccess('Summary generated successfully! All files processed including images.')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setSuccess(result.error || 'Failed to generate summary')
      }
    } catch {
      setSuccess('An unexpected error occurred')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApprove = async () => {
    if (!editedNote.trim()) {
      setSuccess('Please provide a summary before approving')
      return
    }

    setIsApproving(true)
    setSuccess('')

    try {
      const result = await approveConsultation(consultation.id, editedNote)

      if (result.success) {
        setSuccess('Consultation approved successfully!')
        setTimeout(() => {
          setSuccess('')
          onClose()
        }, 2000)
      } else {
        setSuccess(result.error || 'Failed to approve consultation')
      }
    } catch {
      setSuccess('An unexpected error occurred')
    } finally {
      setIsApproving(false)
    }
  }

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(editedNote)
      setSuccess('Copied to clipboard!')
      setTimeout(() => setSuccess(''), 2000)
    } catch {
      setSuccess('Failed to copy to clipboard')
    }
  }

  const playAudio = () => {
    // If audio is already playing, pause it
    if (playingAudio) {
      playingAudio.pause()
      playingAudio.currentTime = 0
      setPlayingAudio(null)
      return
    }

    // Create audio element and play from URL
    const audio = new Audio(consultation.primary_audio_url)
    
    audio.onended = () => setPlayingAudio(null)
    audio.onerror = () => {
      setPlayingAudio(null)
      setSuccess('Failed to play audio')
    }

    setPlayingAudio(audio)
    audio.play().catch(() => {
      setPlayingAudio(null)
      setSuccess('Failed to play audio')
    })
  }

  // Additional audio recording functions
  const startAdditionalRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      const chunks: BlobPart[] = []

      recorder.ondataavailable = (e) => chunks.push(e.data)
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/wav' })
        setAdditionalAudioBlob(blob)
        stream.getTracks().forEach(track => track.stop())
      }

      recorder.start()
      setMediaRecorder(recorder)
      setIsRecordingAdditional(true)
    } catch (_error) {
      setSuccess('Failed to start recording. Please check microphone permissions.')
    }
  }

  const stopAdditionalRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop()
      setIsRecordingAdditional(false)
      setMediaRecorder(null)
    }
  }

  const uploadAdditionalAudio = async () => {
    if (!additionalAudioBlob) return

    try {
      const audioFile = new File([additionalAudioBlob], `additional-audio-${Date.now()}.wav`, {
        type: 'audio/wav'
      })

      const result = await addAdditionalAudio(consultation.id, audioFile)
      if (result.success) {
        setSuccess('Additional audio uploaded successfully! Refreshing consultation data...')
        setAdditionalAudioBlob(null)

        // Fetch updated consultation data
        const { getConsultations } = await import('@/lib/actions/consultations')
        const consultationsResult = await getConsultations()

        if (consultationsResult.success && consultationsResult.data) {
          const updatedConsultation = consultationsResult.data.find(c => c.id === consultation.id)
          if (updatedConsultation && onConsultationUpdate) {
            onConsultationUpdate(updatedConsultation)
            setSuccess('Additional audio uploaded successfully! Please regenerate summary to include this audio.')
          }
        }

        setTimeout(() => setSuccess(''), 3000)
      } else {
        setSuccess(result.error || 'Failed to upload additional audio')
      }
    } catch (_error) {
      setSuccess('Failed to upload additional audio')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 z-50">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-6 py-4 border-b border-orange-200/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-slate-800">
                Patient #{consultation.patient_number || 'N/A'}
              </h3>
              <p className="text-sm text-slate-600">
                {formatDate(consultation.created_at)} • {consultation.submitted_by} • {consultation.status}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-orange-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto pb-20 sm:pb-24">
          {/* Audio Section - Side by Side Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Primary Audio */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-5 border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-slate-800 flex items-center">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mr-3"></div>
                  Primary Audio
                </h4>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={playAudio}
                  className="flex items-center space-x-3 px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  {playingAudio ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  <span>{playingAudio ? 'Pause Audio' : 'Play Audio'}</span>
                </button>
              </div>
            </div>

            {/* Additional Audio */}
            {consultation.status !== 'approved' && (
              <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl p-3 sm:p-5 border border-teal-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 sm:mb-4 space-y-2 sm:space-y-0">
                  <h4 className="text-base sm:text-lg font-semibold text-slate-800 flex items-center">
                    <div className="w-2 h-2 bg-teal-500 rounded-full mr-2 sm:mr-3"></div>
                    Additional Audio
                  </h4>
                  <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-full self-start">Optional</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 gap-2">
                    {!isRecordingAdditional && !additionalAudioBlob && (
                      <button
                        onClick={startAdditionalRecording}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-all duration-200 w-full sm:w-auto"
                      >
                        <Mic className="w-4 h-4" />
                        <span>Record</span>
                      </button>
                    )}

                    {isRecordingAdditional && (
                      <button
                        onClick={stopAdditionalRecording}
                        className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium animate-pulse transition-all duration-200 w-full sm:w-auto"
                      >
                        <Square className="w-4 h-4" />
                        <span>Stop Recording</span>
                      </button>
                    )}

                    {additionalAudioBlob && (
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                        <button
                          onClick={uploadAdditionalAudio}
                          className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          <Upload className="w-4 h-4" />
                          <span>Upload</span>
                        </button>
                        <button
                          onClick={() => setAdditionalAudioBlob(null)}
                          className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                          <span>Cancel</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {isRecordingAdditional && (
                    <div className="flex items-center space-x-2 bg-red-100 px-3 py-2 rounded-lg">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-red-700 font-medium">Recording...</span>
                    </div>
                  )}

                  {additionalAudioBlob && (
                    <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-green-700 font-medium">Ready to upload</span>
                    </div>
                  )}

                  {/* Show existing additional audio files */}
                  {consultation.additional_audio_urls && 
                   Array.isArray(consultation.additional_audio_urls) && 
                   consultation.additional_audio_urls.length > 0 && (
                    <div className="p-3 bg-white rounded-lg border">
                      <p className="text-sm text-gray-600">Additional files: {consultation.additional_audio_urls.length}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Images Section - Compact Layout */}
          {consultation.image_urls && Array.isArray(consultation.image_urls) && consultation.image_urls.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Original Images ({consultation.image_urls.length} image{consultation.image_urls.length > 1 ? 's' : ''})
              </h4>
              <div className="flex flex-wrap gap-3">
                {consultation.image_urls
                  .filter((imageUrl): imageUrl is string => typeof imageUrl === 'string' && imageUrl !== null)
                  .map((imageUrl, index) => (
                    <div key={index} className="relative group">
                      <div className="w-24 h-24 bg-gray-200 rounded border overflow-hidden">
                        <Image
                          src={imageUrl}
                          alt={`Original image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200 cursor-pointer"
                          width={96}
                          height={96}
                          priority={index < 2}
                          loading={index < 2 ? 'eager' : 'lazy'}
                          onError={(e) => {
                            console.error('Image failed to load:', imageUrl)
                            const target = e.currentTarget as HTMLImageElement
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00OCA2NEw0MCA1Nkw0OCA0OEw1NiA1Nkw0OCA2NFoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+'
                            target.alt = 'Failed to load image'
                          }}
                        />
                      </div>
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-1 py-0.5 rounded">
                        {index + 1}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Additional Images Section for Nurses */}
          <div className="bg-orange-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-slate-800">
                Additional Images
              </h4>
              <span className="text-xs text-slate-500">Optional for nurses</span>
            </div>

            <div className="flex items-center space-x-3 mb-3">
              {/* Compact Camera button */}
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 border border-orange-300 rounded-md hover:bg-orange-100 transition-colors text-sm"
              >
                <Camera className="w-4 h-4 text-orange-500" />
                <span className="text-orange-700">Camera</span>
              </button>

              {/* Compact Upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3 py-2 border border-orange-300 rounded-md hover:bg-orange-100 transition-colors text-sm"
              >
                <Upload className="w-4 h-4" />
                <span className="text-orange-700">Upload</span>
              </button>

              {additionalImages.length > 0 && (
                <span className="text-xs text-orange-600 font-medium">
                  +{additionalImages.length} image{additionalImages.length > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Compact image previews */}
            {additionalImages.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {additionalImages.map((image) => (
                  <div key={image.id} className="relative">
                    <Image
                      src={image.preview || ''}
                      alt="Additional"
                      className="w-12 h-12 object-cover rounded border hover:w-24 hover:h-24 transition-all duration-200 cursor-pointer"
                      width={48}
                      height={48}
                    />
                    <button
                      onClick={() => removeAdditionalImage(image.id)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Hidden inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
              className="hidden"
            />
          </div>

          {/* Summary Section */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-5 border border-green-100">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                AI-Generated Patient Summary
              </h4>
              <div className="flex items-center space-x-2">
                {(consultation.status === 'pending' || consultation.status === 'generated') && (
                  <button
                    onClick={handleGenerateSummary}
                    disabled={isGenerating}
                    className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 disabled:from-purple-300 disabled:to-purple-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Wand2 className="w-4 h-4" />
                    <span>{isGenerating ? 'Generating...' : consultation.status === 'generated' ? 'Regenerate Summary' : 'Generate Summary'}</span>
                  </button>
                )}

                {editedNote && (
                  <button
                    onClick={handleCopyToClipboard}
                    className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy</span>
                  </button>
                )}
              </div>
            </div>

            <textarea
              value={editedNote}
              onChange={(e) => setEditedNote(e.target.value)}
              placeholder={
                consultation.status === 'pending'
                  ? 'Click "Generate Summary" to create an AI-powered patient summary using Gemini 2.5 Flash Preview...'
                  : 'Edit the patient summary as needed...'
              }
              className="w-full h-72 p-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm text-gray-900 bg-white resize-none transition-all duration-200"
              disabled={isGenerating}
            />
          </div>

          {/* Status Messages */}
          {success && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <p className="text-sm text-green-700 font-medium">{success}</p>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-3 sm:px-6 py-3 sm:py-4 border-t border-orange-200/50 flex-shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium self-start ${
                consultation.status === 'pending' ? 'bg-orange-100 text-orange-800 border border-orange-300' :
                consultation.status === 'generated' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                'bg-green-100 text-green-800 border border-green-300'
              }`}>
                {consultation.status.toUpperCase()}
              </div>
              <span className="text-xs sm:text-sm text-slate-600">
                Last updated: {formatDate(consultation.updated_at)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <button
                onClick={onClose}
                className="px-4 sm:px-6 py-2 border border-orange-300 hover:border-teal-400 text-sm font-medium rounded-xl text-slate-700 bg-white/70 hover:bg-orange-50 transition-all duration-200 text-center"
              >
                Close
              </button>

              {consultation.status !== 'approved' && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving || !editedNote.trim()}
                  className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 disabled:from-teal-300 disabled:to-emerald-400 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Save className="w-4 h-4" />
                  <span>{isApproving ? 'Approving...' : 'Approve & Save'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
