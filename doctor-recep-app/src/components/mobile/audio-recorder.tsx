'use client'

import { useState, useRef, useEffect } from 'react'
import { Mic, Square, Play, Pause } from 'lucide-react'
import { AudioRecordingState } from '@/lib/types'
import { formatDuration, supportsAudioRecording } from '@/lib/utils'
import { validateFile } from '@/lib/storage'

interface AudioRecorderProps {
  audioState: AudioRecordingState
  onStateChange: (newState: Partial<AudioRecordingState>) => void
}

export function AudioRecorder({ audioState, onStateChange }: AudioRecorderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number>(0)

  useEffect(() => {
    // Check if audio recording is supported
    if (!supportsAudioRecording()) {
      onStateChange({ error: 'Audio recording is not supported on this device' })
    }

    return () => {
      // Cleanup on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [onStateChange])

  const startRecording = async () => {
    try {
      onStateChange({ error: undefined })

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      })

      streamRef.current = stream

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })

      mediaRecorderRef.current = mediaRecorder

      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })

        // Convert blob to File object for upload
        const audioFile = new File([audioBlob], `recording_${Date.now()}.webm`, {
          type: 'audio/webm'
        })

        // Validate the audio file
        const validation = validateFile(audioFile, 'audio')
        if (!validation.valid) {
          onStateChange({
            error: validation.error,
            isRecording: false,
          })
          return
        }

        onStateChange({
          audioBlob,
          audioFile,
          isRecording: false,
        })

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      startTimeRef.current = Date.now()

      onStateChange({
        isRecording: true,
        duration: 0,
      })

      // Start duration timer
      intervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000)
        onStateChange({ duration: elapsed })
      }, 1000)

    } catch (error) {
      console.error('Error starting recording:', error)
      onStateChange({
        error: 'Failed to start recording. Please check microphone permissions.',
        isRecording: false,
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && audioState.isRecording) {
      mediaRecorderRef.current.stop()

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }

  const playAudio = () => {
    if (audioState.audioBlob && audioRef.current) {
      const audioUrl = URL.createObjectURL(audioState.audioBlob)
      audioRef.current.src = audioUrl
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const clearRecording = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setIsPlaying(false)
    onStateChange({
      audioBlob: undefined,
      duration: 0,
      error: undefined,
    })
  }

  return (
    <div className="space-y-4">
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4">
        {!audioState.audioBlob ? (
          // Recording interface
          <div className="flex flex-col items-center space-y-4">
            <button
              onClick={audioState.isRecording ? stopRecording : startRecording}
              disabled={!!audioState.error}
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white transition-all duration-200 ${
                audioState.isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {audioState.isRecording ? (
                <Square className="w-8 h-8" />
              ) : (
                <Mic className="w-8 h-8" />
              )}
            </button>

            <div className="text-center">
              <p className="text-sm font-medium text-gray-700">
                {audioState.isRecording ? 'Recording...' : 'Tap to start recording'}
              </p>
              {audioState.isRecording && (
                <p className="text-lg font-mono text-red-600">
                  {formatDuration(audioState.duration)}
                </p>
              )}
            </div>
          </div>
        ) : (
          // Playback interface
          <div className="flex flex-col items-center space-y-4 w-full">
            <div className="flex items-center space-x-4">
              <button
                onClick={isPlaying ? pauseAudio : playAudio}
                className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6" />
                ) : (
                  <Play className="w-6 h-6 ml-1" />
                )}
              </button>

              <div className="flex-1 text-center">
                <p className="text-sm font-medium text-gray-700">
                  Recording completed
                </p>
                <p className="text-lg font-mono text-green-600">
                  {formatDuration(audioState.duration)}
                </p>
              </div>

              <button
                onClick={clearRecording}
                className="px-4 py-2 text-sm bg-gray-500 hover:bg-gray-600 text-white rounded-md"
              >
                Clear
              </button>
            </div>

            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Error Display */}
      {audioState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{audioState.error}</p>
        </div>
      )}

      {/* Recording Tips */}
      {!audioState.audioBlob && !audioState.isRecording && (
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recording Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Speak clearly and at normal volume</li>
            <li>• Minimize background noise</li>
            <li>• Hold device 6-12 inches from your mouth</li>
            <li>• Include patient symptoms, diagnosis, and treatment</li>
          </ul>
        </div>
      )}
    </div>
  )
}
