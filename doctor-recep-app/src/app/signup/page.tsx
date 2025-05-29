import { Metadata } from 'next'
import Link from 'next/link'
import { SignupForm } from '@/components/auth/signup-form'
import { Stethoscope, Users, Zap } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Sign Up - Doctor Reception System',
  description: 'Create your doctor reception account',
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full animate-ping"></div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-400 rounded-full"></div>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">
            Join Our Platform
          </h2>
          <p className="text-slate-600">
            Create your account and start managing consultations efficiently
          </p>
          <div className="mt-4 flex justify-center items-center space-x-6 text-slate-500 text-sm">
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>500+ Doctors</span>
            </div>
            <div className="flex items-center space-x-1">
              <Zap className="w-4 h-4 text-orange-500" />
              <span>AI Powered</span>
            </div>
          </div>
        </div>
        
        {/* Signup Form Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl p-8 border border-orange-200/50">
          <SignupForm />
        </div>
        
        {/* Sign in link */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200/30">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-teal-600 hover:text-emerald-700 transition-colors duration-200"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}