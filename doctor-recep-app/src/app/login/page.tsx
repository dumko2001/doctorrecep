import { Metadata } from 'next'
import Link from 'next/link'
import { LoginForm } from '@/components/auth/login-form'
import { Stethoscope, Heart, Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Login - Doctor Reception System',
  description: 'Login to your doctor reception account',
}

export default function LoginPage() {
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
            Welcome Back
          </h2>
          <p className="text-slate-600">
            Sign in to your doctor reception account
          </p>
          <div className="mt-4 flex justify-center items-center space-x-6 text-slate-500 text-sm">
            <div className="flex items-center space-x-1">
              <Shield className="w-4 h-4 text-teal-600" />
              <span>Secure</span>
            </div>
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-red-500" />
              <span>Healthcare</span>
            </div>
          </div>
        </div>
        
        {/* Login Form Card */}
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-xl p-8 border border-orange-200/50">
          <LoginForm />
        </div>
        
        {/* Sign up link */}
        <div className="text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-orange-200/30">
            <p className="text-sm text-slate-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/signup"
                className="font-medium text-teal-600 hover:text-emerald-700 transition-colors duration-200"
              >
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}