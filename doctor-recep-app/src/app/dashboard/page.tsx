import { Metadata } from 'next'
import { verifySession, getUser, getDoctorQuota } from '@/lib/auth/dal'
import { getConsultations } from '@/lib/actions/consultations'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { ConsultationsList } from '@/components/dashboard/consultations-list'
import { QuotaCard } from '@/components/dashboard/quota-card'

export const metadata: Metadata = {
  title: 'Dashboard - Doctor Reception System',
  description: 'Manage patient consultations and generate summaries',
}

export default async function DashboardPage() {
  const session = await verifySession()
  const user = await getUser()
  const consultationsResult = await getConsultations()
  const quotaInfo = await getDoctorQuota(session.userId)

  const consultations = consultationsResult.success ? consultationsResult.data || [] : []

  // Calculate stats
  const stats = {
    total_consultations: consultations.length,
    pending_consultations: consultations.filter(c => c.status === 'pending').length,
    generated_consultations: consultations.filter(c => c.status === 'generated').length,
    approved_consultations: consultations.filter(c => c.status === 'approved').length,
    today_consultations: consultations.filter(c => {
      const today = new Date().toDateString()
      const consultationDate = new Date(c.created_at).toDateString()
      return today === consultationDate
    }).length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <DashboardHeader user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3">
              <DashboardStats stats={stats} />
            </div>
            <div className="lg:col-span-1">
              {quotaInfo && <QuotaCard quota={quotaInfo} />}
            </div>
          </div>

          {/* Consultations List */}
          <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-lg border border-orange-200/50">
            <div className="px-6 py-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
              <h2 className="text-lg font-medium text-slate-800">
                Patient Consultations
              </h2>
              <p className="text-sm text-slate-600">
                Review and manage patient consultation summaries
              </p>
            </div>

            <ConsultationsList consultations={consultations} />
          </div>
        </div>
      </main>
    </div>
  )
}