'use client'

import MobileNavigation from './MobileNavigation'

interface MobileLayoutProps {
  children: React.ReactNode
}

export default function MobileLayout({ children }: MobileLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <MobileNavigation />
    </div>
  )
}
