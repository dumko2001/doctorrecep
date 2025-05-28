import { verifySession } from '@/lib/auth/dal'
import { SettingsForm } from '@/components/settings/settings-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { jsonToTemplateConfig } from '@/lib/types'

export default async function SettingsPage() {
  const session = await verifySession()
  
  if (!session) {
    redirect('/login')
  }

  const supabase = await createClient()
  
  // Get doctor's current template config
  const { data: doctor, error } = await supabase
    .from('doctors')
    .select('template_config, name, email')
    .eq('id', session.userId)
    .single()

  if (error || !doctor) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">
              Customize your consultation summary template and preferences
            </p>
          </div>
          
          <div className="p-6">
            <SettingsForm 
              doctorId={session.userId}
              currentConfig={jsonToTemplateConfig(doctor.template_config)}
              doctorName={doctor.name}
              doctorEmail={doctor.email}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
