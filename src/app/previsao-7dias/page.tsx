'use client'

import { useState, useEffect, useRef } from 'react'
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
  Sunrise,
  Sunset,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'
import { useForecast, getWeatherInfo } from '@/hooks/useForecast'

// Dynamic import for Leaflet map
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

function formatTime(timeStr: string): string {
  return new Date(timeStr).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function Previsao7DiasPage() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')
  const [selectedDay, setSelectedDay] = useState<number>(0)
  const [mapVariable, setMapVariable] = useState<'temperature' | 'precipitation' | 'wind'>('temperature')

  const { data: forecastData, loading, error, refetch } = useForecast({
    days: 7,
    capital: selectedCapital
  })

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  if (loading && !forecastData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando previsao de {capitalInfo.name}...</p>
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
  const hourly = forecastData?.hourly || []
  const selectedDayData = daily[selectedDay]

  // Filter hourly data for selected day
  const dayHourly = hourly.filter(h => h.time.startsWith(selectedDayData?.date || ''))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Previsao 7 Dias
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            <MapPin className="inline h-4 w-4 mr-1" />
            {capitalInfo.name}, {capitalInfo.stateCode}
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

      {/* Days selector */}
      <div className="grid grid-cols-7 gap-2">
        {daily.map((day, index) => {
          const weather = getWeatherInfo(day.weather_code)
          const isSelected = selectedDay === index
          const isToday = index === 0

          return (
            <button
              key={day.date}
              onClick={() => setSelectedDay(index)}
              className={`p-3 rounded-xl border transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white border-blue-600 shadow-lg'
                  : 'bg-white border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className={`text-xs font-medium ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                {isToday ? 'Hoje' : formatDate(day.date).split(',')[0]}
              </div>
              <div className={`text-sm font-semibold ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                {new Date(day.date).getDate()}
              </div>
              <div className="text-2xl my-1">{weather.icon}</div>
              <div className={`flex items-center justify-center gap-1 text-xs ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                <span className="text-blue-400">{Math.round(day.temperature_2m_min)}°</span>
                <span>/</span>
                <span className="text-orange-400">{Math.round(day.temperature_2m_max)}°</span>
              </div>
              {day.precipitation_probability_max > 0 && (
                <div className={`text-xs flex items-center justify-center gap-0.5 mt-1 ${isSelected ? 'text-blue-200' : 'text-blue-500'}`}>
                  <Droplets className="h-3 w-3" />
                  {day.precipitation_probability_max}%
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Day details */}
        <div className="space-y-4">
          {/* Selected day summary */}
          {selectedDayData && (
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold">
                    {formatDate(selectedDayData.date)}
                  </h2>
                  <p className="text-blue-100">{getWeatherInfo(selectedDayData.weather_code).description}</p>
                </div>
                <div className="text-5xl">{getWeatherInfo(selectedDayData.weather_code).icon}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Thermometer className="h-4 w-4" />
                    <span className="text-sm">Temperatura</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-4 w-4 text-blue-200" />
                      <span className="text-xl font-bold">{Math.round(selectedDayData.temperature_2m_min)}°</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-orange-200" />
                      <span className="text-xl font-bold">{Math.round(selectedDayData.temperature_2m_max)}°</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Droplets className="h-4 w-4" />
                    <span className="text-sm">Precipitacao</span>
                  </div>
                  <div className="text-xl font-bold">{selectedDayData.precipitation_sum.toFixed(1)} mm</div>
                  <div className="text-sm text-blue-100">{selectedDayData.precipitation_probability_max}% chance</div>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Wind className="h-4 w-4" />
                    <span className="text-sm">Vento</span>
                  </div>
                  <div className="text-xl font-bold">{Math.round(selectedDayData.wind_speed_10m_max)} km/h</div>
                </div>

                <div className="bg-white/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sun className="h-4 w-4" />
                    <span className="text-sm">UV Index</span>
                  </div>
                  <div className="text-xl font-bold">{selectedDayData.uv_index_max.toFixed(1)}</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                <div className="flex items-center gap-2">
                  <Sunrise className="h-5 w-5 text-yellow-300" />
                  <span>{formatTime(selectedDayData.sunrise)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sunset className="h-5 w-5 text-orange-300" />
                  <span>{formatTime(selectedDayData.sunset)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Hourly forecast */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Previsao Horaria</h3>
            <div className="overflow-x-auto">
              <div className="flex gap-3 min-w-max pb-2">
                {dayHourly.map((hour, i) => {
                  const weather = getWeatherInfo(hour.weather_code)
                  return (
                    <div key={hour.time} className="text-center min-w-[60px]">
                      <div className="text-xs text-gray-500">{formatTime(hour.time)}</div>
                      <div className="text-xl my-1">{weather.icon}</div>
                      <div className="text-sm font-semibold">{Math.round(hour.temperature_2m)}°</div>
                      {hour.precipitation > 0 && (
                        <div className="text-xs text-blue-500">{hour.precipitation.toFixed(1)}mm</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 7-day precipitation chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Droplets className="h-5 w-5 text-blue-500" />
              Precipitacao 7 Dias
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Total: <strong className="text-blue-600">{daily.reduce((sum, d) => sum + d.precipitation_sum, 0).toFixed(1)} mm</strong></span>
                <span>Dias com chuva: <strong>{daily.filter(d => d.precipitation_sum > 0).length}</strong></span>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-end gap-2 h-28">
                  {daily.map((day, i) => {
                    const maxPrecip = Math.max(...daily.map(d => d.precipitation_sum)) || 1
                    const heightPct = (day.precipitation_sum / maxPrecip) * 100
                    const barHeight = day.precipitation_sum > 0 ? Math.max(heightPct, 10) : 0
                    return (
                      <div key={day.date} className="flex-1 flex flex-col items-center h-full">
                        <div className="flex-1 w-full flex items-end justify-center">
                          <div
                            className="w-full max-w-[40px] bg-blue-500 rounded-t transition-all hover:bg-blue-600 cursor-pointer"
                            style={{ height: `${barHeight}%`, minHeight: day.precipitation_sum > 0 ? '8px' : '0' }}
                            title={`${day.precipitation_sum.toFixed(1)} mm`}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-2 mt-2 border-t border-gray-200 pt-2">
                  {daily.map((day) => (
                    <div key={day.date} className="flex-1 text-center">
                      <div className="text-[10px] text-gray-500">{new Date(day.date).getDate()}/{new Date(day.date).getMonth() + 1}</div>
                      <div className="text-xs font-semibold text-blue-600">{day.precipitation_sum.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Map */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Mapa de Previsao</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setMapVariable('temperature')}
                  className={`px-3 py-1 text-xs rounded-full ${
                    mapVariable === 'temperature'
                      ? 'bg-orange-100 text-orange-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  Temperatura
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
          <div className="h-[400px]">
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

      {/* 7-day summary table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Resumo 7 Dias</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dia</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condicao</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Min</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Max</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Chuva</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Prob.</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vento</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">UV</th>
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
                        <span className="text-sm text-gray-600">{weather.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-medium">
                      {Math.round(day.temperature_2m_min)}°C
                    </td>
                    <td className="px-4 py-3 text-center text-orange-600 font-medium">
                      {Math.round(day.temperature_2m_max)}°C
                    </td>
                    <td className="px-4 py-3 text-center text-blue-500">
                      {day.precipitation_sum.toFixed(1)} mm
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Droplets className="h-4 w-4 text-blue-400" />
                        <span>{day.precipitation_probability_max}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {Math.round(day.wind_speed_10m_max)} km/h
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        day.uv_index_max >= 8 ? 'bg-red-100 text-red-700' :
                        day.uv_index_max >= 6 ? 'bg-orange-100 text-orange-700' :
                        day.uv_index_max >= 3 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {day.uv_index_max.toFixed(1)}
                      </span>
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
        Dados: Open-Meteo API | Atualizacao: a cada 30 minutos
      </div>
    </div>
  )
}
