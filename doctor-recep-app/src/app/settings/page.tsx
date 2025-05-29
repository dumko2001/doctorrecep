import { verifySession } from '@/lib/auth/dal'
import { SettingsForm } from '@/components/settings/settings-form'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { jsonToTemplateConfig } from '@/lib/types'
import Link from 'next/link'
import { Home } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 opacity-0 animate-fade-in">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white/80 backdrop-blur-sm shadow-lg rounded-lg border border-orange-200/50 transform translate-y-4 animate-slide-up">
          <div className="px-6 py-4 border-b border-orange-200/50 bg-gradient-to-r from-orange-50/50 to-amber-50/50">
            <div className="flex items-center space-x-3 mb-2">
              <Link
                href="/dashboard"
                prefetch={true}
                className="inline-flex items-center p-2 border border-orange-300 hover:border-teal-400 rounded-lg text-slate-700 bg-white/70 hover:bg-orange-50 transition-all duration-150 transform hover:scale-105 active:scale-95"
                title="Back to Dashboard"
              >
                <Home className="w-4 h-4" />
              </Link>
              <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
            </div>
            <p className="mt-1 text-sm text-slate-600">
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