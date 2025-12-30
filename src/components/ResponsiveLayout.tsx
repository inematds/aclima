'use client'

import { useIsMobile } from '@/hooks/useIsMobile'
import MobileLayout from './mobile/MobileLayout'
import { Loader2 } from 'lucide-react'

interface ResponsiveLayoutProps {
  children: React.ReactNode
  mobileContent?: React.ReactNode
}

export default function ResponsiveLayout({ children, mobileContent }: ResponsiveLayoutProps) {
  const { isMobile, isLoaded } = useIsMobile()

  // Show loading while detecting device
  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (isMobile) {
    return <MobileLayout>{mobileContent || children}</MobileLayout>
  }

  return <>{children}</>
}
