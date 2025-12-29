'use client'

import { useState, useCallback } from 'react'
import {
  Search,
  MapPin,
  Loader2,
  X,
  Droplets,
  Thermometer,
  Wind,
  CloudRain
} from 'lucide-react'

interface GeoResult {
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
  population: number
  elevation: number
}

interface WeatherResult {
  temperature: number
  humidity: number
  windSpeed: number
  rain: number
  rain1h: number
  rain24h: number
}

interface CitySearchProps {
  onLocationSelect?: (location: GeoResult, weather: WeatherResult) => void
}

export default function CitySearch({ onLocationSelect }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<GeoResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<GeoResult | null>(null)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const searchCity = useCallback(async () => {
    if (!query.trim()) return

    setLoading(true)
    setError(null)
    setShowResults(true)

    try {
      const response = await fetch(`/api/geocode?city=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (data.results) {
        setResults(data.results)
      } else {
        setResults([])
        setError(data.error || 'Cidade não encontrada')
      }
    } catch (err) {
      setError('Erro ao buscar cidade')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query])

  const selectLocation = async (location: GeoResult) => {
    setSelectedLocation(location)
    setShowResults(false)
    setWeatherLoading(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/weather?lat=${location.latitude}&lng=${location.longitude}`
      )
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const w = data.data[0]
        const weatherData: WeatherResult = {
          temperature: w.temperature.current,
          humidity: w.humidity.current,
          windSpeed: w.wind.speed,
          rain: w.rain.current,
          rain1h: w.rain.last1h,
          rain24h: w.rain.last24h,
        }
        setWeather(weatherData)
        onLocationSelect?.(location, weatherData)
      } else {
        setError('Dados meteorológicos não disponíveis')
      }
    } catch (err) {
      setError('Erro ao buscar dados meteorológicos')
    } finally {
      setWeatherLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedLocation(null)
    setWeather(null)
    setQuery('')
    setResults([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchCity()
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="p-3 border-b bg-gray-50">
        <h3 className="font-semibold text-gray-900">Buscar Cidade</h3>
        <p className="text-xs text-gray-500">Digite o nome da cidade para ver o clima</p>
      </div>

      <div className="p-4">
        {/* Campo de busca */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Ex: Campinas, SP"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={searchCity}
              disabled={loading || !query.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
              Buscar
            </button>
          </div>

          {/* Resultados da busca */}
          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1003] max-h-60 overflow-auto">
              {results.map((result, i) => (
                <button
                  key={i}
                  onClick={() => selectLocation(result)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{result.name}</p>
                    <p className="text-xs text-gray-500">
                      {result.state && `${result.state}, `}Brasil
                      {result.population > 0 && ` • ${(result.population / 1000).toFixed(0)}k hab.`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showResults && results.length === 0 && !loading && query && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-[1003] p-4 text-center text-gray-500">
              <p className="text-sm">Nenhuma cidade encontrada</p>
            </div>
          )}
        </div>

        {/* Erro */}
        {error && !showResults && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Localização selecionada */}
        {selectedLocation && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">{selectedLocation.name}</h4>
                  <p className="text-xs text-gray-500">
                    {selectedLocation.state && `${selectedLocation.state}, `}Brasil
                  </p>
                </div>
              </div>
              <button
                onClick={clearSelection}
                className="p-1 hover:bg-gray-100 rounded"
                title="Limpar"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Dados do clima */}
            {weatherLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="ml-2 text-gray-500">Carregando clima...</span>
              </div>
            ) : weather ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-orange-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="w-4 h-4 text-orange-500" />
                    <span className="text-xs text-gray-600">Temperatura</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-700">{weather.temperature}°C</p>
                </div>

                <div className="bg-cyan-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="w-4 h-4 text-cyan-500" />
                    <span className="text-xs text-gray-600">Umidade</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-700">{weather.humidity}%</p>
                </div>

                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CloudRain className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-gray-600">Chuva 1h</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{weather.rain1h} mm</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">Vento</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-700">{weather.windSpeed} km/h</p>
                </div>

                <div className="col-span-2 bg-indigo-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <CloudRain className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs text-gray-600">Acumulado 24h</span>
                  </div>
                  <p className="text-2xl font-bold text-indigo-700">{weather.rain24h} mm</p>
                </div>
              </div>
            ) : null}

            {/* Coordenadas */}
            <div className="mt-3 text-xs text-gray-400 text-center">
              Lat: {selectedLocation.latitude.toFixed(4)} | Lng: {selectedLocation.longitude.toFixed(4)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
