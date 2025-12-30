'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWeather, useAlerts, formatTimeAgo } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Clock,
  Loader2,
  MapPin,
  Search,
  X,
  ChevronRight,
  Wind
} from 'lucide-react'
import type { StateCode, WeatherData } from '@/types/weather'
import { BRAZILIAN_STATES, BRAZILIAN_CAPITALS } from '@/types/weather'

const alertColors = {
  normal: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50' },
  attention: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50' },
  alert: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50' },
  severe: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50' },
}

const STATE_NAME_TO_CODE: Record<string, StateCode> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
}

interface GeoResult {
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
}

export default function MobileDashboard() {
  const geolocation = useGeolocation()
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null)
  const [selectedStation, setSelectedStation] = useState<WeatherData | null>(null)

  useEffect(() => {
    if (!selectedState && geolocation.state && !geolocation.loading) {
      setSelectedState(geolocation.state)
    }
  }, [geolocation.state, geolocation.loading, selectedState])

  const effectiveState = selectedState || geolocation.state || 'SP'

  const {
    data: weatherData,
    loading: weatherLoading,
    lastUpdate,
    refetch: refetchWeather
  } = useWeather({ refreshInterval: 5 * 60 * 1000, state: effectiveState })

  const { data: alertsData } = useAlerts({ refreshInterval: 10 * 60 * 1000 })

  const stateInfo = BRAZILIAN_STATES[effectiveState]

  // Search city
  const searchCity = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearchLoading(true)
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.results || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery])

  const handleCitySelect = (city: GeoResult) => {
    setSelectedCity(city)
    const stateCode = STATE_NAME_TO_CODE[city.state]
    if (stateCode) {
      setSelectedState(stateCode)
    }
    setShowSearch(false)
    setSearchQuery('')
    setSearchResults([])
  }

  // Stats
  const stats = {
    avgTemp: weatherData.length > 0
      ? (weatherData.reduce((sum, w) => sum + w.temperature.current, 0) / weatherData.length).toFixed(1)
      : '--',
    avgHumidity: weatherData.length > 0
      ? Math.round(weatherData.reduce((sum, w) => sum + w.humidity.current, 0) / weatherData.length)
      : '--',
    totalRain24h: weatherData.reduce((sum, w) => sum + w.rain.last24h, 0).toFixed(1),
    alertCount: weatherData.filter(w => w.alertLevel !== 'normal').length,
  }

  // Get worst alert level
  const getWorstAlert = () => {
    if (weatherData.some(w => w.alertLevel === 'severe')) return 'severe'
    if (weatherData.some(w => w.alertLevel === 'alert')) return 'alert'
    if (weatherData.some(w => w.alertLevel === 'attention')) return 'attention'
    return 'normal'
  }

  const worstAlert = getWorstAlert()

  const locationName = selectedCity
    ? `${selectedCity.name}, ${selectedCity.state}`
    : geolocation.latitude
    ? 'Sua localização'
    : stateInfo?.capital || stateInfo?.name

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className={`${alertColors[worstAlert].bg} text-white px-4 pt-12 pb-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="text-sm opacity-90">{locationName}</span>
          </div>
          <button
            onClick={() => setShowSearch(true)}
            className="p-2 bg-white/20 rounded-full"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>

        <div className="text-center">
          <div className="text-5xl font-light mb-1">{stats.avgTemp}°</div>
          <div className="text-sm opacity-80">
            {stateInfo?.name} • {weatherData.length} estações
          </div>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-around mt-6 pt-4 border-t border-white/20">
          <div className="text-center">
            <Droplets className="h-5 w-5 mx-auto mb-1 opacity-80" />
            <div className="text-lg font-semibold">{stats.avgHumidity}%</div>
            <div className="text-xs opacity-70">Umidade</div>
          </div>
          <div className="text-center">
            <Wind className="h-5 w-5 mx-auto mb-1 opacity-80" />
            <div className="text-lg font-semibold">{stats.totalRain24h}mm</div>
            <div className="text-xs opacity-70">Chuva 24h</div>
          </div>
          <div className="text-center">
            <AlertTriangle className="h-5 w-5 mx-auto mb-1 opacity-80" />
            <div className="text-lg font-semibold">{stats.alertCount}</div>
            <div className="text-xs opacity-70">Alertas</div>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="px-4 py-2 bg-white border-b flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Clock className="h-3 w-3" />
          {lastUpdate ? `Atualizado ${formatTimeAgo(lastUpdate)}` : 'Carregando...'}
        </div>
        <button
          onClick={refetchWeather}
          disabled={weatherLoading}
          className="p-1 text-gray-500"
        >
          <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4">
        {/* Alerts Section */}
        {stats.alertCount > 0 && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Alertas Ativos</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alertColors[worstAlert].light} ${alertColors[worstAlert].text}`}>
                {stats.alertCount}
              </span>
            </div>
            <div className="divide-y">
              {weatherData
                .filter(w => w.alertLevel !== 'normal')
                .slice(0, 3)
                .map(station => (
                  <button
                    key={station.stationId}
                    onClick={() => setSelectedStation(station)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${alertColors[station.alertLevel].bg}`} />
                      <div className="text-left">
                        <div className="font-medium text-gray-900 text-sm">{station.stationName}</div>
                        <div className="text-xs text-gray-500">
                          {station.rain.last1h}mm/1h • {station.temperature.current}°C
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Stations List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b">
            <h3 className="font-semibold text-gray-900">Estações</h3>
          </div>

          {weatherLoading ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="divide-y max-h-96 overflow-y-auto">
              {weatherData.slice(0, 10).map(station => (
                <button
                  key={station.stationId}
                  onClick={() => setSelectedStation(station)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${alertColors[station.alertLevel].bg}`} />
                    <div className="text-left">
                      <div className="font-medium text-gray-900 text-sm">{station.stationName}</div>
                      <div className="text-xs text-gray-500">
                        {station.rain.last1h}mm • {station.humidity.current}%
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">{station.temperature.current}°</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-white z-[3000]">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setShowSearch(false)} className="p-2">
                <X className="h-5 w-5" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                placeholder="Buscar cidade..."
                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={searchCity}
                disabled={searchLoading}
                className="p-2 bg-blue-500 text-white rounded-full"
              >
                {searchLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Search className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Results */}
            <div className="space-y-2">
              {searchResults.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCitySelect(city)}
                  className="w-full p-3 bg-gray-50 rounded-lg text-left hover:bg-gray-100"
                >
                  <div className="font-medium text-gray-900">{city.name}</div>
                  <div className="text-sm text-gray-500">{city.state}, {city.country}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Station Detail Modal */}
      {selectedStation && (
        <div className="fixed inset-0 bg-black/50 z-[3000]" onClick={() => setSelectedStation(null)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedStation.stationName}</h3>
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${alertColors[selectedStation.alertLevel].light} ${alertColors[selectedStation.alertLevel].text}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${alertColors[selectedStation.alertLevel].bg}`} />
                  {selectedStation.alertLevel === 'normal' ? 'Normal' :
                   selectedStation.alertLevel === 'attention' ? 'Atenção' :
                   selectedStation.alertLevel === 'alert' ? 'Alerta' : 'Severo'}
                </div>
              </div>
              <button onClick={() => setSelectedStation(null)} className="p-2">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Thermometer className="h-3 w-3" />
                  Temperatura
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedStation.temperature.current}°C
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-gray-500 text-xs mb-1">
                  <Droplets className="h-3 w-3" />
                  Umidade
                </div>
                <div className="text-2xl font-semibold text-gray-900">
                  {selectedStation.humidity.current}%
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-blue-600 text-xs mb-1">Chuva 1h</div>
                <div className="text-2xl font-semibold text-blue-700">
                  {selectedStation.rain.last1h}mm
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-3">
                <div className="text-blue-600 text-xs mb-1">Chuva 24h</div>
                <div className="text-2xl font-semibold text-blue-700">
                  {selectedStation.rain.last24h}mm
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
