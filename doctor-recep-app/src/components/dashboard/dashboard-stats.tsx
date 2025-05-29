import { FileText, Clock, CheckCircle, Calendar, Brain } from 'lucide-react'
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
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
    },
    {
      name: 'Pending Review',
      value: stats.pending_consultations,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      name: 'Generated Summaries',
      value: stats.generated_consultations,
      icon: Brain,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
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
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
      {statItems.map((item) => {
        const Icon = item.icon
        return (
          <div
            key={item.name}
            className="bg-white/80 backdrop-blur-sm overflow-hidden shadow-lg rounded-lg border border-orange-200/50 hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 ${item.bgColor} rounded-md flex items-center justify-center shadow-sm`}>
                    <Icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                </div>
                <div className="ml-5 flex-1 min-w-0">
                  <dl>
                    <dt className="text-xs font-medium text-slate-600 leading-tight">
                      {item.name}
                    </dt>
                    <dd className="text-xl font-bold text-slate-800 mt-1">
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