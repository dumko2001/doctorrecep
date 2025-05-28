import Link from 'next/link'
import { Stethoscope, Smartphone, Monitor, Mic, FileText, CheckCircle } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Stethoscope className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">
                Doctor Reception System
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            AI-Powered Patient
            <span className="text-blue-600"> Consultation Summaries</span>
          </h2>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            Transform voice recordings and handwritten notes into professional patient summaries
            using advanced AI. Perfect for Indian clinics and hospitals.
          </p>
          <div className="mt-10 flex justify-center space-x-4">
            <Link
              href="/signup"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-md text-lg font-medium"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="border border-gray-300 hover:border-gray-400 text-gray-700 px-8 py-3 rounded-md text-lg font-medium"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8 text-blue-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Record Consultation
              </h4>
              <p className="text-gray-600">
                Doctors use mobile interface to record patient consultations and capture handwritten notes
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-purple-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                AI Processing
              </h4>
              <p className="text-gray-600">
                Advanced AI analyzes audio and images to generate structured patient summaries
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">
                Review & Approve
              </h4>
              <p className="text-gray-600">
                Receptionists review, edit, and approve summaries before sharing with patients
              </p>
            </div>
          </div>
        </div>

        {/* Interfaces */}
        <div className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Two Powerful Interfaces
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Smartphone className="w-8 h-8 text-blue-600 mr-3" />
                <h4 className="text-2xl font-semibold text-gray-900">
                  Mobile Interface
                </h4>
              </div>
              <p className="text-gray-600 mb-6">
                Designed for doctors to quickly record consultations on their mobile devices
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Voice recording with one-tap start/stop
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Camera integration for handwritten notes
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Offline-capable with sync when connected
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center mb-6">
                <Monitor className="w-8 h-8 text-purple-600 mr-3" />
                <h4 className="text-2xl font-semibold text-gray-900">
                  Desktop Dashboard
                </h4>
              </div>
              <p className="text-gray-600 mb-6">
                Comprehensive dashboard for receptionists to manage all consultations
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  AI-powered summary generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  Rich text editing and formatting
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  WhatsApp integration for patient communication
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Doctor Reception System. Built for Indian healthcare providers.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}