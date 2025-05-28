'use client'

import { useRef } from 'react'
import { Camera, Upload, X } from 'lucide-react'
import { ImageCaptureState, ImageFile } from '@/lib/types'
import { supportsCamera } from '@/lib/utils'
import { validateFile, calculateTotalFileSize, STORAGE_CONFIG } from '@/lib/storage'
import Image from 'next/image'

interface ImageCaptureProps {
  imageState: ImageCaptureState
  onStateChange: (newState: Partial<ImageCaptureState>) => void
  isMobile?: boolean // Keep if used, otherwise remove
}

export function ImageCapture({ imageState, onStateChange, isMobile }: ImageCaptureProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    try {
      onStateChange({ error: undefined })

      const newImages: ImageFile[] = []
      const allFiles = [...imageState.images.map(img => img.file), ...Array.from(files)]

      // Validate total file size
      const totalSize = calculateTotalFileSize(allFiles)
      if (totalSize > STORAGE_CONFIG.MAX_TOTAL_SIZE) {
        onStateChange({
          error: `Total file size exceeds ${STORAGE_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024}MB limit`
        })
        return
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate individual file
        const validation = validateFile(file, 'image')
        if (!validation.valid) {
          onStateChange({ error: `${file.name}: ${validation.error}` })
          return
        }

        const preview = URL.createObjectURL(file)

        newImages.push({
          id: `${Date.now()}-${i}`,
          file: file,
          preview: preview,
          name: file.name,
          type: file.type,
          size: file.size
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
      {/* Upload Controls - Smaller and Sleeker */}
      <div className="flex gap-2">
        {/* Camera Capture - Compact */}
        {supportsCamera() && (
          <button
            onClick={openCamera}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-md transition-colors text-sm"
          >
            <Camera className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 font-medium">Camera</span>
          </button>
        )}

        {/* File Upload - Compact */}
        <button
          onClick={openFileSelector}
          className="flex items-center space-x-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-md transition-colors text-sm"
        >
          <Upload className="w-4 h-4 text-gray-600" />
          <span className="text-gray-700 font-medium">Upload</span>
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
            <h4 className={`${isMobile ? 'text-base' : 'text-sm'} font-medium text-gray-700`}>
              Uploaded Images ({imageState.images.length})
            </h4>
            <button
              onClick={clearAllImages}
              className={`${isMobile ? 'text-sm' : 'text-xs'} text-red-600 hover:text-red-800 underline`}
            >
              Clear All
            </button>
          </div>

          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-3 lg:grid-cols-4'} gap-3`}>
            {imageState.images.map((image) => (
              <div key={image.id} className="relative group">
                <Image
                  src={image.preview}
                  alt={image.name}
                  className={`w-full ${isMobile ? 'h-32' : 'h-24'} object-cover rounded-lg border hover:shadow-md transition-shadow`}
                  width={isMobile ? 256 : 384}
                  height={isMobile ? 256 : 192}
                />
                <button
                  onClick={() => removeImage(image.id)}
                  className={`absolute top-1 right-1 ${isMobile ? 'w-7 h-7' : 'w-6 h-6'} bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}
                >
                  <X className={`${isMobile ? 'w-4 h-4' : 'w-3 h-3'}`} />
                </button>
                <div className={`absolute bottom-1 left-1 right-1 bg-black bg-opacity-50 text-white ${isMobile ? 'text-xs' : 'text-xs'} p-1 rounded truncate`}>
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

      {/* Instructions */}
      {imageState.images.length === 0 && (
        <div className="bg-gray-50 rounded-md p-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Photo Tips:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Ensure good lighting for clear text</li>
            <li>• Keep the camera steady</li>
            <li>• Capture the entire note/prescription</li>
            <li>• Avoid shadows and glare</li>
            <li>• You can upload multiple images</li>
          </ul>
        </div>
      )}
    </div>
  )
}
