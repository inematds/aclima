'use client'

import { useState, useEffect } from 'react'
import {
  Calendar,
  Droplets,
  Thermometer,
  TrendingUp,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  MapPin,
  ChevronRight,
  X
} from 'lucide-react'
import { useGeolocation } from '@/hooks/useGeolocation'
import { BRAZILIAN_STATES, BRAZILIAN_CAPITALS, type StateCode } from '@/types/weather'

type Period = '24h' | '7d' | '30d'

interface HourlyData {
  time: string
  precipitation: number
  temperature: number
  humidity: number
}

export default function MobileHistorico() {
  const geolocation = useGeolocation()
  const [selectedState, setSelectedState] = useState<StateCode | null>(null)
  const [showStateSelector, setShowStateSelector] = useState(false)
  const [period, setPeriod] = useState<Period>('7d')
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedState && geolocation.state && !geolocation.loading) {
      setSelectedState(geolocation.state)
    }
    if (!selectedState && !geolocation.loading && !geolocation.state) {
      setSelectedState('SP')
    }
  }, [geolocation.state, geolocation.loading, selectedState])

  const effectiveState = selectedState || 'SP'
  const stateInfo = BRAZILIAN_STATES[effectiveState]

  // Encontrar coordenadas da capital do estado
  const capitalEntry = Object.values(BRAZILIAN_CAPITALS).find(
    cap => cap.stateCode === effectiveState
  )
  const capitalCoords = capitalEntry
    ? { lat: capitalEntry.latitude, lng: capitalEntry.longitude }
    : { lat: -23.5505, lng: -46.6333 } // São Paulo default

  // Buscar dados históricos
  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          latitude: capitalCoords.lat.toString(),
          longitude: capitalCoords.lng.toString(),
          hourly: 'precipitation,temperature_2m,relative_humidity_2m',
          timezone: 'America/Sao_Paulo',
          past_hours: period === '24h' ? '24' : period === '7d' ? '168' : '720',
          forecast_hours: '0'
        })

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

        if (!response.ok) {
          throw new Error('Falha ao buscar dados')
        }

        const data = await response.json()

        const formatted: HourlyData[] = data.hourly.time.map((time: string, i: number) => ({
          time,
          precipitation: data.hourly.precipitation[i] || 0,
          temperature: data.hourly.temperature_2m[i] || 0,
          humidity: data.hourly.relative_humidity_2m[i] || 0,
        }))

        setHourlyData(formatted)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido')
      } finally {
        setLoading(false)
      }
    }

    fetchHistoricalData()
  }, [capitalCoords.lat, capitalCoords.lng, period])

  // Calcular estatísticas
  const totalPrecip = hourlyData.reduce((acc, d) => acc + d.precipitation, 0)
  const maxPrecip = hourlyData.length > 0 ? Math.max(...hourlyData.map(d => d.precipitation)) : 0
  const avgTemp = hourlyData.length > 0 ? hourlyData.reduce((acc, d) => acc + d.temperature, 0) / hourlyData.length : 0
  const avgHumidity = hourlyData.length > 0 ? hourlyData.reduce((acc, d) => acc + d.humidity, 0) / hourlyData.length : 0

  // Agrupar por dia
  const dailyData = hourlyData.reduce((acc, curr) => {
    const date = curr.time.split('T')[0]
    if (!acc[date]) {
      acc[date] = { total: 0, max: 0, temps: [] as number[] }
    }
    acc[date].total += curr.precipitation
    acc[date].max = Math.max(acc[date].max, curr.precipitation)
    acc[date].temps.push(curr.temperature)
    return acc
  }, {} as Record<string, { total: number; max: number; temps: number[] }>)

  const dailyChartData = Object.entries(dailyData).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: Math.round(data.total * 10) / 10,
    avgTemp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length * 10) / 10,
  })).slice(-7)

  const maxTotal = Math.max(...dailyChartData.map(d => d.total), 1)

  return (
    <div className="min-h-screen bg-gray-100 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-gray-900">Histórico</h1>
              <button
                onClick={() => setShowStateSelector(true)}
                className="flex items-center gap-1 text-sm text-blue-600"
              >
                <MapPin className="h-4 w-4" />
                {stateInfo?.capital || stateInfo?.name}
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="appearance-none bg-gray-100 rounded-lg px-3 py-2 pr-8 text-sm font-medium"
              >
                <option value="24h">24 horas</option>
                <option value="7d">7 dias</option>
                <option value="30d">30 dias</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Carregando histórico...</p>
          </div>
        </div>
      ) : error ? (
        <div className="px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Erro ao carregar dados</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Droplets className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-500">Total Período</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{totalPrecip.toFixed(1)} mm</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-xs text-gray-500">Máxima (1h)</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{maxPrecip.toFixed(1)} mm</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <Thermometer className="h-4 w-4 text-red-600" />
                </div>
                <span className="text-xs text-gray-500">Temp. Média</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgTemp.toFixed(1)}°C</div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-cyan-100 rounded-lg">
                  <Droplets className="h-4 w-4 text-cyan-600" />
                </div>
                <span className="text-xs text-gray-500">Umidade Média</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{avgHumidity.toFixed(0)}%</div>
            </div>
          </div>

          {/* Chart */}
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Precipitação por Dia</h3>
              <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Dados reais</span>
            </div>
            <div className="h-40 flex items-end justify-between gap-2">
              {dailyChartData.length > 0 ? (
                dailyChartData.map((data, index) => {
                  const heightPercent = (data.total / maxTotal) * 100
                  const isHigh = data.total > 30

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <span className="text-xs text-gray-600 mb-1">
                        {data.total.toFixed(0)}
                      </span>
                      <div
                        className={`w-full rounded-t transition-all ${
                          isHigh ? 'bg-orange-400' : 'bg-blue-400'
                        }`}
                        style={{ height: `${Math.max(heightPercent, 5)}%` }}
                      />
                      <span className="text-xs text-gray-500 mt-2">{data.date}</span>
                    </div>
                  )
                })
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                  Sem dados disponíveis
                </div>
              )}
            </div>
          </div>

          {/* Daily Table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Dados por Dia</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {dailyChartData.map((data, index) => {
                let classification = { label: 'Normal', color: 'bg-green-100 text-green-700' }
                if (data.total >= 50) {
                  classification = { label: 'Muito Alto', color: 'bg-red-100 text-red-700' }
                } else if (data.total >= 30) {
                  classification = { label: 'Alto', color: 'bg-orange-100 text-orange-700' }
                } else if (data.total >= 15) {
                  classification = { label: 'Moderado', color: 'bg-yellow-100 text-yellow-700' }
                }

                return (
                  <div key={index} className="px-4 py-3 flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{data.date}</div>
                      <div className="text-xs text-gray-500">{data.avgTemp}°C média</div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <div>
                        <div className="font-bold text-blue-600">{data.total.toFixed(1)} mm</div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classification.color}`}>
                        {classification.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Source */}
          <div className="text-center text-xs text-gray-500">
            Dados: Open-Meteo API
          </div>
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
    </div>
  )
}
