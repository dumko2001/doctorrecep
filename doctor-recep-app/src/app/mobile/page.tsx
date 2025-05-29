import { Metadata, Viewport } from 'next'
import { getUser } from '@/lib/auth/dal'
import { MobileRecordingInterface } from '@/components/mobile/recording-interface'

export const metadata: Metadata = {
  title: 'Doctor Mobile - Record Consultation',
  description: 'Record patient consultations on mobile',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default async function MobilePage() {
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
                {user?.clinic_name ? user.clinic_name : 'Mobile Recording'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Mobile Interface</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6">
        <MobileRecordingInterface />
      </main>
    </div>
  )
}
