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
    <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-orange-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 gap-4 sm:gap-0">
          {/* Left side - User info */}
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-800 truncate">
              Dr. {user?.name || 'Doctor'}
            </h1>
            <p className="text-sm text-slate-600 truncate">
              {user?.clinic_name || 'Medical Practice'}
            </p>
          </div>

          {/* Right side - Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {/* Settings Link */}
            <Link
              href="/settings"
              prefetch={true}
              className="inline-flex items-center px-2 sm:px-3 py-2 border border-orange-300 hover:border-teal-400 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-slate-700 bg-white/70 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-150 transform hover:scale-105 active:scale-95 flex-1 sm:flex-none justify-center"
            >
              <Settings className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Settings</span>
            </Link>

            {/* Record Interface Link */}
            <Link
              href="/record"
              prefetch={true}
              className="inline-flex items-center px-2 sm:px-3 py-2 border border-orange-300 hover:border-teal-400 shadow-sm text-xs sm:text-sm leading-4 font-medium rounded-md text-slate-700 bg-white/70 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all duration-150 transform hover:scale-105 active:scale-95 flex-1 sm:flex-none justify-center"
            >
              <Smartphone className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Record</span>
            </Link>

            {/* Logout */}
            <form action={logout} className="flex-1 sm:flex-none">
              <button
                type="submit"
                className="inline-flex items-center px-2 sm:px-3 py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 shadow-md hover:shadow-lg transition-all duration-150 transform hover:scale-105 active:scale-95 w-full justify-center"
              >
                <LogOut className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  )
}