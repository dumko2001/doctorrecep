'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Camera, Upload, Send, CheckCircle, AlertCircle, Play, Pause, X } from 'lucide-react'
import { createConsultationWithFiles } from '@/lib/actions/consultations'
import Image from 'next/image'

interface SimpleRecorderProps {
  isMobile: boolean
}

export function SimpleRecorder({ isMobile }: SimpleRecorderProps) {
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Image state
  const [images, setImages] = useState<Array<{ id: string, file: File, preview: string }>>([])

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  // Error state
  const [error, setError] = useState('')

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      images.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [images])



  // Start recording
  const startRecording = async () => {
    try {
      setError('')

      // Check if MediaRecorder is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Audio recording is not supported on this device')
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      streamRef.current = stream

      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/mpeg')) {
          mimeType = 'audio/mpeg';
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType })

        // Convert blob to File object for upload
        const fileExtension = mimeType.split('/')[1].split(';')[0] // Extract extension from mime type
        const file = new File([blob], `recording_${Date.now()}.${fileExtension}`, {
          type: mimeType
        })

        setAudioBlob(blob)
        setAudioFile(file)
        setIsRecording(false)

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setDuration(0)

      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1)
      }, 1000)

    } catch (err) {
      console.error('Recording error:', err)
      setError(err instanceof Error ? err.message : 'Failed to start recording. Please check microphone permissions.')
      setIsRecording(false)
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  // Play/pause audio
  const togglePlayback = () => {
    if (!audioBlob || !audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      const audioUrl = URL.createObjectURL(audioBlob)
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  // Clear recording
  const clearRecording = () => {
    setAudioBlob(null)
    setAudioFile(null)
    setDuration(0)
    setIsPlaying(false)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }

  // Handle image upload
  const handleImageUpload = async (files: FileList) => {
    try {
      const newImages: Array<{ id: string; file: File; preview: string }> = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        if (!file.type.startsWith('image/')) continue
        if (file.size > 10 * 1024 * 1024) continue // 10MB limit

        const preview = URL.createObjectURL(file)

        newImages.push({
          id: `${Date.now()}-${i}`,
          file,
          preview
        })
      }

      setImages(prev => [...prev, ...newImages])
    } catch {
      setError('Failed to process images')
    }
  }

  // Remove image
  const removeImage = (id: string) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id)
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  // Submit consultation
  const handleSubmit = async () => {
    if (!audioFile || isSubmitting) return

    setIsSubmitting(true)
    setSubmitStatus('idle')
    setMessage('')

    try {
      // Extract File objects from images
      const imageFiles = images.map(img => img.file)

      const result = await createConsultationWithFiles(
        audioFile,
        imageFiles,
        [], // No additional audio files for now
        'doctor'
      )

      if (result.success) {
        setSubmitStatus('success')
        setMessage(`Consultation submitted successfully! Patient #${result.data?.patient_number || 'N/A'}`)

        // Clear form after success
        setTimeout(() => {
          clearRecording()
          setImages([])
          setSubmitStatus('idle')
          setMessage('')
        }, 3000)
      } else {
        setSubmitStatus('error')
        setMessage(result.error || 'Failed to submit consultation')
      }
    } catch {
      setSubmitStatus('error')
      setMessage('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const canSubmit = audioFile && !isSubmitting

  return (
    <div className={`${isMobile ? 'p-4' : 'max-w-2xl mx-auto p-6'} space-y-6`}>
      {/* Header */}
      <div className="text-center">
        <h1 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-gray-900 mb-2`}>
          Record Consultation
        </h1>
        <p className={`${isMobile ? 'text-sm' : 'text-base'} text-gray-600`}>
          {isMobile ? 'Tap to record, add photos, submit' : 'Record audio, add images, and submit for AI processing'}
        </p>
      </div>

      {/* Recording Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col items-center space-y-4">
          {!audioBlob ? (
            // Recording interface
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                disabled={!!error}
                className={`${isMobile ? 'w-24 h-24' : 'w-20 h-20'} rounded-full flex items-center justify-center text-white transition-all duration-200 ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                } disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
              >
                {isRecording ? (
                  <Square className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'}`} />
                ) : (
                  <Mic className={`${isMobile ? 'w-10 h-10' : 'w-8 h-8'}`} />
                )}
              </button>

              <div className="text-center">
                <p className={`${isMobile ? 'text-lg' : 'text-base'} font-medium text-gray-700`}>
                  {isRecording ? 'Recording...' : 'Tap to start recording'}
                </p>
                {isRecording && (
                  <p className={`${isMobile ? 'text-2xl' : 'text-xl'} font-mono text-red-600 mt-2`}>
                    {formatDuration(duration)}
                  </p>
                )}
              </div>
            </>
          ) : (
            // Playback interface
            <>
              <div className="flex items-center space-x-4">
                <button
                  onClick={togglePlayback}
                  className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center`}
                >
                  {isPlaying ? (
                    <Pause className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'}`} />
                  ) : (
                    <Play className={`${isMobile ? 'w-8 h-8 ml-1' : 'w-6 h-6 ml-1'}`} />
                  )}
                </button>

                <div className="text-center">
                  <p className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
                    Recording completed
                  </p>
                  <p className={`${isMobile ? 'text-xl' : 'text-lg'} font-mono text-green-600`}>
                    {formatDuration(duration)}
                  </p>
                </div>

                <button
                  onClick={clearRecording}
                  className={`px-4 py-2 ${isMobile ? 'text-base' : 'text-sm'} bg-gray-500 hover:bg-gray-600 text-white rounded-md`}
                >
                  Clear
                </button>
              </div>

              <audio
                ref={audioRef}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </>
          )}
        </div>
      </div>

      {/* Images Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className={`${isMobile ? 'text-lg' : 'text-base'} font-medium text-gray-900 mb-4`}>
          Photos (Optional)
        </h3>

        <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3'} gap-3 mb-4`}>
          {/* Camera button */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Camera className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-gray-400 mb-2`} />
            <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>Camera</span>
          </button>

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Upload className={`${isMobile ? 'w-8 h-8' : 'w-6 h-6'} text-gray-400 mb-2`} />
            <span className={`${isMobile ? 'text-sm' : 'text-xs'} text-gray-600`}>Upload</span>
          </button>

          {/* Image previews */}
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square">
              <Image
                src={image.preview}
                alt="Preview"
                className="w-full h-full object-cover rounded-lg border"
                layout="fill"
                objectFit="cover"
              />
              <button
                onClick={() => removeImage(image.id)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

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

      {/* Submit Section */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={`w-full flex items-center justify-center space-x-2 py-4 px-4 rounded-md text-white font-medium transition-colors ${
            canSubmit
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Submitting...</span>
            </>
          ) : submitStatus === 'success' ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Submitted!</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Submit Consultation</span>
            </>
          )}
        </button>

        {/* Status messages */}
        {message && (
          <div className={`mt-4 p-3 rounded-md ${
            submitStatus === 'success'
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-start space-x-2">
              {submitStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              )}
              <p className={`text-sm ${
                submitStatus === 'success' ? 'text-green-700' : 'text-red-700'
              }`}>
                {message}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
    </div>
  )
}
