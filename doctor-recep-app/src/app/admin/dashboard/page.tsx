import { getAdmin } from '@/lib/auth/admin-dal'
import { getAdminDashboardStats, getAllDoctorsWithStats } from '@/lib/actions/admin'
import { AdminDashboardHeader } from '@/components/admin/admin-dashboard-header'
import { AdminDashboardStats } from '@/components/admin/admin-dashboard-stats'
import { DoctorsTable } from '@/components/admin/doctors-table'
import { redirect } from 'next/navigation'

export default async function AdminDashboardPage() {
  const admin = await getAdmin()
  
  if (!admin) {
    redirect('/admin/login')
  }

  const statsResult = await getAdminDashboardStats()
  const doctorsResult = await getAllDoctorsWithStats()
  
  const stats = statsResult.success ? statsResult.data : null
  const doctors = doctorsResult.success ? doctorsResult.data || [] : []

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminDashboardHeader admin={admin} />
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Dashboard Stats */}
        {stats && (
          <div className="mb-8">
            <AdminDashboardStats stats={stats} />
          </div>
        )}

        {/* Doctors Management */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Doctor Management
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage doctor accounts, approvals, and quotas
            </p>
          </div>
          
          <DoctorsTable doctors={doctors} />
        </div>
      </main>
    </div>
  )
}