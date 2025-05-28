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
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'generated':
        return <FileText className="w-4 h-4 text-purple-500" />
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
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
        return 'bg-yellow-100 text-yellow-800'
      case 'generated':
        return 'bg-purple-100 text-purple-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const tabKeys: Array<'all' | 'pending' | 'generated' | 'approved'> = ['all', 'pending', 'generated', 'approved']

  if (consultations.length === 0) {
    return (
      <div className="p-6 text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No consultations</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by recording a consultation on the mobile interface.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="p-6">
        {/* Filter Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabKeys.map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
                {consultations.filter(c => c.status === key).length > 0 && (
                  <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                    filter === key
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-900'
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
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {getStatusIcon(consultation.status)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-medium text-gray-900">
                        Patient #{consultation.patient_number || 'N/A'}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(consultation.status)}`}>
                        {getStatusText(consultation.status)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Submitted by: {consultation.submitted_by}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(consultation.created_at)}</span>
                      <span>•</span>
                      <span>{formatDate(consultation.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {consultation.status === 'pending' && (
                    <button
                      onClick={() => setSelectedConsultation(consultation)}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <Wand2 className="w-3 h-3 mr-1" />
                      Generate Summary
                    </button>
                  )}

                  <button
                    onClick={() => setSelectedConsultation(consultation)}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredConsultations.length === 0 && filter !== 'all' && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
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
