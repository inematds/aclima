'use client'

import { useState, useEffect } from 'react'
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  ChevronRight,
  X,
  CloudRain,
  Wind,
  Gauge
} from 'lucide-react'
import { BRAZILIAN_STATES, type StateCode, type WeatherData } from '@/types/weather'
import { useStateWeather, formatTimeAgo } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'

const alertColors = {
  normal: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' },
  attention: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
  alert: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
  severe: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' },
}

export default function MobileStatePanel() {
  const geolocation = useGeolocation()
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [selectedStation, setSelectedStation] = useState<WeatherData | null>(null)
  const [showStateSelector, setShowStateSelector] = useState(false)

  // Load last accessed state from localStorage or use geolocation
  useEffect(() => {
    if (selectedState) return // Already set

    // Try localStorage first
    const lastState = typeof window !== 'undefined' ? localStorage.getItem('lastAccessedState') : null
    if (lastState && BRAZILIAN_STATES[lastState as StateCode]) {
      setSelectedState(lastState as StateCode)
      return
    }

    // Then try geolocation
    if (geolocation.state && !geolocation.loading) {
      setSelectedState(geolocation.state)
      return
    }

    // Default to SP only if geolocation failed
    if (!geolocation.loading && !geolocation.state) {
      setSelectedState('SP')
    }
  }, [geolocation.state, geolocation.loading, selectedState])

  // Save state to localStorage when changed
  useEffect(() => {
    if (selectedState && typeof window !== 'undefined') {
      localStorage.setItem('lastAccessedState', selectedState)
    }
  }, [selectedState])

  const effectiveState = selectedState || 'SP'

  const {
    data: weatherData,
    loading,
    refetch
  } = useStateWeather({ state: effectiveState, refreshInterval: 5 * 60 * 1000 })

  const stateInfo = BRAZILIAN_STATES[effectiveState]

  // Stats
  const stats = {
    avgTemp: weatherData.length > 0
      ? (weatherData.reduce((sum, w) => sum + w.temperature.current, 0) / weatherData.length).toFixed(1)
      : '--',
    avgHumidity: weatherData.length > 0
      ? Math.round(weatherData.reduce((sum, w) => sum + w.humidity.current, 0) / weatherData.length)
      : '--',
    totalRain1h: weatherData.reduce((sum, w) => sum + w.rain.last1h, 0).toFixed(1),
    totalRain24h: weatherData.reduce((sum, w) => sum + w.rain.last24h, 0).toFixed(1),
    alertCount: weatherData.filter(w => w.alertLevel !== 'normal').length,
    severeCount: weatherData.filter(w => w.alertLevel === 'severe').length,
  }

  const getWorstAlert = () => {
    if (weatherData.some(w => w.alertLevel === 'severe')) return 'severe'
    if (weatherData.some(w => w.alertLevel === 'alert')) return 'alert'
    if (weatherData.some(w => w.alertLevel === 'attention')) return 'attention'
    return 'normal'
  }

  const worstAlert = getWorstAlert()

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Painel do Estado</h1>
              <button
                onClick={() => setShowStateSelector(true)}
                className="flex items-center gap-1 text-sm text-blue-600"
              >
                <MapPin className="h-4 w-4" />
                {stateInfo?.name || selectedState}
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
          {/* Main Stats Card */}
          <div className={`rounded-2xl p-5 text-white ${alertColors[worstAlert].bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-4xl font-light">{stats.avgTemp}°</div>
                <div className="text-sm opacity-80 mt-1">{stateInfo?.name}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{weatherData.length}</div>
                <div className="text-xs opacity-80">estações</div>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-4 pt-4 border-t border-white/20">
              <div className="text-center">
                <Droplets className="h-4 w-4 mx-auto opacity-80" />
                <div className="text-sm font-semibold mt-1">{stats.avgHumidity}%</div>
                <div className="text-[10px] opacity-70">Umid.</div>
              </div>
              <div className="text-center">
                <CloudRain className="h-4 w-4 mx-auto opacity-80" />
                <div className="text-sm font-semibold mt-1">{stats.totalRain1h}</div>
                <div className="text-[10px] opacity-70">mm/1h</div>
              </div>
              <div className="text-center">
                <CloudRain className="h-4 w-4 mx-auto opacity-80" />
                <div className="text-sm font-semibold mt-1">{stats.totalRain24h}</div>
                <div className="text-[10px] opacity-70">mm/24h</div>
              </div>
              <div className="text-center">
                <AlertTriangle className="h-4 w-4 mx-auto opacity-80" />
                <div className="text-sm font-semibold mt-1">{stats.alertCount}</div>
                <div className="text-[10px] opacity-70">Alertas</div>
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-red-700">{stats.severeCount}</div>
              <div className="text-xs text-red-600">Severos</div>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-orange-700">
                {weatherData.filter(w => w.alertLevel === 'alert').length}
              </div>
              <div className="text-xs text-orange-600">Alertas</div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">
                {weatherData.filter(w => w.alertLevel === 'attention').length}
              </div>
              <div className="text-xs text-yellow-600">Atenção</div>
            </div>
          </div>

          {/* Alerts Section */}
          {stats.alertCount > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Estações em Alerta</h3>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {weatherData
                  .filter(w => w.alertLevel !== 'normal')
                  .map(station => (
                    <button
                      key={station.stationId}
                      onClick={() => setSelectedStation(station)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${alertColors[station.alertLevel].bg}`} />
                        <div className="text-left">
                          <div className="font-medium text-gray-900 text-sm">{station.stationName}</div>
                          <div className="text-xs text-gray-500">
                            {station.rain.last1h}mm/1h - {station.temperature.current}°C
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* All Stations */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Todas as Estações</h3>
              <span className="text-xs text-gray-500">{weatherData.length} estações</span>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {weatherData.map(station => (
                <button
                  key={station.stationId}
                  onClick={() => setSelectedStation(station)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${alertColors[station.alertLevel].bg}`} />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{station.stationName}</div>
                      <div className="text-xs text-gray-500">{station.stationId}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{station.temperature.current}°</div>
                    <div className="text-xs text-gray-500">{station.rain.last1h}mm</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* State Selector Modal */}
      {showStateSelector && (
        <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setShowStateSelector(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[80vh] overflow-auto"
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

            <div className="px-4 py-2">
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
        <div className="fixed inset-0 bg-black/60 z-[100]" onClick={() => setSelectedStation(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[75vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2">
              <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mb-3" />
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStation.stationName}</h3>
                  <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs mt-1 ${alertColors[selectedStation.alertLevel].light} ${alertColors[selectedStation.alertLevel].text}`}>
                    <div className={`w-2 h-2 rounded-full ${alertColors[selectedStation.alertLevel].bg}`} />
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
                  <CloudRain className="h-5 w-5 text-blue-500 mx-auto mb-1" />
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
                <div className="bg-gray-50 rounded-xl p-3">
                  <Wind className="h-5 w-5 text-gray-500 mb-1" />
                  <div className="text-xl font-bold text-gray-900">{selectedStation.wind.speed} km/h</div>
                  <div className="text-xs text-gray-500">Vento</div>
                </div>
                <div className="bg-purple-50 rounded-xl p-3">
                  <Gauge className="h-5 w-5 text-purple-500 mb-1" />
                  <div className="text-xl font-bold text-gray-900">{selectedStation.pressure} hPa</div>
                  <div className="text-xs text-gray-500">Pressão</div>
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
