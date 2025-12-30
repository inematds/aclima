'use client'

import { useState } from 'react'
import { Radio, Droplets, Thermometer, Wind, Clock, CheckCircle, XCircle, AlertTriangle, Loader2, RefreshCw, Gauge } from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'
import { useWeather, formatTimeAgo } from '@/hooks/useWeather'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import MobileMapDynamic from '@/components/mobile/MobileMapDynamic'

type StationStatus = 'online' | 'offline' | 'delayed'

const statusConfig: Record<StationStatus, { color: string; bg: string; label: string; icon: typeof CheckCircle }> = {
  online: { color: 'text-green-600', bg: 'bg-green-100', label: 'Online', icon: CheckCircle },
  offline: { color: 'text-red-600', bg: 'bg-red-100', label: 'Offline', icon: XCircle },
  delayed: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Atrasado', icon: Clock },
}

function EstacoesContent() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')

  const {
    data: weatherData,
    loading,
    error,
    refetch
  } = useWeather({ refreshInterval: 5 * 60 * 1000, capital: selectedCapital })

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  // Mapear status
  const getStatus = (status: string): StationStatus => {
    if (status === 'online') return 'online'
    if (status === 'delayed') return 'delayed'
    return 'offline'
  }

  const onlineCount = weatherData.filter(s => s.status === 'online').length
  const offlineCount = weatherData.filter(s => s.status === 'offline').length
  const delayedCount = weatherData.filter(s => s.status === 'delayed').length

  if (loading && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando estações de {capitalInfo.name}...</p>
        </div>
      </div>
    )
  }

  if (error && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Erro ao carregar dados</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Estações Climáticas
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            Monitoramento em tempo real - {capitalInfo.name}, {capitalInfo.stateCode}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          Atualizar
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-3xl font-bold text-green-700">{onlineCount}</div>
              <div className="text-sm text-green-600">Estações Online</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-3xl font-bold text-yellow-700">{delayedCount}</div>
              <div className="text-sm text-yellow-600">Com Atraso</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-3xl font-bold text-red-700">{offlineCount}</div>
              <div className="text-sm text-red-600">Offline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {weatherData.length === 0 ? (
          <div className="col-span-full bg-gray-50 rounded-xl p-8 text-center">
            <Radio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma estação encontrada em {capitalInfo.name}</p>
          </div>
        ) : (
          weatherData.map((station) => {
            const status = getStatus(station.status)
            const config = statusConfig[status]
            const StatusIcon = config.icon

            return (
              <div
                key={station.stationId}
                className={`bg-white rounded-xl shadow-sm border p-5 ${
                  station.status === 'offline' ? 'opacity-60' : ''
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-gray-900">{station.stationId}</span>
                  </div>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>

                {/* Location */}
                <p className="text-sm text-gray-500 mb-4">{station.stationName}</p>

                {station.status !== 'offline' ? (
                  <>
                    {/* Rain Data */}
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="text-center p-2 bg-blue-50 rounded-lg">
                        <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                        <div className="text-lg font-bold text-gray-900">{station.rain.current}</div>
                        <div className="text-xs text-gray-500">mm/h</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">1h</div>
                        <div className="text-lg font-bold text-gray-900">{station.rain.last1h}</div>
                        <div className="text-xs text-gray-500">mm</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded-lg">
                        <div className="text-xs text-gray-500 mb-1">24h</div>
                        <div className="text-lg font-bold text-gray-900">{station.rain.last24h}</div>
                        <div className="text-xs text-gray-500">mm</div>
                      </div>
                    </div>

                    {/* Other Sensors */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Thermometer className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="text-sm font-bold">{station.temperature.current}°C</div>
                          <div className="text-xs text-gray-400">Temp</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Droplets className="h-4 w-4 text-cyan-500" />
                        <div>
                          <div className="text-sm font-bold">{station.humidity.current}%</div>
                          <div className="text-xs text-gray-400">Umidade</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Wind className="h-4 w-4 text-gray-500" />
                        <div>
                          <div className="text-sm font-bold">{station.wind.speed} km/h</div>
                          <div className="text-xs text-gray-400">Vento</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                        <Gauge className="h-4 w-4 text-purple-500" />
                        <div>
                          <div className="text-sm font-bold">{station.pressure} hPa</div>
                          <div className="text-xs text-gray-400">Pressão</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-sm border-t pt-3">
                      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                        station.alertLevel === 'severe' ? 'bg-red-100 text-red-700' :
                        station.alertLevel === 'alert' ? 'bg-orange-100 text-orange-700' :
                        station.alertLevel === 'attention' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {station.alertLevel === 'normal' ? 'Normal' :
                         station.alertLevel === 'attention' ? 'Atenção' :
                         station.alertLevel === 'alert' ? 'Alerta' : 'Severo'}
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(station.timestamp)}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4 text-gray-400">
                    <XCircle className="h-8 w-8 mx-auto mb-2" />
                    <p>Sem dados disponíveis</p>
                    <p className="text-xs">Última atualização: {formatTimeAgo(station.timestamp)}</p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Fonte */}
      <div className="text-center text-sm text-gray-500">
        Dados meteorológicos: Open-Meteo API | Atualização a cada 5 minutos
      </div>
    </div>
  )
}

export default function EstacoesPage() {
  return (
    <ResponsiveLayout mobileContent={<MobileMapDynamic />}>
      <EstacoesContent />
    </ResponsiveLayout>
  )
}
