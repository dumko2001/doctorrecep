'use client'

import { useState } from 'react'
import { Clock, FileText, CheckCircle, Eye, Wand2 } from 'lucide-react'
import { Consultation } from '@/lib/types'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { ConsultationModal } from './consultation-modal'

interface ConsultationsListProps {
  consultations: Consultation[]
}

export function ConsultationsList({ consultations }: ConsultationsListProps) {
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'generated' | 'approved'>('all')

  // Handle consultation updates from modal
  const handleConsultationUpdate = (updatedConsultation: Consultation) => {
    setSelectedConsultation(updatedConsultation)
  }

  const filteredConsultations = consultations.filter(consultation => {
    if (filter === 'all') return true
    return consultation.status === filter
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'generated':
        return <FileText className="w-4 h-4 text-emerald-600" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review'
      case 'generated':
        return 'Summary Generated'
      case 'approved':
        return 'Approved'
      default:
        return 'Unknown'
    }
  }

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-orange-100 text-orange-800 border border-orange-300'
      case 'generated':
        return 'bg-emerald-100 text-emerald-800 border border-emerald-300'
      case 'approved':
        return 'bg-green-100 text-green-800 border border-green-300'
      default:
        return 'bg-slate-100 text-slate-800 border border-slate-300'
    }
  }

  const tabKeys: Array<'all' | 'pending' | 'generated' | 'approved'> = ['all', 'pending', 'generated', 'approved']

  if (consultations.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="mt-2 text-sm font-medium text-slate-800">No consultations</h3>
        <p className="mt-1 text-sm text-slate-600">
          Get started by recording a consultation on the mobile interface.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        {/* Filter Tabs */}
        <div className="border-b border-orange-200 mb-6">
          <nav className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto">
            {tabKeys.map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap py-2 px-2 sm:px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors duration-200 flex-shrink-0 ${
                  filter === key
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-slate-600 hover:text-slate-800 hover:border-orange-300'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {consultations.filter(c => c.status === key).length > 0 && (
                  <span className={`ml-1 sm:ml-2 py-0.5 px-1 sm:px-2 rounded-full text-xs ${
                    filter === key
                      ? 'bg-teal-100 text-teal-700'
                      : 'bg-orange-100 text-slate-700'
                  }`}>
                    {consultations.filter(c => c.status === key).length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Consultations List */}
        <div className="space-y-4">
          {filteredConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white/80 backdrop-blur-sm border border-orange-200/50 rounded-lg p-3 sm:p-4 hover:shadow-lg hover:bg-white/90 transition-all duration-200 hover:scale-[1.02]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                <div className="flex items-start sm:items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                  <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                    {getStatusIcon(consultation.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                      <h3 className="text-sm font-medium text-slate-800 truncate">
                        Patient #{consultation.patient_number || 'N/A'}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium self-start ${getStatusBadgeClass(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm text-slate-600">
                      <span className="truncate">Submitted by: {consultation.submitted_by}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>{formatRelativeTime(consultation.created_at)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span className="hidden sm:inline">{formatDate(consultation.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {consultation.status === 'pending' && (
                    <button
                      onClick={() => setSelectedConsultation(consultation)}
                      className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      <span className="hidden sm:inline">Generate Summary</span>
                      <span className="sm:hidden">Generate</span>
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedConsultation(consultation)}
                    className="inline-flex items-center px-2 sm:px-3 py-1.5 border border-orange-300 hover:border-teal-400 text-xs font-medium rounded text-slate-700 bg-white/70 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-200"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    <span className="hidden sm:inline">View Details</span>
                    <span className="sm:hidden">View</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredConsultations.length === 0 && filter !== 'all' && (
          <div className="text-center py-8">
            <p className="text-sm text-slate-600">
              No consultations with status &quot;{filter}&quot;.
            </p>
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          onClose={() => setSelectedConsultation(null)}
          onConsultationUpdate={handleConsultationUpdate}
        />
      )}
    </>
  )
}