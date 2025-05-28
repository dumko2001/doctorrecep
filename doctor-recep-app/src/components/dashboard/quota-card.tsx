import { Zap, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { QuotaInfo } from '@/lib/types'

interface QuotaCardProps {
  quota: QuotaInfo
}

export function QuotaCard({ quota }: QuotaCardProps) {
  const getQuotaColor = () => {
    if (quota.quota_percentage >= 90) return 'text-red-600'
    if (quota.quota_percentage >= 70) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getQuotaBgColor = () => {
    if (quota.quota_percentage >= 90) return 'bg-red-100'
    if (quota.quota_percentage >= 70) return 'bg-yellow-100'
    return 'bg-green-100'
  }

  const getQuotaIcon = () => {
    if (quota.quota_percentage >= 90) return AlertTriangle
    if (quota.quota_percentage >= 70) return Zap
    return CheckCircle
  }

  const QuotaIcon = getQuotaIcon()

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">AI Quota</h3>
        <div className={`w-8 h-8 rounded-md ${getQuotaBgColor()} flex items-center justify-center`}>
          <QuotaIcon className={`w-5 h-5 ${getQuotaColor()}`} />
        </div>
      </div>

      {/* Quota Usage */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Used this month</span>
          <span>{quota.quota_used} / {quota.monthly_quota}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              quota.quota_percentage >= 90
                ? 'bg-red-500'
                : quota.quota_percentage >= 70
                ? 'bg-yellow-500'
                : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(quota.quota_percentage, 100)}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className={`text-sm font-medium ${getQuotaColor()}`}>
            {quota.quota_percentage}%
          </span>
        </div>
      </div>

      {/* Remaining Quota */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Remaining</span>
          <span className="text-lg font-semibold text-gray-900">
            {quota.quota_remaining}
          </span>
        </div>
      </div>

      {/* Reset Information */}
      <div className="flex items-center text-sm text-gray-500">
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          Resets in {quota.days_until_reset} day{quota.days_until_reset !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Warning Messages */}
      {quota.quota_percentage >= 90 && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-red-700">
              <p className="font-medium">Quota almost exhausted!</p>
              <p>Contact admin to increase your monthly limit.</p>
            </div>
          </div>
        </div>
      )}

      {quota.quota_percentage >= 70 && quota.quota_percentage < 90 && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <Zap className="w-4 h-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-yellow-700">
              <p className="font-medium">High usage detected</p>
              <p>Consider monitoring your AI generation usage.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
