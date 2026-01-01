'use client'

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Loader2,
  MapPin,
  ChevronRight,
  X,
  Droplets,
  Thermometer
} from 'lucide-react'
import { useWeather, formatTimeAgo } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import { BRAZILIAN_STATES, type StateCode, type WeatherData } from '@/types/weather'

const alertColors = {
  attention: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-200' },
  alert: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
  severe: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200' },
}

type AlertLevel = 'attention' | 'alert' | 'severe'

function getAlertMessage(level: AlertLevel, rain1h: number, rain24h: number): string {
  if (level === 'severe') {
    if (rain24h >= 50) {
      return `Risco de alagamento. Acumulado 24h de ${rain24h}mm ultrapassa limite crítico.`
    }
    return `Chuva muito intensa: ${rain1h}mm/h. Risco de alagamentos.`
  }
  if (level === 'alert') {
    return `Chuva intensa: ${rain1h}mm na última hora. Monitorar evolução.`
  }
  return `Chuva moderada: ${rain1h}mm na última hora. Situação sob controle.`
}

export default function MobileAlerts() {
  const geolocation = useGeolocation()
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [selectedStation, setSelectedStation] = useState<WeatherData | null>(null)
  const [showStateSelector, setShowStateSelector] = useState(false)

  useEffect(() => {
    if (!selectedState && geolocation.state && !geolocation.loading) {
      setSelectedState(geolocation.state)
    }
    if (!selectedState && !geolocation.loading && !geolocation.state) {
      setSelectedState('SP')
    }
  }, [geolocation.state, geolocation.loading, selectedState])

  const effectiveState = selectedState || 'SP'

  const {
    data: weatherData,
    loading,
    refetch
  } = useWeather({ refreshInterval: 5 * 60 * 1000, state: effectiveState })

  const stateInfo = BRAZILIAN_STATES[effectiveState]

  // Filtrar estações com alertas
  const stationsWithAlerts = weatherData.filter(w => w.alertLevel !== 'normal')
  const severeCount = stationsWithAlerts.filter(s => s.alertLevel === 'severe').length
  const alertCount = stationsWithAlerts.filter(s => s.alertLevel === 'alert').length
  const attentionCount = stationsWithAlerts.filter(s => s.alertLevel === 'attention').length

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Alertas</h1>
              <button
                onClick={() => setShowStateSelector(true)}
                className="flex items-center gap-1 text-sm text-blue-600"
              >
                <MapPin className="h-4 w-4" />
                {stateInfo?.name || effectiveState}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="p-2 text-gray-500"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && weatherData.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Contadores */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <XCircle className="h-6 w-6 text-red-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-red-700">{severeCount}</div>
              <div className="text-xs text-red-600">Severos</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-orange-700">{alertCount}</div>
              <div className="text-xs text-orange-600">Alertas</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <AlertCircle className="h-6 w-6 text-yellow-600 mx-auto mb-1" />
              <div className="text-2xl font-bold text-yellow-700">{attentionCount}</div>
              <div className="text-xs text-yellow-600">Atenção</div>
            </div>
          </div>

          {/* Lista de Alertas */}
          {stationsWithAlerts.length === 0 ? (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="h-7 w-7 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-green-800 mb-1">
                Nenhum alerta ativo
              </h3>
              <p className="text-green-600 text-sm">
                Todas as estações em {stateInfo?.name} estão com condições normais.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Estações em Alerta</h3>
                <p className="text-xs text-gray-500">{stationsWithAlerts.length} de {weatherData.length} estações</p>
              </div>
              <div className="max-h-[60vh] overflow-y-auto">
                {stationsWithAlerts.map(station => {
                  const level = station.alertLevel as AlertLevel
                  const colors = alertColors[level]

                  return (
                    <button
                      key={station.stationId}
                      onClick={() => setSelectedStation(station)}
                      className={`w-full px-4 py-3 flex items-start gap-3 border-b border-gray-50 last:border-b-0 ${colors.light}`}
                    >
                      <div className={`w-3 h-3 rounded-full mt-1.5 ${colors.bg}`} />
                      <div className="flex-1 text-left">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${colors.light} ${colors.text} border ${colors.border}`}>
                            {level === 'severe' ? 'SEVERO' : level === 'alert' ? 'ALERTA' : 'ATENÇÃO'}
                          </span>
                          <span className="text-xs text-gray-400">{formatTimeAgo(station.timestamp)}</span>
                        </div>
                        <p className="font-medium text-gray-900 text-sm mt-1">{station.stationName}</p>
                        <p className="text-xs text-gray-600 mt-0.5">
                          {getAlertMessage(level, station.rain.last1h, station.rain.last24h)}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                          <span>1h: {station.rain.last1h}mm</span>
                          <span>24h: {station.rain.last24h}mm</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-300 mt-1" />
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* State Selector Modal */}
      {showStateSelector && (
        <div className="fixed inset-0 bg-black/60 z-[99]" onClick={() => setShowStateSelector(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-auto safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2 border-b">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">Selecionar Estado</h3>
                <button onClick={() => setShowStateSelector(false)} className="p-2">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="px-4 py-2 pb-8">
              {(Object.entries(BRAZILIAN_STATES) as [StateCode, typeof BRAZILIAN_STATES[StateCode]][]).map(([code, state]) => (
                <button
                  key={code}
                  onClick={() => {
                    setSelectedState(code)
                    setShowStateSelector(false)
                  }}
                  className={`w-full px-4 py-3 text-left rounded-lg mb-1 ${
                    effectiveState === code ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">{state.name}</div>
                  <div className="text-xs text-gray-500">{state.capital}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/60 z-[99]" onClick={() => setSelectedStation(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-auto safe-area-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStation.stationName}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs mt-1 ${alertColors[selectedStation.alertLevel as AlertLevel]?.light || 'bg-green-50'} ${alertColors[selectedStation.alertLevel as AlertLevel]?.text || 'text-green-700'}`}>
                    <div className={`w-2 h-2 rounded-full ${alertColors[selectedStation.alertLevel as AlertLevel]?.bg || 'bg-green-500'}`} />
                    {selectedStation.alertLevel === 'normal' ? 'Normal' :
                     selectedStation.alertLevel === 'attention' ? 'Atenção' :
                     selectedStation.alertLevel === 'alert' ? 'Alerta' : 'Severo'}
                  </div>
                </div>
                <button onClick={() => setSelectedStation(null)} className="p-2 -mr-2">
                  <X className="h-6 w-6 text-gray-400" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8">
              {/* Rain Data */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                  <div className="text-xl font-bold text-blue-700">{selectedStation.rain.current}</div>
                  <div className="text-xs text-gray-500">mm/h</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{selectedStation.rain.last1h}</div>
                  <div className="text-xs text-gray-500">mm/1h</div>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <div className="text-xl font-bold text-blue-700">{selectedStation.rain.last24h}</div>
                  <div className="text-xs text-gray-500">mm/24h</div>
                </div>
              </div>

              {/* Other Data */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="bg-orange-50 rounded-xl p-3">
                  <Thermometer className="h-5 w-5 text-orange-500 mb-1" />
                  <div className="text-xl font-bold text-gray-900">{selectedStation.temperature.current}°C</div>
                  <div className="text-xs text-gray-500">Temperatura</div>
                </div>
                <div className="bg-cyan-50 rounded-xl p-3">
                  <Droplets className="h-5 w-5 text-cyan-500 mb-1" />
                  <div className="text-xl font-bold text-gray-900">{selectedStation.humidity.current}%</div>
                  <div className="text-xs text-gray-500">Umidade</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500">
                  Última atualização: {formatTimeAgo(selectedStation.timestamp)}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  ID: {selectedStation.stationId}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
