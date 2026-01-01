'use client'

import { useState } from 'react'
import {
  Calendar,
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Loader2,
  RefreshCw,
  MapPin,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Cloud,
  Sun
} from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'
import { useHistorical, getWeatherInfo } from '@/hooks/useForecast'

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// Simple bar chart component
function BarChart({
  data,
  valueKey,
  color,
  maxValue,
  unit
}: {
  data: any[]
  valueKey: string
  color: string
  maxValue?: number
  unit: string
}) {
  const max = maxValue || Math.max(...data.map(d => d[valueKey] || 0)) || 1

  return (
    <div className="flex items-end gap-0.5 h-32">
      {data.map((item, i) => {
        const value = item[valueKey] || 0
        const height = (value / max) * 100
        return (
          <div
            key={i}
            className="flex-1 group relative"
            title={`${formatDate(item.date)}: ${value.toFixed(1)} ${unit}`}
          >
            <div
              className={`${color} rounded-t transition-all hover:opacity-80`}
              style={{ height: `${Math.max(height, 2)}%` }}
            />
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
              {formatDate(item.date)}: {value.toFixed(1)} {unit}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Temperature range chart
function TempRangeChart({ data }: { data: any[] }) {
  const allTemps = data.flatMap(d => [d.temperature_2m_min, d.temperature_2m_max])
  const minTemp = Math.min(...allTemps)
  const maxTemp = Math.max(...allTemps)
  const range = maxTemp - minTemp || 1

  return (
    <div className="relative h-40">
      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-10 flex flex-col justify-between text-xs text-gray-500">
        <span>{maxTemp.toFixed(0)}°</span>
        <span>{((maxTemp + minTemp) / 2).toFixed(0)}°</span>
        <span>{minTemp.toFixed(0)}°</span>
      </div>

      {/* Chart area */}
      <div className="ml-12 h-full flex items-center gap-0.5">
        {data.map((day, i) => {
          const lowPos = ((day.temperature_2m_min - minTemp) / range) * 100
          const highPos = ((day.temperature_2m_max - minTemp) / range) * 100
          const barHeight = highPos - lowPos

          return (
            <div
              key={i}
              className="flex-1 relative h-full group"
              title={`${formatDate(day.date)}: ${day.temperature_2m_min.toFixed(1)}° - ${day.temperature_2m_max.toFixed(1)}°`}
            >
              {/* Temperature range bar */}
              <div
                className="absolute w-full bg-gradient-to-t from-blue-400 to-orange-400 rounded transition-all hover:opacity-80"
                style={{
                  bottom: `${lowPos}%`,
                  height: `${Math.max(barHeight, 3)}%`
                }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
                {formatDate(day.date)}: {day.temperature_2m_min.toFixed(1)}° - {day.temperature_2m_max.toFixed(1)}°
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Historico30DiasPage() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')
  const [chartType, setChartType] = useState<'temperature' | 'precipitation' | 'humidity'>('temperature')

  const { data: histData, loading, error, refetch } = useHistorical({
    days: 30,
    capital: selectedCapital
  })

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  if (loading && !histData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando historico de {capitalInfo.name}...</p>
        </div>
      </div>
    )
  }

  if (error && !histData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <CloudRain className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Erro ao carregar historico</p>
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

  const daily = histData?.daily || []
  const stats = histData?.statistics || {
    avgTemperature: 0,
    maxTemperature: 0,
    minTemperature: 0,
    totalPrecipitation: 0,
    avgHumidity: 0,
    rainyDays: 0
  }
  const period = histData?.period || { start: '', end: '', days: 0 }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Historico 30 Dias
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            <MapPin className="inline h-4 w-4 mr-1" />
            {capitalInfo.name}, {capitalInfo.stateCode}
            {period.start && period.end && (
              <span className="ml-2">
                | {formatDate(period.start)} - {formatDate(period.end)}
              </span>
            )}
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

      {/* Statistics cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Thermometer className="h-4 w-4" />
            <span className="text-xs">Temp. Media</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avgTemperature.toFixed(1)}°C</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingUp className="h-4 w-4 text-orange-500" />
            <span className="text-xs">Maxima</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">{stats.maxTemperature.toFixed(1)}°C</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <TrendingDown className="h-4 w-4 text-blue-500" />
            <span className="text-xs">Minima</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.minTemperature.toFixed(1)}°C</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-xs">Precipitacao</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.totalPrecipitation.toFixed(1)} mm</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <CloudRain className="h-4 w-4 text-blue-500" />
            <span className="text-xs">Dias de Chuva</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.rainyDays}</div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center gap-2 text-gray-500 mb-2">
            <Cloud className="h-4 w-4" />
            <span className="text-xs">Umidade Media</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.avgHumidity}%</div>
        </div>
      </div>

      {/* Charts */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Graficos Historicos
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setChartType('temperature')}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                chartType === 'temperature'
                  ? 'bg-orange-100 text-orange-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Temperatura
            </button>
            <button
              onClick={() => setChartType('precipitation')}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                chartType === 'precipitation'
                  ? 'bg-blue-100 text-blue-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Precipitacao
            </button>
            <button
              onClick={() => setChartType('humidity')}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                chartType === 'humidity'
                  ? 'bg-cyan-100 text-cyan-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Umidade
            </button>
          </div>
        </div>

        {/* Chart area */}
        <div className="space-y-6">
          {chartType === 'temperature' && (
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-400" />
                  <span className="text-sm text-gray-600">Maxima</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400" />
                  <span className="text-sm text-gray-600">Minima</span>
                </div>
              </div>
              <TempRangeChart data={daily} />
            </div>
          )}

          {chartType === 'precipitation' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-sm text-gray-600">Precipitacao diaria (mm)</span>
              </div>
              <BarChart
                data={daily}
                valueKey="precipitation_sum"
                color="bg-blue-500"
                unit="mm"
              />
            </div>
          )}

          {chartType === 'humidity' && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-cyan-500" />
                <span className="text-sm text-gray-600">Umidade relativa media (%)</span>
              </div>
              <BarChart
                data={daily}
                valueKey="relative_humidity_2m_mean"
                color="bg-cyan-500"
                maxValue={100}
                unit="%"
              />
            </div>
          )}

          {/* X-axis labels */}
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            {daily.filter((_: any, i: number) => i % 5 === 0).map((day: any, i: number) => (
              <span key={i}>{formatDate(day.date)}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Daily data table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Dados Diarios - Ultimos 30 Dias</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Condicao</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temp Min</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Temp Max</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Precipitacao</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Umidade</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Vento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {daily.slice().reverse().map((day: any, index: number) => {
                const weather = getWeatherInfo(day.weather_code)
                return (
                  <tr key={day.date} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{formatFullDate(day.date)}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-xl">{weather.icon}</span>
                        <span className="text-sm text-gray-600 hidden md:inline">{weather.description}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-blue-600 font-medium">
                      {day.temperature_2m_min.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-center text-orange-600 font-medium">
                      {day.temperature_2m_max.toFixed(1)}°C
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`${day.precipitation_sum > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                        {day.precipitation_sum.toFixed(1)} mm
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {day.relative_humidity_2m_mean}%
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">
                      {day.wind_speed_10m_max.toFixed(0)} km/h
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
        Dados: Open-Meteo API | Historico dos ultimos 30 dias
      </div>
    </div>
  )
}
