'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import {
  Calendar,
  Thermometer,
  Droplets,
  Wind,
  Sun,
  CloudRain,
  Loader2,
  RefreshCw,
  MapPin,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'
import { useForecast, getWeatherInfo } from '@/hooks/useForecast'

const ForecastMap = dynamic(() => import('@/components/ForecastMap'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-100">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
})

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatShortDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

export default function Previsao16DiasPage() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [mapVariable, setMapVariable] = useState<'temperature' | 'precipitation' | 'wind'>('temperature')
  const [weekOffset, setWeekOffset] = useState<number>(0)

  const { data: forecastData, loading, error, refetch } = useForecast({
    days: 16,
    capital: selectedCapital
  })

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  if (loading && !forecastData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando previsao estendida...</p>
        </div>
      </div>
    )
  }

  if (error && !forecastData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <CloudRain className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Erro ao carregar previsao</p>
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

  const daily = forecastData?.daily || []
  const selectedDayData = daily[selectedDay]

  // Split into weeks for display
  const daysPerPage = 8
  const visibleDays = daily.slice(weekOffset * daysPerPage, (weekOffset + 1) * daysPerPage)
  const totalPages = Math.ceil(daily.length / daysPerPage)

  // Calculate weekly stats
  const avgTemp = daily.length > 0
    ? daily.reduce((sum, d) => sum + d.temperature_2m_mean, 0) / daily.length
    : 0
  const totalPrecip = daily.reduce((sum, d) => sum + d.precipitation_sum, 0)
  const maxTemp = Math.max(...daily.map(d => d.temperature_2m_max))
  const minTemp = Math.min(...daily.map(d => d.temperature_2m_min))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Previsao 16 Dias
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            <MapPin className="inline h-4 w-4 mr-1" />
            {capitalInfo.name}, {capitalInfo.stateCode} - Previsao estendida
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="h-5 w-5" />
            <span className="text-sm">Temp. Media</span>
          </div>
          <div className="text-3xl font-bold">{avgTemp.toFixed(1)}°C</div>
        </div>
        <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="h-5 w-5" />
            <span className="text-sm">Precipitacao Total</span>
          </div>
          <div className="text-3xl font-bold">{totalPrecip.toFixed(1)} mm</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-sm">Maxima</span>
          </div>
          <div className="text-3xl font-bold">{maxTemp.toFixed(0)}°C</div>
        </div>
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5" />
            <span className="text-sm">Minima</span>
          </div>
          <div className="text-3xl font-bold">{minTemp.toFixed(0)}°C</div>
        </div>
      </div>

      {/* Days navigation */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
            disabled={weekOffset === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="font-medium text-gray-700">
            {weekOffset === 0 ? 'Proximos 8 dias' : 'Dias 9-16'}
          </span>
          <button
            onClick={() => setWeekOffset(Math.min(totalPages - 1, weekOffset + 1))}
            disabled={weekOffset >= totalPages - 1}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {visibleDays.map((day, index) => {
            const actualIndex = weekOffset * daysPerPage + index
            const weather = getWeatherInfo(day.weather_code)
            const isSelected = selectedDay === actualIndex
            const isToday = actualIndex === 0

            return (
              <button
                key={day.date}
                onClick={() => setSelectedDay(actualIndex)}
                className={`p-2 md:p-3 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                    : 'bg-white border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className={`text-[10px] md:text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {isToday ? 'Hoje' : formatShortDate(day.date)}
                </div>
                <div className="text-xl md:text-2xl my-1">{weather.icon}</div>
                <div className={`flex items-center justify-center gap-1 text-[10px] md:text-xs ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                  <span className="text-blue-400">{Math.round(day.temperature_2m_min)}°</span>
                  <span>/</span>
                  <span className="text-orange-400">{Math.round(day.temperature_2m_max)}°</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Selected day details */}
        {selectedDayData && (
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {formatDate(selectedDayData.date)}
                </h2>
                <p className="text-gray-500">{getWeatherInfo(selectedDayData.weather_code).description}</p>
              </div>
              <div className="text-5xl">{getWeatherInfo(selectedDayData.weather_code).icon}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Thermometer className="h-4 w-4" />
                  <span className="text-sm">Temperatura</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-blue-600 font-medium">{Math.round(selectedDayData.temperature_2m_min)}°</span>
                    <span className="text-gray-400 mx-1">/</span>
                    <span className="text-orange-600 font-medium">{Math.round(selectedDayData.temperature_2m_max)}°</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Math.round(selectedDayData.temperature_2m_mean)}°
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Droplets className="h-4 w-4" />
                  <span className="text-sm">Precipitacao</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {selectedDayData.precipitation_sum.toFixed(1)} mm
                </div>
                <div className="text-sm text-gray-500">
                  {selectedDayData.precipitation_probability_max}% chance
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Wind className="h-4 w-4" />
                  <span className="text-sm">Vento Max</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">
                  {Math.round(selectedDayData.wind_speed_10m_max)} km/h
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Indice UV</span>
                </div>
                <div className="text-2xl font-bold">
                  <span className={`${
                    selectedDayData.uv_index_max >= 8 ? 'text-red-600' :
                    selectedDayData.uv_index_max >= 6 ? 'text-orange-600' :
                    selectedDayData.uv_index_max >= 3 ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {selectedDayData.uv_index_max.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Map */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Mapa</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapVariable('temperature')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    mapVariable === 'temperature'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Temp
                </button>
                <button
                  onClick={() => setMapVariable('precipitation')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    mapVariable === 'precipitation'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Chuva
                </button>
                <button
                  onClick={() => setMapVariable('wind')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    mapVariable === 'wind'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Vento
                </button>
              </div>
            </div>
          </div>
          <div className="h-[350px]">
            <ForecastMap
              latitude={capitalInfo.latitude}
              longitude={capitalInfo.longitude}
              forecastData={forecastData}
              selectedDay={selectedDay}
              mapVariable={mapVariable}
            />
          </div>
        </div>
      </div>

      {/* Full 16-day table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Resumo Completo - 16 Dias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condicao</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min/Max</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chuva</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prob.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {daily.map((day, index) => {
                const weather = getWeatherInfo(day.weather_code)
                return (
                  <tr
                    key={day.date}
                    className={`hover:bg-gray-50 cursor-pointer ${selectedDay === index ? 'bg-blue-50' : ''}`}
                    onClick={() => setSelectedDay(index)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatDate(day.date)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">{weather.icon}</span>
                        <span className="text-sm text-gray-600 hidden md:inline">{weather.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-blue-600">{Math.round(day.temperature_2m_min)}°</span>
                      <span className="text-gray-400 mx-1">/</span>
                      <span className="text-orange-600">{Math.round(day.temperature_2m_max)}°</span>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-500">
                      {day.precipitation_sum.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{ width: `${day.precipitation_probability_max}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">{day.precipitation_probability_max}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {Math.round(day.wind_speed_10m_max)} km/h
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Dados: Open-Meteo API | Previsao estendida pode ter menor precisao apos 7 dias
      </div>
    </div>
  )
}
