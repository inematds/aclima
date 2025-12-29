'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'
import type { WeatherData } from '@/types/weather'

// Dynamic import to avoid SSR issues with Leaflet
const WeatherMap = dynamic(() => import('./WeatherMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <span className="text-sm text-gray-600">Carregando mapa...</span>
      </div>
    </div>
  ),
})

interface WeatherMapDynamicProps {
  stations: WeatherData[]
  selectedStation?: string | null
  onStationSelect?: (stationId: string) => void
  center?: [number, number]
  zoom?: number
  className?: string
}

export default function WeatherMapDynamic(props: WeatherMapDynamicProps) {
  return <WeatherMap {...props} />
}
