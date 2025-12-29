'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useWeather, useAlerts, formatTimeAgo } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import StateSelector from './StateSelector'
import WeatherMapDynamic from './WeatherMapDynamic'
import ForecastMapsDynamic from './ForecastMapsDynamic'
import {
  Droplets,
  Thermometer,
  AlertTriangle,
  RefreshCw,
  Clock,
  TrendingUp,
  Loader2,
  MapPin,
  Navigation,
  Search,
  X,
  Wind,
  CloudRain
} from 'lucide-react'
import type { StateCode, WeatherData } from '@/types/weather'
import { BRAZILIAN_STATES, BRAZILIAN_CAPITALS } from '@/types/weather'

const alertColors = {
  normal: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  attention: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  alert: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' },
  severe: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
}

const statusColors = {
  online: 'text-green-500',
  delayed: 'text-yellow-500',
  offline: 'text-red-500',
}

// Mapeamento de nome do estado para código
const STATE_NAME_TO_CODE: Record<string, StateCode> = {
  'Acre': 'AC', 'Alagoas': 'AL', 'Amapá': 'AP', 'Amazonas': 'AM',
  'Bahia': 'BA', 'Ceará': 'CE', 'Distrito Federal': 'DF', 'Espírito Santo': 'ES',
  'Goiás': 'GO', 'Maranhão': 'MA', 'Mato Grosso': 'MT', 'Mato Grosso do Sul': 'MS',
  'Minas Gerais': 'MG', 'Pará': 'PA', 'Paraíba': 'PB', 'Paraná': 'PR',
  'Pernambuco': 'PE', 'Piauí': 'PI', 'Rio de Janeiro': 'RJ', 'Rio Grande do Norte': 'RN',
  'Rio Grande do Sul': 'RS', 'Rondônia': 'RO', 'Roraima': 'RR', 'Santa Catarina': 'SC',
  'São Paulo': 'SP', 'Sergipe': 'SE', 'Tocantins': 'TO',
}

// Função para calcular distância entre dois pontos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Raio da Terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

interface GeoResult {
  name: string
  state: string
  country: string
  latitude: number
  longitude: number
  population: number
  elevation: number
}

interface SearchedWeather {
  temperature: number
  humidity: number
  windSpeed: number
  rain: number
  rain1h: number
  rain24h: number
}

interface StationWithDistance extends WeatherData {
  distance: number
}

export default function WeatherDashboard() {
  const geolocation = useGeolocation()
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [selectedStation, setSelectedStation] = useState<string | null>(null)

  // City search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [selectedCity, setSelectedCity] = useState<GeoResult | null>(null)
  const [cityWeather, setCityWeather] = useState<SearchedWeather | null>(null)
  const [cityWeatherLoading, setCityWeatherLoading] = useState(false)

  // Usar estado detectado pela geolocalização quando disponível
  useEffect(() => {
    if (!selectedState && geolocation.state && !geolocation.loading) {
      setSelectedState(geolocation.state)
    }
  }, [geolocation.state, geolocation.loading, selectedState])

  // Estado efetivo (selecionado ou detectado ou default)
  const effectiveState = selectedState || geolocation.state || 'SP'

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    lastUpdate,
    refetch: refetchWeather
  } = useWeather({ refreshInterval: 5 * 60 * 1000, state: effectiveState })

  const {
    data: alertsData,
    refetch: refetchAlerts
  } = useAlerts({ refreshInterval: 10 * 60 * 1000 })

  const handleRefresh = () => {
    refetchWeather()
    refetchAlerts()
  }

  const stateInfo = BRAZILIAN_STATES[effectiveState]

  // Encontrar coordenadas da capital do estado
  const capitalEntry = Object.values(BRAZILIAN_CAPITALS).find(
    cap => cap.stateCode === effectiveState
  )
  const defaultCoords = capitalEntry
    ? { lat: capitalEntry.latitude, lng: capitalEntry.longitude }
    : { lat: -15.7801, lng: -47.9292 }

  // Coordenadas efetivas (cidade buscada ou capital do estado)
  const effectiveCoords = selectedCity
    ? { lat: selectedCity.latitude, lng: selectedCity.longitude }
    : defaultCoords

  // Nome da localização atual
  const locationName = selectedCity
    ? `${selectedCity.name}, ${selectedCity.state}`
    : capitalEntry?.name || stateInfo?.capital || stateInfo?.name

  // Buscar cidade
  const searchCity = useCallback(async () => {
    if (!searchQuery.trim()) return

    setSearchLoading(true)
    setShowSearchResults(true)

    try {
      const response = await fetch(`/api/geocode?city=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()

      if (data.results) {
        setSearchResults(data.results)
      } else {
        setSearchResults([])
      }
    } catch (err) {
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }, [searchQuery])

  // Selecionar cidade da busca
  const selectCity = async (location: GeoResult) => {
    setSelectedCity(location)
    setShowSearchResults(false)
    setCityWeatherLoading(true)

    // Trocar automaticamente para o estado da cidade selecionada
    const cityStateCode = STATE_NAME_TO_CODE[location.state]
    if (cityStateCode && cityStateCode !== selectedState) {
      setSelectedState(cityStateCode)
    }

    try {
      const response = await fetch(
        `/api/weather?lat=${location.latitude}&lng=${location.longitude}`
      )
      const data = await response.json()

      if (data.data && data.data.length > 0) {
        const w = data.data[0]
        setCityWeather({
          temperature: w.temperature.current,
          humidity: w.humidity.current,
          windSpeed: w.wind.speed,
          rain: w.rain.current,
          rain1h: w.rain.last1h,
          rain24h: w.rain.last24h,
        })
      }
    } catch (err) {
      console.error('Error fetching city weather:', err)
    } finally {
      setCityWeatherLoading(false)
    }
  }

  // Limpar seleção de cidade
  const clearCitySelection = () => {
    setSelectedCity(null)
    setCityWeather(null)
    setSearchQuery('')
    setSearchResults([])
  }

  // Handler para seleção de estado
  const handleStateSelect = (state: StateCode) => {
    setSelectedState(state)
    clearCitySelection() // Limpa a cidade quando muda o estado
  }

  // Calcular estatísticas gerais
  const stats = {
    avgRain: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.rain.current, 0) / weatherData.length
      : 0,
    maxRain1h: weatherData.length > 0
      ? Math.max(...weatherData.map(w => w.rain.last1h))
      : 0,
    maxRain24h: weatherData.length > 0
      ? Math.max(...weatherData.map(w => w.rain.last24h))
      : 0,
    avgTemp: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.temperature.current, 0) / weatherData.length
      : 0,
  }

  // Calcular estações com distância e ordenar por proximidade
  const NEARBY_RADIUS_KM = 150 // Raio para considerar estações próximas

  const stationsWithDistance = useMemo((): StationWithDistance[] => {
    return weatherData.map(station => ({
      ...station,
      distance: calculateDistance(
        effectiveCoords.lat,
        effectiveCoords.lng,
        station.coordinates.lat,
        station.coordinates.lng
      )
    })).sort((a, b) => a.distance - b.distance)
  }, [weatherData, effectiveCoords.lat, effectiveCoords.lng])

  // Estações filtradas: quando cidade selecionada, mostrar apenas próximas
  const displayedStations = useMemo(() => {
    if (selectedCity) {
      // Quando cidade selecionada, mostrar estações próximas (até 150km)
      const nearby = stationsWithDistance.filter(s => s.distance <= NEARBY_RADIUS_KM)
      // Se não houver estações próximas, mostrar as 5 mais próximas
      return nearby.length > 0 ? nearby : stationsWithDistance.slice(0, 5)
    }
    // Sem cidade selecionada, mostrar todas ordenadas por distância da capital
    return stationsWithDistance
  }, [stationsWithDistance, selectedCity])

  // Loading inicial (geolocalização + dados)
  if (geolocation.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Navigation className="h-8 w-8 text-blue-500 mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500">Detectando sua localização...</p>
        </div>
      </div>
    )
  }

  if (weatherLoading && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando dados de {stateInfo?.name || effectiveState}...</p>
        </div>
      </div>
    )
  }

  if (weatherError && weatherData.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
        <p className="text-red-700 font-medium">Erro ao carregar dados</p>
        <p className="text-red-600 text-sm">{weatherError}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Situação Meteorológica
            </h1>
            <StateSelector
              selectedState={effectiveState}
              onSelect={handleStateSelect}
              loading={weatherLoading}
            />
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Atualização: {lastUpdate ? formatTimeAgo(lastUpdate) : 'N/A'}
            </span>
            {geolocation.state === effectiveState && !selectedState && (
              <span className="flex items-center gap-1 text-blue-600">
                <Navigation className="h-3 w-3" />
                Localização detectada
              </span>
            )}
            {weatherLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-600">Open-Meteo</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={weatherLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Status do Estado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          stats.avgRain > 5 ? 'border-orange-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Chuva Média</span>
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.avgRain.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">mm/h</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {weatherData.length} estações em {stateInfo?.name}
          </p>
        </div>

        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          stats.maxRain1h >= 30 ? 'border-red-500' :
          stats.maxRain1h >= 10 ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Máx. 1 hora</span>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.maxRain1h.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">mm</span>
          </div>
        </div>

        <div className="rounded-xl border-l-4 p-4 bg-white shadow-sm border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Temperatura Média</span>
            <Thermometer className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.avgTemp.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">°C</span>
          </div>
        </div>

        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          weatherData.filter(w => w.alertLevel === 'severe').length > 0 ? 'border-red-500' :
          weatherData.filter(w => w.alertLevel === 'alert').length > 0 ? 'border-orange-500' :
          weatherData.filter(w => w.alertLevel === 'attention').length > 0 ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Estações em Alerta</span>
            <AlertTriangle className={`h-5 w-5 ${
              weatherData.filter(w => w.alertLevel === 'severe').length > 0 ? 'text-red-500' : 'text-yellow-500'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {weatherData.filter(w => w.alertLevel !== 'normal').length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {weatherData.filter(w => w.alertLevel === 'severe').length} severos,{' '}
            {weatherData.filter(w => w.alertLevel === 'alert').length} alertas
          </p>
        </div>
      </div>

      {/* Busca de Cidade e Mapas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda: Busca + Dados da Cidade */}
        <div className="space-y-4">
          {/* Busca de Cidade */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-blue-500" />
              Buscar Cidade
            </h3>

            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Ex: Campinas, SP"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchCity()}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <button
                  onClick={searchCity}
                  disabled={searchLoading || !searchQuery.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Buscar
                </button>
              </div>

              {/* Resultados da busca */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-auto">
                  {searchResults.map((result, i) => (
                    <button
                      key={i}
                      onClick={() => selectCity(result)}
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
            </div>

            {/* Cidade Selecionada */}
            {selectedCity && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    <div>
                      <h4 className="font-semibold text-gray-900">{selectedCity.name}</h4>
                      <p className="text-xs text-gray-500">{selectedCity.state}, Brasil</p>
                    </div>
                  </div>
                  <button
                    onClick={clearCitySelection}
                    className="p-1 hover:bg-blue-100 rounded"
                    title="Limpar"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                {cityWeatherLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="ml-2 text-sm text-gray-500">Carregando...</span>
                  </div>
                ) : cityWeather && (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2 text-center">
                      <Thermometer className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{cityWeather.temperature}°C</p>
                      <p className="text-xs text-gray-500">Temperatura</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <Droplets className="w-4 h-4 text-cyan-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{cityWeather.humidity}%</p>
                      <p className="text-xs text-gray-500">Umidade</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <CloudRain className="w-4 h-4 text-blue-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{cityWeather.rain1h} mm</p>
                      <p className="text-xs text-gray-500">Chuva 1h</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-center">
                      <Wind className="w-4 h-4 text-gray-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-gray-900">{cityWeather.windSpeed} km/h</p>
                      <p className="text-xs text-gray-500">Vento</p>
                    </div>
                  </div>
                )}

                <div className="mt-2 text-xs text-gray-400 text-center">
                  Lat: {selectedCity.latitude.toFixed(4)} | Lng: {selectedCity.longitude.toFixed(4)}
                </div>
              </div>
            )}

            {/* Localização Atual (quando não tem cidade selecionada) */}
            {!selectedCity && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>Mostrando dados de: <strong>{locationName}</strong></span>
                </div>
              </div>
            )}
          </div>

          {/* Mapa das Estações */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                Mapa das Estações - {selectedCity ? selectedCity.name : stateInfo?.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedCity
                  ? `${displayedStations.length} estações próximas`
                  : `${weatherData.length} estações INMET`}
              </p>
            </div>
            <div className="h-[300px]">
              <WeatherMapDynamic
                stations={displayedStations}
                selectedStation={selectedStation}
                onStationSelect={setSelectedStation}
                center={[effectiveCoords.lat, effectiveCoords.lng]}
                zoom={selectedCity ? 10 : 7}
                className="h-full"
              />
            </div>
          </div>
        </div>

        {/* Coluna Direita: Mapa de Previsão */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="font-semibold text-gray-900">Mapas de Previsão - {locationName}</h3>
            <p className="text-xs text-gray-500">Radar e camadas meteorológicas em tempo real</p>
          </div>
          <div className="p-4">
            <ForecastMapsDynamic
              latitude={effectiveCoords.lat}
              longitude={effectiveCoords.lng}
            />
          </div>
        </div>
      </div>

      {/* Lista de estações */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {selectedCity
                ? `Estações Próximas de ${selectedCity.name}`
                : `Estações Monitoradas em ${stateInfo?.name}`}
            </h2>
            <p className="text-sm text-gray-500">
              {selectedCity
                ? `${displayedStations.length} estações dentro de ${NEARBY_RADIUS_KM}km (de ${weatherData.length} no estado)`
                : `${weatherData.length} estações ordenadas por proximidade`}
            </p>
          </div>
          {selectedCity && displayedStations.length < weatherData.length && (
            <button
              onClick={clearCitySelection}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Ver todas
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Estação</th>
                <th className="pb-3 font-medium text-center">Distância</th>
                <th className="pb-3 font-medium text-center">Agora</th>
                <th className="pb-3 font-medium text-center">1h</th>
                <th className="pb-3 font-medium text-center">24h</th>
                <th className="pb-3 font-medium text-center">Temp</th>
                <th className="pb-3 font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayedStations.map((station) => {
                const colors = alertColors[station.alertLevel]

                return (
                  <tr
                    key={station.stationId}
                    className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      selectedStation === station.stationId ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => setSelectedStation(station.stationId)}
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.border} border`} />
                        <div>
                          <p className="font-medium text-gray-900">{station.stationName}</p>
                          <p className="text-xs text-gray-400">{station.stationId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-sm font-medium ${
                        station.distance <= 50 ? 'text-green-600' :
                        station.distance <= 100 ? 'text-blue-600' :
                        'text-gray-600'
                      }`}>
                        {station.distance.toFixed(0)} km
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-semibold">{station.rain.current}</span>
                      <span className="text-gray-400 text-sm"> mm/h</span>
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.rain.last1h} mm
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.rain.last24h} mm
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.temperature.current}°C
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {station.alertLevel === 'normal' ? 'Normal' :
                         station.alertLevel === 'attention' ? 'Atenção' :
                         station.alertLevel === 'alert' ? 'Alerta' : 'Severo'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {displayedStations.length === 0 && !weatherLoading && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <p>Nenhuma estação encontrada {selectedCity ? `próxima de ${selectedCity.name}` : `em ${stateInfo?.name}`}</p>
          </div>
        )}
      </div>

      {/* Alertas */}
      {alertsData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas Ativos
          </h2>
          <div className="space-y-3">
            {alertsData.slice(0, 5).map((alert) => {
              const colors = alertColors[alert.level]
              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${colors.text}`}>
                          {alert.region}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.startTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">Fonte: {alert.source}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
