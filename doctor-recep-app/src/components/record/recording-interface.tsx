'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Camera, Upload, Send, CheckCircle, AlertCircle, Play, Pause, X } from 'lucide-react'
import { createConsultationWithFiles, getConsultations, addAdditionalAudio } from '@/lib/actions/consultations'
import type { Consultation } from '@/lib/types'
import Image from 'next/image'

export function RecordingInterface() {
  const [isMobile, setIsMobile] = useState(false)

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

  // Pending consultations state
  const [pendingConsultations, setPendingConsultations] = useState<Consultation[]>([])
  const [loadingPending, setLoadingPending] = useState(false)
  const [selectedConsultationId, setSelectedConsultationId] = useState<string | null>(null)
  const [addAudioState, setAddAudioState] = useState<{ audioBlob: Blob | null, audioFile: File | null, isRecording: boolean, isSubmitting: boolean, error: string }>({ audioBlob: null, audioFile: null, isRecording: false, isSubmitting: false, error: '' })

  // Audio playback state
  const [playingAudio, setPlayingAudio] = useState<{ url: string, audio: HTMLAudioElement } | null>(null)

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  
  // Additional refs for add audio functionality
  const addAudioRecorderRef = useRef<MediaRecorder | null>(null)
  const addAudioStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    // Detect if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
      images.forEach(img => URL.revokeObjectURL(img.preview))
    }
  }, [images])

  // Defer pending consultations fetch to improve initial load time
  const fetchPendingConsultations = () => {
    setLoadingPending(true)
    getConsultations('pending').then(res => {
      if (res.success && res.data) setPendingConsultations(res.data)
      setLoadingPending(false)
    })
  }

  useEffect(() => {
    // Defer pending consultations fetch by 500ms to improve perceived performance
    const timer = setTimeout(fetchPendingConsultations, 500)
    return () => clearTimeout(timer)
  }, [])



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
        }
      })

      streamRef.current = stream

      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
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
        const file = new File([blob], `recording_${Date.now()}.webm`, {
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
      const newImages: Array<{ id: string, file: File, preview: string }> = []

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

  // Start recording for additional audio
  const handleRecordAddAudio = async () => {
    setAddAudioState(s => ({ ...s, error: '' }))
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Audio recording not supported')
      
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        }
      })
      
      addAudioStreamRef.current = stream

      // Try different MIME types for better compatibility
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg'
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      addAudioRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data) }
      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunks, { type: mimeType })
        const file = new File([blob], `additional_audio_${Date.now()}.webm`, {
          type: mimeType
        })
        setAddAudioState(s => ({ ...s, audioBlob: blob, audioFile: file, isRecording: false }))
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setAddAudioState(s => ({ ...s, isRecording: true }))
    } catch (e: unknown) {
      setAddAudioState(s => ({ ...s, error: (e as Error).message, isRecording: false }))
    }
  }

  // Stop recording for additional audio
  const handleStopAddAudio = () => {
    if (addAudioRecorderRef.current && addAudioState.isRecording) {
      addAudioRecorderRef.current.stop()
    }
  }

  // Submit additional audio
  const handleSubmitAddAudio = async () => {
    if (!selectedConsultationId || !addAudioState.audioFile) return
    setAddAudioState(s => ({ ...s, isSubmitting: true, error: '' }))
    const res = await addAdditionalAudio(selectedConsultationId, addAudioState.audioFile)
    if (res.success) {
      setAddAudioState(s => ({ ...s, isSubmitting: false, audioBlob: null, audioFile: null }))
      setSelectedConsultationId(null)
      // Refresh pending list
      setLoadingPending(true)
      getConsultations('pending').then(r => {
        if (r.success && r.data) setPendingConsultations(r.data)
        setLoadingPending(false)
      })
    } else {
      setAddAudioState(s => ({ ...s, isSubmitting: false, error: res.error || 'Failed to add audio' }))
    }
  }

  // Helper to play audio from URL with proper state management
  const playAudioFromUrl = (url: string) => {
    // Stop any currently playing audio
    if (playingAudio) {
      playingAudio.audio.pause()
      playingAudio.audio.currentTime = 0
      if (playingAudio.url === url) {
        setPlayingAudio(null)
        return
      }
    }

    // Create new audio and play
    const audio = new Audio(url)
    audio.addEventListener('ended', () => setPlayingAudio(null))
    audio.addEventListener('error', () => setPlayingAudio(null))
    
    setPlayingAudio({ url, audio })
    audio.play().catch(() => {
      setPlayingAudio(null)
      setError('Failed to play audio')
    })
  }

  // Helper to check if audio is currently playing
  const isAudioPlaying = (url: string) => {
    return playingAudio?.url === url
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
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200/50 p-6">
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
                  className={`${isMobile ? 'w-16 h-16' : 'w-12 h-12'} rounded-full bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white flex items-center justify-center shadow-lg`}
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
                  className={`px-4 py-2 ${isMobile ? 'text-base' : 'text-sm'} bg-slate-500 hover:bg-slate-600 text-white rounded-md shadow-md`}
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
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200/50 p-6">
        <h3 className={`${isMobile ? 'text-lg' : 'text-base'} font-medium text-slate-800 mb-4`}>
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
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg"
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
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200/50 p-6">
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

      {/* Pending Consultations Section */}
      <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200/50 p-6">
        <h3 className="text-lg font-medium text-slate-800 mb-4">Pending Consultations</h3>
        {loadingPending ? (
          <div className="text-gray-500">Loading...</div>
        ) : pendingConsultations.length === 0 ? (
          <div className="text-gray-500">No pending consultations.</div>
        ) : (
          <div className="space-y-6">
            {pendingConsultations.map(consultation => (
              <div key={consultation.id} className="border rounded p-4 mb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-semibold">Patient #{consultation.patient_number}</span>
                    <span className="ml-2 text-xs text-gray-500">{new Date(consultation.created_at).toLocaleString()}</span>
                  </div>
                  <button 
                    className="px-2 py-1 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-600 hover:to-emerald-700 text-white text-xs rounded-md shadow-sm transition-all duration-150 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:transform-none" 
                    onClick={() => setSelectedConsultationId(consultation.id)} 
                    disabled={selectedConsultationId === consultation.id}
                  >
                    Add Audio
                  </button>
                </div>
                <div className="mt-2">
                  <span className="font-medium text-sm">Audios:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <button 
                      className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all duration-150 ${
                        isAudioPlaying(consultation.primary_audio_url) 
                          ? 'bg-green-500 text-white' 
                          : 'bg-gray-200 hover:bg-gray-300'
                      }`} 
                      onClick={() => playAudioFromUrl(consultation.primary_audio_url)}
                    >
                      {isAudioPlaying(consultation.primary_audio_url) ? 
                        <Pause className="w-3 h-3" /> : 
                        <Play className="w-3 h-3" />
                      }
                      <span>Main Audio</span>
                    </button>
                    {Array.isArray(consultation.additional_audio_urls) &&
                      consultation.additional_audio_urls
                        .filter((url): url is string => typeof url === 'string')
                        .map((url, i) => (
                          <button 
                            key={i} 
                            className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-all duration-150 ${
                              isAudioPlaying(url) 
                                ? 'bg-green-500 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`} 
                            onClick={() => playAudioFromUrl(url)}
                          >
                            {isAudioPlaying(url) ? 
                              <Pause className="w-3 h-3" /> : 
                              <Play className="w-3 h-3" />
                            }
                            <span>Additional {i + 1}</span>
                          </button>
                        ))}
                  </div>
                </div>
                {/* Add Audio UI */}
                {selectedConsultationId === consultation.id && (
                  <div className="mt-4 border-t pt-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                      {!addAudioState.isRecording ? (
                        <button 
                          className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white rounded text-xs shadow-md transition-all duration-150 w-full sm:w-auto justify-center" 
                          onClick={handleRecordAddAudio} 
                          disabled={addAudioState.isSubmitting}
                        >
                          <Mic className="w-3 h-3" />
                          <span>Record</span>
                        </button>
                      ) : (
                        <button 
                          className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded text-xs shadow-md transition-all duration-150 w-full sm:w-auto justify-center" 
                          onClick={handleStopAddAudio}
                        >
                          <Square className="w-3 h-3" />
                          <span>Stop</span>
                        </button>
                      )}
                      {addAudioState.isRecording && (
                        <div className="flex items-center space-x-1 text-red-600">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs">Recording...</span>
                        </div>
                      )}
                    </div>
                    {addAudioState.audioBlob && (
                      <div className="mt-2 p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="mb-2">
                          <audio controls src={URL.createObjectURL(addAudioState.audioBlob)} className="w-full h-8" />
                        </div>
                        <div className="flex flex-col sm:flex-row gap-1">
                          <button 
                            className="flex items-center space-x-1 px-2 py-1 bg-gradient-to-r from-emerald-600 to-green-700 hover:from-emerald-700 hover:to-green-800 text-white rounded text-xs shadow-md transition-all duration-150 flex-1 justify-center" 
                            onClick={handleSubmitAddAudio} 
                            disabled={addAudioState.isSubmitting}
                          >
                            <Send className="w-3 h-3" />
                            <span>{addAudioState.isSubmitting ? 'Submitting...' : 'Submit'}</span>
                          </button>
                          <button 
                            className="flex items-center space-x-1 px-2 py-1 bg-orange-200 hover:bg-orange-300 text-slate-700 rounded text-xs shadow-sm transition-all duration-150 flex-1 justify-center" 
                            onClick={() => {
                              setSelectedConsultationId(null)
                              setAddAudioState({ audioBlob: null, audioFile: null, isRecording: false, isSubmitting: false, error: '' })
                            }}
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        </div>
                      </div>
                    )}
                    {addAudioState.error && <div className="text-red-500 text-xs mt-2">{addAudioState.error}</div>}
                  </div>
                )}
              </div>
            ))}
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
