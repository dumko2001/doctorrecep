'use client'

import { useState } from 'react'
import { Check, X, Edit, RotateCcw, Ban, CheckCircle, Clock, AlertTriangle, FileText } from 'lucide-react'
import { DoctorWithStats } from '@/lib/types'
import { performAdminAction, resetDoctorQuota, updateDoctorTemplate } from '@/lib/actions/admin'
import { formatDate } from '@/lib/utils'
import { templateConfigToJson } from '@/lib/types'

interface DoctorsTableProps {
  doctors: DoctorWithStats[]
}

export function DoctorsTable({ doctors }: DoctorsTableProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleAction = async (
    action: 'approve' | 'reject' | 'update_quota' | 'disable' | 'enable',
    doctorId: string,
    data?: { quota?: number; reason?: string }
  ) => {
    setLoading(doctorId)
    setMessage(null)

    try {
      const result = await performAdminAction({
        action,
        doctor_id: doctorId,
        data: {
          quota: data?.quota !== undefined ? data.quota : 0,
          ...(data?.reason !== undefined ? { reason: data.reason } : {})
        },
      })

      if (result.success) {
        setMessage({ type: 'success', text: `Action completed successfully` })
        // Refresh the page to show updated data
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.error || 'Action failed' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleQuotaReset = async (doctorId: string) => {
    setLoading(doctorId)
    setMessage(null)

    try {
      const result = await resetDoctorQuota(doctorId)

      if (result.success) {
        setMessage({ type: 'success', text: 'Quota reset successfully' })
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reset quota' })
      }
    } catch {
      setMessage({ type: 'error', text: 'An unexpected error occurred' })
    } finally {
      setLoading(null)
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleQuotaUpdate = async (doctorId: string) => {
    const newQuota = prompt('Enter new monthly quota:')
    if (!newQuota || isNaN(Number(newQuota))) return

    if (confirm(`Are you sure you want to update the monthly quota to ${newQuota}?`)) {
      await handleAction('update_quota', doctorId, { quota: Number(newQuota) })
    }
  }

  const handleRejectDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to reject this doctor? This action will permanently delete their account.')) {
      await handleAction('reject', doctorId)
    }
  }

  const handleDisableDoctor = async (doctorId: string) => {
    if (confirm('Are you sure you want to disable this doctor? They will not be able to log in until re-enabled.')) {
      await handleAction('disable', doctorId)
    }
  }

  const handleQuotaResetConfirm = async (doctorId: string) => {
    if (confirm('Are you sure you want to reset this doctor\'s quota usage to zero?')) {
      await handleQuotaReset(doctorId)
    }
  }

  const handleTemplateEdit = (doctor: DoctorWithStats) => {
    // Create dialog HTML
    const dialogHTML = `
      <div id="template-dialog" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center;">
        <div style="background: white; padding: 24px; border-radius: 8px; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto;">
          <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">Edit Template for Dr. ${doctor.name}</h3>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Language:</label>
            <select id="template-language" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
              <option value="english" ${doctor.template_config.language === 'english' ? 'selected' : ''}>English</option>
              <option value="hindi" ${doctor.template_config.language === 'hindi' ? 'selected' : ''}>Hindi</option>
              <option value="tamil" ${doctor.template_config.language === 'tamil' ? 'selected' : ''}>Tamil</option>
              <option value="telugu" ${doctor.template_config.language === 'telugu' ? 'selected' : ''}>Telugu</option>
              <option value="bengali" ${doctor.template_config.language === 'bengali' ? 'selected' : ''}>Bengali</option>
            </select>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Tone:</label>
            <select id="template-tone" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
              <option value="professional" ${doctor.template_config.tone === 'professional' ? 'selected' : ''}>Professional</option>
              <option value="friendly" ${doctor.template_config.tone === 'friendly' ? 'selected' : ''}>Friendly</option>
              <option value="formal" ${doctor.template_config.tone === 'formal' ? 'selected' : ''}>Formal</option>
            </select>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">Prescription Format:</label>
            <select id="template-format" style="width: 100%; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
              <option value="standard" ${doctor.template_config.prescription_format === 'standard' ? 'selected' : ''}>Standard</option>
              <option value="detailed" ${doctor.template_config.prescription_format === 'detailed' ? 'selected' : ''}>Detailed</option>
              <option value="minimal" ${doctor.template_config.prescription_format === 'minimal' ? 'selected' : ''}>Minimal</option>
            </select>
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 8px; font-weight: 500;">Summary Sections:</label>
            <div style="max-height: 150px; overflow-y: auto; border: 1px solid #ccc; padding: 8px; border-radius: 4px;">
              ${['Chief Complaint', 'History of Present Illness', 'Past Medical History', 'Physical Examination', 'Assessment/Diagnosis', 'Treatment Plan', 'Medications', 'Follow-up Instructions', 'Patient Education', 'Vital Signs'].map(section => `
                <label style="display: block; margin-bottom: 4px; font-size: 14px;">
                  <input type="checkbox" value="${section}" ${doctor.template_config.sections?.includes(section) ? 'checked' : ''} style="margin-right: 8px;">
                  ${section}
                </label>
              `).join('')}
            </div>
          </div>
          
          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 24px;">
            <button id="template-cancel" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancel</button>
            <button id="template-save" style="padding: 8px 16px; border: none; background: #3b82f6; color: white; border-radius: 4px; cursor: pointer;">Save</button>
          </div>
        </div>
      </div>
    `
    
    // Add dialog to DOM
    document.body.insertAdjacentHTML('beforeend', dialogHTML)
    
    // Add event listeners
    const dialog = document.getElementById('template-dialog')!
    const cancelBtn = document.getElementById('template-cancel')!
    const saveBtn = document.getElementById('template-save')!
    
    const closeDialog = () => {
      dialog.remove()
    }
    
    cancelBtn.onclick = closeDialog
    dialog.onclick = (e) => {
      if (e.target === dialog) closeDialog()
    }
    
    saveBtn.onclick = async () => {
      const language = (document.getElementById('template-language') as HTMLSelectElement).value
      const tone = (document.getElementById('template-tone') as HTMLSelectElement).value
      const format = (document.getElementById('template-format') as HTMLSelectElement).value
      const sections = Array.from(document.querySelectorAll('#template-dialog input[type="checkbox"]:checked')).map(cb => (cb as HTMLInputElement).value)
      
      closeDialog()
      setLoading(doctor.id)
      setMessage(null)

      try {
        const updatedConfig = {
          ...doctor.template_config,
          language,
          tone,
          prescription_format: format,
          sections
        }

        const result = await updateDoctorTemplate(doctor.id, templateConfigToJson(updatedConfig))

        if (result.success) {
          setMessage({ type: 'success', text: 'Template updated successfully' })
          window.location.reload()
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to update template' })
        }
      } catch {
        setMessage({ type: 'error', text: 'An unexpected error occurred' })
      } finally {
        setLoading(null)
        setTimeout(() => setMessage(null), 3000)
      }
    }
  }

  const getStatusBadge = (doctor: DoctorWithStats) => {
    if (!doctor.approved) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Approved
      </span>
    )
  }

  const getQuotaBadge = (doctor: DoctorWithStats) => {
    if (doctor.quota_percentage >= 90) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          {doctor.quota_percentage}%
        </span>
      )
    } else if (doctor.quota_percentage >= 70) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          {doctor.quota_percentage}%
        </span>
      )
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        {doctor.quota_percentage}%
      </span>
    )
  }

  return (
    <div className="overflow-hidden">
      {message && (
        <div className={`p-4 mb-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Doctor
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quota
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                Activity
              </th>
              <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="hover:bg-gray-50">
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {doctor.name}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-500 break-all">
                      {doctor.email}
                    </div>
                    {doctor.clinic_name ? (
                      <div className="text-xs text-gray-400 hidden sm:block">{doctor.clinic_name}</div>
                    ) : null}
                    {doctor.phone ? (
                      <div className="text-xs text-gray-400 hidden sm:block">{doctor.phone}</div>
                    ) : null}
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(doctor)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <div className="text-xs sm:text-sm text-gray-900">
                    {doctor.quota_used} / {doctor.monthly_quota}
                  </div>
                  {getQuotaBadge(doctor)}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                  <div>
                    {doctor.total_consultations} consultations
                  </div>
                  <div>
                    {doctor.this_month_generations} AI generations
                  </div>
                  {doctor.last_activity && (
                    <div className="text-xs">
                      Last: {formatDate(doctor.last_activity)}
                    </div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    {!doctor.approved ? (
                      <>
                        <button
                          onClick={() => handleAction('approve', doctor.id)}
                          disabled={loading === doctor.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Approve Doctor"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRejectDoctor(doctor.id)}
                          disabled={loading === doctor.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Reject Doctor"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleQuotaUpdate(doctor.id)}
                          disabled={loading === doctor.id}
                          className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          title="Update Quota"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuotaResetConfirm(doctor.id)}
                          disabled={loading === doctor.id}
                          className="text-purple-600 hover:text-purple-900 disabled:opacity-50"
                          title="Reset Quota"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleTemplateEdit(doctor)}
                          disabled={loading === doctor.id}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Edit Template"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDisableDoctor(doctor.id)}
                          disabled={loading === doctor.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Disable Doctor"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {doctors.length === 0 && (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No doctors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No doctors have signed up yet.
          </p>
        </div>
      )}


    </div>
  )
}