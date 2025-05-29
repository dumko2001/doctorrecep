import { Zap, Calendar, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'
import { QuotaInfo } from '@/lib/types'

interface QuotaCardProps {
  quota: QuotaInfo
}

export function QuotaCard({ quota }: QuotaCardProps) {
  const getQuotaColor = () => {
    if (quota.quota_percentage >= 90) return 'text-red-600'
    if (quota.quota_percentage >= 70) return 'text-orange-600'
    return 'text-emerald-600'
  }

  const getQuotaBgColor = () => {
    if (quota.quota_percentage >= 90) return 'bg-red-100'
    if (quota.quota_percentage >= 70) return 'bg-orange-100'
    return 'bg-emerald-100'
  }

  const getQuotaIcon = () => {
    if (quota.quota_percentage >= 90) return AlertTriangle
    if (quota.quota_percentage >= 70) return Zap
    return CheckCircle
  }

  const getProgressBarColor = () => {
    if (quota.quota_percentage >= 90) return 'bg-red-500'
    if (quota.quota_percentage >= 70) return 'bg-orange-500'
    return 'bg-emerald-500'
  }

  const QuotaIcon = getQuotaIcon()

  return (
    <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-lg p-6 border border-orange-200/50 hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-slate-800">AI Quota</h3>
        <div className={`w-8 h-8 rounded-md ${getQuotaBgColor()} flex items-center justify-center shadow-sm`}>
          <QuotaIcon className={`w-5 h-5 ${getQuotaColor()}`} />
        </div>
      </div>

      {/* Quota Usage */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-600 mb-2">
          <span>Used this month</span>
          <span>{quota.quota_used} / {quota.monthly_quota}</span>
        </div>
        <div className="w-full bg-orange-100 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressBarColor()}`}
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
      <div className="mb-4 p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-200/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-teal-600" />
            <span className="text-sm text-slate-600">Remaining</span>
          </div>
          <span className="text-lg font-semibold text-slate-800">
            {quota.quota_remaining}
          </span>
        </div>
      </div>

      {/* Reset Information */}
      <div className="flex items-center text-sm text-slate-500 mb-4">
        <Calendar className="w-4 h-4 mr-2" />
        <span>
          Resets in {quota.days_until_reset} day{quota.days_until_reset !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Warning Messages */}
      {quota.quota_percentage >= 90 && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
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
        <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <Zap className="w-4 h-4 text-orange-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-orange-700">
              <p className="font-medium">High usage detected</p>
              <p>Consider monitoring your AI generation usage.</p>
            </div>
          </div>
        </div>
      )}


    </div>
  )
}