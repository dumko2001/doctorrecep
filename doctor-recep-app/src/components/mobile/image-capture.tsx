'use client'

import { useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { ImageCaptureState, ImageFile } from '@/lib/types'
// import { fileToBase64, supportsCamera } from '@/lib/utils' // <--- REMOVE fileToBase64
import { supportsCamera } from '@/lib/utils' // <--- KEEP supportsCamera
import Image from 'next/image'

interface ImageCaptureProps {
  imageState: ImageCaptureState
  onStateChange: (newState: Partial<ImageCaptureState>) => void
  isMobile?: boolean // Keep if used, otherwise remove
}

export function ImageCapture({ imageState, onStateChange, isMobile: _isMobile }: ImageCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    try {
      onStateChange({ error: undefined })

      const newImages: ImageFile[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file type
        if (!file.type.startsWith('image/')) {
          onStateChange({ error: `File ${file.name} is not a valid image` })
          return
        }

        // Validate file size (max 10MB per file)
        if (file.size > 10 * 1024 * 1024) {
          onStateChange({ error: `File ${file.name} is too large. Please select files under 10MB.` })
          return
        }

        // const imageBase64 = await fileToBase64(file) // <--- REMOVE THIS LINE
        const preview = URL.createObjectURL(file)

        newImages.push({
          id: `${Date.now()}-${i}`,
          file: file, // <--- IMPORTANT CHANGE: Store the raw File object
          // base64: imageBase64, // <--- REMOVE THIS LINE
          preview: preview,
          name: file.name,
          type: file.type, // Store type
          size: file.size // Store size
        })
      }

      onStateChange({
        images: [...imageState.images, ...newImages]
      })
    } catch (error) {
      console.error('Error processing images:', error)
      onStateChange({ error: 'Failed to process images. Please try again.' })
    }
  }


  const handleCameraCapture = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const removeImage = (imageId: string) => {
    const imageToRemove = imageState.images.find(img => img.id === imageId)
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview)
    }

    onStateChange({
      images: imageState.images.filter(img => img.id !== imageId),
      error: undefined,
    })
  }

  const clearAllImages = () => {
    imageState.images.forEach(img => {
      URL.revokeObjectURL(img.preview)
    })

    onStateChange({
      images: [],
      error: undefined,
    })

    // Reset file inputs
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const openCamera = () => {
    cameraInputRef.current?.click()
  }

  const openFileSelector = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload Controls */}
      <div className="grid grid-cols-1 gap-3">
        {/* Camera Capture */}
        {supportsCamera() && (
          <button
            onClick={openCamera}
            className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
          >
            <Camera className="w-6 h-6 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">
              Take Photo
            </span>
          </button>
        )}

        {/* File Upload */}
        <button
          onClick={openFileSelector}
          className="flex items-center justify-center space-x-3 p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-6 h-6 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">
            Upload from Gallery
          </span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Images Preview */}
      {imageState.images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Images ({imageState.images.length})
            </h4>
            <button
              onClick={clearAllImages}
              className="text-xs text-red-600 hover:text-red-800 underline"
            >
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {imageState.images.map((image) => (
              <div key={image.id} className="relative">
                <Image
                  src={image.preview}
                  alt={image.name}
                  className="w-full h-32 object-cover rounded-lg border"
                  width={500}
                  height={500}
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white text-xs p-1 rounded truncate">
                  {image.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Display */}
      {imageState.error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-700">{imageState.error}</p>
        </div>
      )}
    </div>
  )
}
