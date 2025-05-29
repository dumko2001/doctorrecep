'use client'

import { useState } from 'react'
import { Save, RotateCcw, FileText, Globe, List, Lock } from 'lucide-react'
import { updateDoctorSettings } from '@/lib/actions/settings'
import { PasswordChangeModal } from './password-change-modal'
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
  const [showPasswordModal, setShowPasswordModal] = useState(false)

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
      {/* Doctor Info & Security */}
      <div className="bg-orange-50 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
          <h3 className="text-lg font-medium text-slate-800 mb-2 sm:mb-0">Doctor Information</h3>
          <button
            onClick={() => setShowPasswordModal(true)}
            className="flex items-center space-x-2 px-4 py-2 border border-orange-300 hover:border-teal-400 text-sm font-medium rounded-md text-slate-700 bg-white/70 hover:bg-orange-50 transition-all duration-150 transform hover:scale-105 active:scale-95 w-fit"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-slate-600">Name:</span>
            <span className="ml-2 text-slate-800">{doctorName}</span>
          </div>
          <div>
            <span className="font-medium text-slate-600">Email:</span>
            <span className="ml-2 text-slate-800">{doctorEmail}</span>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-medium text-slate-800">Language Preferences</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Summary Language
            </label>
            <select
              value={config.language}
              onChange={(e) => setConfig(prev => ({ ...prev, language: e.target.value as TemplateConfig['language'] }))}
              className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800 transition-all duration-150 hover:border-teal-400 focus:scale-105"
            >
              {languageOptions.map(option => (
                <option key={option.value} value={option.value} className="text-slate-800">
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Writing Tone
            </label>
            <select
              value={config.tone}
              onChange={(e) => setConfig(prev => ({ ...prev, tone: e.target.value as TemplateConfig['tone'] }))}
              className="w-full px-3 py-2 border border-orange-300 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800 transition-all duration-150 hover:border-teal-400 focus:scale-105"
            >
              {toneOptions.map(option => (
                <option key={option.value} value={option.value} className="text-slate-800">
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
          <FileText className="w-5 h-5 text-teal-500" />
          <h3 className="text-lg font-medium text-slate-800">Summary Format</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Prescription Format
          </label>
          <select
            value={config.prescription_format}
            onChange={(e) => setConfig(prev => ({ ...prev, prescription_format: e.target.value as TemplateConfig['prescription_format'] }))}
            className="w-full max-w-md px-3 py-2 border border-orange-300 rounded-md focus:ring-teal-500 focus:border-teal-500 bg-white text-slate-800 transition-all duration-150 hover:border-teal-400 focus:scale-105"
          >
            {formatOptions.map(option => (
              <option key={option.value} value={option.value} className="text-slate-800">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Sections Settings */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <List className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-medium text-slate-800">Summary Sections</h3>
        </div>

        <p className="text-sm text-slate-600">
          Select which sections to include in your consultation summaries:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {defaultSections.map(section => (
            <label key={section} className="flex items-center space-x-2 cursor-pointer transition-all duration-150 hover:bg-orange-50 p-2 rounded">
              <input
                type="checkbox"
                checked={config.sections.includes(section)}
                onChange={() => handleSectionToggle(section)}
                className="rounded border-orange-300 text-orange-600 focus:ring-orange-500 transition-all duration-150 focus:scale-110"
              />
              <span className="text-sm text-slate-700">{section}</span>
            </label>
          ))}
        </div>

        <div className="text-sm text-slate-500">
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
      <div className="flex items-center justify-between pt-6 border-t border-orange-200">
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2 border border-orange-300 hover:border-teal-400 text-sm font-medium rounded-md text-slate-700 bg-white/70 hover:bg-orange-50 transition-all duration-150 transform hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset to Defaults</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-300 transition-all duration-150 transform hover:scale-105 active:scale-95 disabled:transform-none"
        >
          <Save className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        doctorId={doctorId}
      />

    </div>
  )
}
