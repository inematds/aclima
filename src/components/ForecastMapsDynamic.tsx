'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const ForecastMaps = dynamic(() => import('./ForecastMaps'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Mapas de Previsão</h3>
      </div>
      <div className="aspect-video bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-sm text-gray-500">Carregando mapas...</p>
        </div>
      </div>
    </div>
  )
})

interface ForecastMapsDynamicProps {
  latitude?: number
  longitude?: number
  className?: string
}

export default function ForecastMapsDynamic(props: ForecastMapsDynamicProps) {
  return <ForecastMaps {...props} />
}
