import { Users, UserCheck, UserX, FileText, Zap, TrendingUp } from 'lucide-react'
import { AdminDashboardStats as StatsType } from '@/lib/types'

interface AdminDashboardStatsProps {
  stats: StatsType
}

export function AdminDashboardStats({ stats }: AdminDashboardStatsProps) {
  const statItems = [
    {
      name: 'Total Doctors',
      value: stats.total_doctors,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Pending Approvals',
      value: stats.pending_approvals,
      icon: UserX,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Approved Doctors',
      value: stats.approved_doctors,
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Total Consultations',
      value: stats.total_consultations,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'AI Generations',
      value: stats.total_ai_generations,
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
    {
      name: 'Quota Usage',
      value: `${stats.quota_usage_percentage}%`,
      icon: TrendingUp,
      color: stats.quota_usage_percentage > 80 ? 'text-red-600' : 'text-emerald-600',
      bgColor: stats.quota_usage_percentage > 80 ? 'bg-red-100' : 'bg-emerald-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {statItems.map((item) => (
        <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md ${item.bgColor} flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {item.name}
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {item.value}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
