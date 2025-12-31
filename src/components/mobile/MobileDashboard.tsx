'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWeather, useAlerts, formatTimeAgo } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Loader2,
  MapPin,
  Search,
  X,
  ChevronRight,
  CloudRain
} from 'lucide-react'
import type { StateCode, WeatherData } from '@/types/weather'
import { BRAZILIAN_STATES, BRAZILIAN_CAPITALS } from '@/types/weather'

const alertColors = {
  normal: { bg: 'bg-green-500', text: 'text-green-700', light: 'bg-green-50', border: 'border-green-200' },
  attention: { bg: 'bg-yellow-500', text: 'text-yellow-700', light: 'bg-yellow-50', border: 'border-yellow-200' },
  alert: { bg: 'bg-orange-500', text: 'text-orange-700', light: 'bg-orange-50', border: 'border-orange-200' },
  severe: { bg: 'bg-red-500', text: 'text-red-700', light: 'bg-red-50', border: 'border-red-200' },
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
    setSearchQuery('')
    setSearchResults([])
  }

  const clearCity = () => {
    setSelectedCity(null)
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

  const getWorstAlert = () => {
    if (weatherData.some(w => w.alertLevel === 'severe')) return 'severe'
    if (weatherData.some(w => w.alertLevel === 'alert')) return 'alert'
    if (weatherData.some(w => w.alertLevel === 'attention')) return 'attention'
    return 'normal'
  }

  const worstAlert = getWorstAlert()

  const locationName = selectedCity
    ? `${selectedCity.name}`
    : geolocation.latitude
    ? 'Sua localização'
    : stateInfo?.capital || stateInfo?.name

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header com busca */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                placeholder="Buscar cidade..."
                className="w-full pl-9 pr-10 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults([]) }}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
            <button
              onClick={searchCity}
              disabled={searchLoading || !searchQuery.trim()}
              className="px-4 py-2.5 bg-blue-500 text-white rounded-full text-sm font-medium disabled:opacity-50"
            >
              {searchLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Buscar'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
              {searchResults.map((city, idx) => (
                <button
                  key={idx}
                  onClick={() => handleCitySelect(city)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{city.name}</div>
                  <div className="text-xs text-gray-500">{city.state}, {city.country}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Location indicator */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium text-gray-700">{locationName}</span>
            {selectedCity && (
              <button onClick={clearCity} className="text-gray-400">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <button
            onClick={refetchWeather}
            disabled={weatherLoading}
            className="p-1.5 text-gray-500"
          >
            <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {weatherLoading && weatherData.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Main Stats Card */}
          <div className={`rounded-2xl p-5 text-white ${alertColors[worstAlert].bg}`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-5xl font-light">{stats.avgTemp}°</div>
                <div className="text-sm opacity-80 mt-1">{stateInfo?.name}</div>
              </div>
              <div className="text-right">
                <CloudRain className="h-10 w-10 opacity-80" />
                <div className="text-sm mt-1">{weatherData.length} estações</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-white/20">
              <div className="text-center">
                <Droplets className="h-5 w-5 mx-auto opacity-80" />
                <div className="text-lg font-semibold mt-1">{stats.avgHumidity}%</div>
                <div className="text-xs opacity-70">Umidade</div>
              </div>
              <div className="text-center">
                <CloudRain className="h-5 w-5 mx-auto opacity-80" />
                <div className="text-lg font-semibold mt-1">{stats.totalRain24h}mm</div>
                <div className="text-xs opacity-70">Chuva 24h</div>
              </div>
              <div className="text-center">
                <AlertTriangle className="h-5 w-5 mx-auto opacity-80" />
                <div className="text-lg font-semibold mt-1">{stats.alertCount}</div>
                <div className="text-xs opacity-70">Alertas</div>
              </div>
            </div>
          </div>

          {/* Last update */}
          {lastUpdate && (
            <div className="text-center text-xs text-gray-500">
              Atualizado {formatTimeAgo(lastUpdate)}
            </div>
          )}

          {/* Alerts Section */}
          {stats.alertCount > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Alertas Ativos</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${alertColors[worstAlert].light} ${alertColors[worstAlert].text}`}>
                  {stats.alertCount}
                </span>
              </div>
              <div>
                {weatherData
                  .filter(w => w.alertLevel !== 'normal')
                  .slice(0, 5)
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

          {/* Stations List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Todas as Estações</h3>
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
                      <div className="text-xs text-gray-500">
                        <Droplets className="inline h-3 w-3 mr-0.5" />
                        {station.humidity.current}% -
                        <CloudRain className="inline h-3 w-3 mx-0.5" />
                        {station.rain.last1h}mm
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-gray-900">{station.temperature.current}°</div>
                  </div>
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
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[70vh] overflow-auto"
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
                <button
                  onClick={() => setSelectedStation(null)}
                  className="p-2 -mr-2 text-gray-400"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            <div className="px-4 pb-8">
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-orange-50 rounded-xl p-4">
                  <Thermometer className="h-5 w-5 text-orange-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedStation.temperature.current}°C
                  </div>
                  <div className="text-xs text-gray-500">Temperatura</div>
                </div>

                <div className="bg-cyan-50 rounded-xl p-4">
                  <Droplets className="h-5 w-5 text-cyan-500 mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {selectedStation.humidity.current}%
                  </div>
                  <div className="text-xs text-gray-500">Umidade</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <CloudRain className="h-5 w-5 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedStation.rain.last1h}mm
                  </div>
                  <div className="text-xs text-gray-500">Chuva 1h</div>
                </div>

                <div className="bg-blue-50 rounded-xl p-4">
                  <CloudRain className="h-5 w-5 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold text-blue-700">
                    {selectedStation.rain.last24h}mm
                  </div>
                  <div className="text-xs text-gray-500">Chuva 24h</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                <div className="text-xs text-gray-500">
                  Última atualização: {formatTimeAgo(selectedStation.timestamp)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
