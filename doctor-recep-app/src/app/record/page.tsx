import { Metadata } from 'next'
import { getUser } from '@/lib/auth/dal'
import { RecordingInterface } from '@/components/record/recording-interface'

export const metadata: Metadata = {
  title: 'Record Consultation - Doctor Reception System',
  description: 'Record patient consultations with voice and images',
}

export default async function RecordPage() {
  const user = await getUser()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Dr. {user?.name}
              </h1>
              <p className="text-sm text-gray-600">
                {user?.clinic_name ? user.clinic_name : 'Record Consultation'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Recording Interface</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <RecordingInterface />
      </main>
    </div>
  )
}
