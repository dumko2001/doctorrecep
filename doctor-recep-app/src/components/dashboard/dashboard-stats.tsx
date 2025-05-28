import { FileText, Clock, CheckCircle, Calendar } from 'lucide-react'
import { DashboardStats as StatsType } from '@/lib/types'

interface DashboardStatsProps {
  stats: StatsType
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statItems = [
    {
      name: 'Total Consultations',
      value: stats.total_consultations,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      name: 'Pending Review',
      value: stats.pending_consultations,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      name: 'Generated Summaries',
      value: stats.generated_consultations,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      name: 'Approved',
      value: stats.approved_consultations,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      name: 'Today',
      value: stats.today_consultations,
      icon: Calendar,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${item.bgColor} rounded-md flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
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
        )
      })}
    </div>
  )
}
