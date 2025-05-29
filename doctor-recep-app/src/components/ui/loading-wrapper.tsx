'use client'

import { ReactNode } from 'react'

interface LoadingWrapperProps {
  isLoading: boolean
  children: ReactNode
  loadingText?: string
  className?: string
}

export function LoadingWrapper({ isLoading, children, loadingText = 'Loading...', className = '' }: LoadingWrapperProps) {
  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-bounce"></div>
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-4 h-4 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            <span className="ml-2 text-slate-600">{loadingText}</span>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export function SkeletonBox({ className = '', height = 'h-4' }: { className?: string, height?: string }) {
  return (
    <div className={`${height} bg-slate-200 rounded animate-pulse ${className}`}></div>
  )
}

export function FormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <SkeletonBox height="h-6" className="w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SkeletonBox height="h-10" />
          <SkeletonBox height="h-10" />
        </div>
      </div>
      <div className="space-y-4">
        <SkeletonBox height="h-6" className="w-1/4" />
        <SkeletonBox height="h-10" className="max-w-md" />
      </div>
      <div className="space-y-4">
        <SkeletonBox height="h-6" className="w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBox key={i} height="h-8" />
          ))}
        </div>
      </div>
      <div className="flex justify-between pt-6">
        <SkeletonBox height="h-10" className="w-32" />
        <SkeletonBox height="h-10" className="w-32" />
      </div>
    </div>
  )
}