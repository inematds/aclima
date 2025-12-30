'use client'

import WeatherDashboard from '@/components/WeatherDashboard'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import MobileDashboard from '@/components/mobile/MobileDashboard'

export default function Home() {
  return (
    <ResponsiveLayout mobileContent={<MobileDashboard />}>
      <WeatherDashboard />
    </ResponsiveLayout>
  )
}
