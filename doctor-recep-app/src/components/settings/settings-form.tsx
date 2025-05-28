'use client'

import { useState } from 'react'
import { Save, RotateCcw, FileText, Globe, List } from 'lucide-react'
import { updateDoctorSettings } from '@/lib/actions/settings'
import type { TemplateConfig } from '@/lib/types'

interface SettingsFormProps {
  doctorId: string
  currentConfig: TemplateConfig
  doctorName: string
  doctorEmail: string
}

export function SettingsForm({ doctorId, currentConfig, doctorName, doctorEmail }: SettingsFormProps) {
  const [config, setConfig] = useState<TemplateConfig>({
    language: currentConfig.language || 'english',
    tone: currentConfig.tone || 'professional',
    prescription_format: currentConfig.prescription_format || 'standard',
    sections: currentConfig.sections || [
      'Chief Complaint',
      'History',
      'Examination',
      'Diagnosis',
      'Treatment Plan',
      'Follow-up'
    ]
  })

  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const languageOptions = [
    { value: 'english', label: 'English' },
    { value: 'hindi', label: 'Hindi' },
    { value: 'tamil', label: 'Tamil' },
    { value: 'telugu', label: 'Telugu' },
    { value: 'bengali', label: 'Bengali' },
  ]

  const toneOptions = [
    { value: 'professional', label: 'Professional' },
    { value: 'friendly', label: 'Friendly' },
    { value: 'formal', label: 'Formal' },
  ]

  const formatOptions = [
    { value: 'standard', label: 'Standard' },
    { value: 'detailed', label: 'Detailed' },
    { value: 'minimal', label: 'Minimal' },
  ]

  const defaultSections = [
    'Chief Complaint',
    'History of Present Illness',
    'Past Medical History',
    'Physical Examination',
    'Assessment/Diagnosis',
    'Treatment Plan',
    'Medications',
    'Follow-up Instructions',
    'Patient Education',
    'Vital Signs'
  ]

  const handleSectionToggle = (section: string) => {
    setConfig(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section]
    }))
  }

  const handleSave = async () => {
    setIsLoading(true)
    setMessage('')

    try {
      // Dynamically import to avoid unused import lint error
      const { templateConfigToJson } = await import('@/lib/types')
      const result = await updateDoctorSettings(doctorId, templateConfigToJson(config))

      if (result.success) {
        setMessageType('success')
        setMessage('Settings saved successfully!')
      } else {
        setMessageType('error')
        setMessage(result.error || 'Failed to save settings')
      }
    } catch {
      setMessageType('error')
      setMessage('An unexpected error occurred')
    } finally {
      setIsLoading(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleReset = () => {
    setConfig({
      language: 'english',
      tone: 'professional',
      prescription_format: 'standard',
      sections: [
        'Chief Complaint',
        'History',
        'Examination',
        'Diagnosis',
        'Treatment Plan',
        'Follow-up'
      ]
    })
  }

  return (
    <div className="space-y-8">
      {/* Doctor Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Doctor Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Name:</span>
            <span className="ml-2 text-gray-900">{doctorName}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Email:</span>
            <span className="ml-2 text-gray-900">{doctorEmail}</span>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-medium text-gray-900">Language Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Summary Language
            </label>
            <select
              value={config.language}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as TemplateConfig['language'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Writing Tone
            </label>
            <select
              value={config.tone}
              onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value as TemplateConfig['tone'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Format Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5 text-green-500" />
          <h3 className="text-lg font-medium text-gray-900">Summary Format</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prescription Format
          </label>
          <select
            value={config.prescription_format}
            onChange={(e) => setConfig(prev => ({ ...prev, prescription_format: e.target.value as TemplateConfig['prescription_format'] }))}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            {formatOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-purple-500" />
          <h3 className="text-lg font-medium text-gray-900">Summary Sections</h3>
        </div>

        <p className="text-sm text-gray-600">
          Select which sections to include in your consultation summaries:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {defaultSections.map(section => (
            <label key={section} className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={config.sections.includes(section)}
                onChange={() => handleSectionToggle(section)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{section}</span>
            </label>
          ))}
        </div>

        <div className="text-sm text-gray-500">
          Selected: {config.sections.length} sections
        </div>
      </div>

      {/* Status Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          messageType === 'success'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            messageType === 'success' ? 'text-green-700' : 'text-red-700'
          }`}>
            {message}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  )
}
