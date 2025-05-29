import Link from 'next/link'
import { Stethoscope, Smartphone, Monitor, Mic, CheckCircle, Heart, Brain, Zap, ArrowRight, Clock, Star } from 'lucide-react'
import { checkSession } from '@/lib/auth/dal'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Check if user is already logged in and redirect to dashboard
  const session = await checkSession()
  if (session) {
    redirect('/dashboard')
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Stethoscope className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full animate-ping"></div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-400 rounded-full"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-teal-700 bg-clip-text text-transparent">
                  Clinote
                </h1>
                <p className="text-xs text-teal-600/80">AI-Powered Healthcare Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-slate-700 hover:text-teal-700 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-orange-100/50"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white px-6 py-2 rounded-lg text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-emerald-100 to-teal-100 border border-emerald-300/50 rounded-full px-6 py-2 shadow-sm">
              <Brain className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 text-sm font-medium">Powered by Advanced AI</span>
              <Star className="w-4 h-4 text-orange-500 fill-current" />
            </div>
          </div>
          
          <h2 className="text-4xl font-extrabold text-slate-800 sm:text-5xl md:text-6xl mb-6">
            AI-Powered Patient
            <span className="bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 bg-clip-text text-transparent block mt-2">
              Consultation Summaries
            </span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-600 leading-relaxed">
            Transform voice recordings and handwritten notes into professional patient summaries
            using advanced AI. Perfect for Indian clinics and hospitals.
          </p>
          
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              href="/signup"
              className="group bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white px-8 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="bg-white/70 hover:bg-white border border-orange-300 hover:border-teal-400 text-slate-700 px-8 py-3 rounded-lg text-lg font-medium transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md"
            >
              Sign In
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center items-center text-slate-500">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="text-sm">24/7 Support</span>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              How It Works
            </h3>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Simple, efficient, and powerful workflow designed for busy healthcare professionals
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Mic className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-200/30 to-teal-200/30 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-3">
                Record Consultation
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Doctors use mobile interface to record patient consultations and capture handwritten notes
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Brain className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-emerald-200/30 to-green-200/30 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-3">
                AI Processing
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Advanced AI analyzes audio and images to generate structured patient summaries
              </p>
            </div>

            <div className="group text-center">
              <div className="relative mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-200/30 to-amber-200/30 rounded-3xl blur-lg group-hover:blur-xl transition-all duration-300"></div>
              </div>
              <h4 className="text-xl font-semibold text-slate-800 mb-3">
                Review & Approve
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Receptionists review, edit, and approve summaries before sharing with patients
              </p>
            </div>
          </div>
        </div>

        {/* Interfaces */}
        <div className="mt-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-slate-800 mb-4">
              Two Powerful Interfaces
            </h3>
            <p className="text-slate-600 text-lg max-w-2xl mx-auto">
              Seamlessly designed for both doctors and receptionists
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="group bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Smartphone className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800">
                  Mobile Interface
                </h4>
              </div>
              <p className="text-slate-600 mb-4">
                Designed for doctors to quickly record consultations on their mobile devices
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  Voice recording with one-tap start/stop
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  Camera integration for handwritten notes
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  Offline-capable with sync when connected
                </li>
              </ul>
            </div>

            <div className="group bg-white/70 backdrop-blur-sm border border-orange-200/50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg flex items-center justify-center mr-3 shadow-md">
                  <Monitor className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-xl font-semibold text-slate-800">
                  Desktop Dashboard
                </h4>
              </div>
              <p className="text-slate-600 mb-4">
                Comprehensive dashboard for receptionists to manage all consultations
              </p>
              <ul className="space-y-2">
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  AI-powered summary generation
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  Rich text editing and formatting
                </li>
                <li className="flex items-center text-slate-600">
                  <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center mr-3">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                  </div>
                  WhatsApp integration for patient communication
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-orange-100/80 to-amber-100/80 border border-orange-300/50 rounded-xl p-8 shadow-lg backdrop-blur-sm">
            <Heart className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-3">
              Ready to Transform Your Practice?
            </h3>
            <p className="text-slate-600 text-lg mb-6 max-w-2xl mx-auto">
              Join hundreds of healthcare providers who are already saving time and improving patient care.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800 text-white px-6 py-3 rounded-lg text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 space-x-2"
            >
              <span>Start Your Free Trial</span>
              <Zap className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/70 backdrop-blur-sm border-t border-orange-200/50 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex justify-center items-center space-x-3 mb-4">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Stethoscope className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-700 font-semibold">Clinote</span>
            </div>
            <p className="text-slate-500 mb-3">
              &copy; 2025 Clinote. Built with ❤️ for Indian healthcare providers.
            </p>
            <div className="flex justify-center items-center space-x-6 text-slate-400 text-sm">
              <span className="hover:text-teal-600 cursor-pointer">Privacy Policy</span>
              <span>•</span>
              <span className="hover:text-teal-600 cursor-pointer">Terms of Service</span>
              <span>•</span>
              <span className="hover:text-teal-600 cursor-pointer">Support</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}