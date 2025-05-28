'use client'

import Link from 'next/link'
import { LogOut, Smartphone, Settings } from 'lucide-react'
import { logout } from '@/lib/actions/auth'
import { Doctor } from '@/lib/types'

interface DashboardHeaderProps {
  user: Doctor | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Left side - User info */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Welcome back, Dr. {user?.name}
              {user?.clinic_name ? (
                <span className="ml-2 text-gray-400">• {user.clinic_name}</span>
              ) : null}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center space-x-4">
            {/* Settings Link */}
            <Link
              href="/settings"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>

            {/* Record Interface Link */}
            <Link
              href="/record"
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Record Consultation
            </Link>

            {/* Logout */}
            <form action={logout}>
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}
