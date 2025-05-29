import { Metadata } from 'next'
import { getUser } from '@/lib/auth/dal'
import { RecordingInterface } from '@/components/record/recording-interface'
import Link from 'next/link'
import { Home } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Record Consultation - Doctor Reception System',
  description: 'Record patient consultations with voice and images',
}

export default async function RecordPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 opacity-0 animate-fade-in">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-200/50 transform translate-y-4 animate-slide-up">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="inline-flex items-center p-2 border border-orange-300 hover:border-teal-400 rounded-lg text-slate-700 bg-white/70 hover:bg-orange-50 transition-all duration-150 transform hover:scale-105 active:scale-95"
                title="Back to Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-slate-800">
                  {user?.name ? `Dr. ${user.name}` : 'Doctor'}
                </h1>
                <p className="text-sm text-slate-600">
                  {user?.clinic_name ? user.clinic_name : 'Record Consultation'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Recording Interface</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 transform translate-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <RecordingInterface />
      </main>
    </div>
  )
}