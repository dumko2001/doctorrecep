'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, Shield, BarChart3 } from 'lucide-react'
import { adminLogout } from '@/lib/actions/admin-auth'
import { Admin } from '@/lib/types'

interface AdminDashboardHeaderProps {
  admin: Admin | null
}

export function AdminDashboardHeader({ admin }: AdminDashboardHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await adminLogout()
      router.push('/admin/login')
    } catch (error) {
      console.error('Logout error:', error)
      // Force redirect even if there's an error
      router.push('/admin/login')
    }
  }

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-6">
          {/* Left side - Admin info */}
          <div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Shield className="w-8 h-8 text-red-600" />
                <h1 className="text-2xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
              </div>
              {admin?.role === 'super_admin' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Super Admin
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Welcome back, {admin?.name}
              <span className="ml-2 text-gray-400">• {admin?.email}</span>
            </p>
          </div>

          {/* Right side - Navigation and logout */}
          <div className="flex items-center space-x-4">
            {/* Navigation Links */}
            <nav className="hidden md:flex space-x-4">
              <Link
                href="/admin/dashboard"
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </nav>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
