'use client'

import { useState, useEffect } from 'react'
import { Calendar, TrendingUp, Droplets, BarChart3, Download, ChevronDown, Loader2, AlertTriangle, FlaskConical } from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'

type Period = '24h' | '7d' | '30d'

interface HourlyData {
  time: string
  precipitation: number
  temperature: number
  humidity: number
}

// Componente de badge de simulação
function SimulationBadge({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200 ${className}`}>
      <FlaskConical className="h-3 w-3" />
      Simulação
    </span>
  )
}

export default function HistoricoPage() {
  const [period, setPeriod] = useState<Period>('24h')
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')
  const [hourlyData, setHourlyData] = useState<HourlyData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  // Buscar dados históricos do Open-Meteo
  useEffect(() => {
    async function fetchHistoricalData() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          latitude: capitalInfo.latitude.toString(),
          longitude: capitalInfo.longitude.toString(),
          hourly: 'precipitation,temperature_2m,relative_humidity_2m',
          timezone: 'America/Sao_Paulo',
          past_hours: period === '24h' ? '24' : period === '7d' ? '168' : '720',
          forecast_hours: '0'
        })

        const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`)

        if (!response.ok) {
          throw new Error('Falha ao buscar dados históricos')
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
  }, [capitalInfo.latitude, capitalInfo.longitude, period])

  // Calcular estatísticas
  const totalPrecip = hourlyData.reduce((acc, d) => acc + d.precipitation, 0)
  const maxPrecip = hourlyData.length > 0 ? Math.max(...hourlyData.map(d => d.precipitation)) : 0
  const avgTemp = hourlyData.length > 0 ? hourlyData.reduce((acc, d) => acc + d.temperature, 0) / hourlyData.length : 0
  const avgHumidity = hourlyData.length > 0 ? hourlyData.reduce((acc, d) => acc + d.humidity, 0) / hourlyData.length : 0

  // Agrupar por dia para gráfico diário
  const dailyData = hourlyData.reduce((acc, curr) => {
    const date = curr.time.split('T')[0]
    if (!acc[date]) {
      acc[date] = { total: 0, max: 0, count: 0, temps: [] as number[] }
    }
    acc[date].total += curr.precipitation
    acc[date].max = Math.max(acc[date].max, curr.precipitation)
    acc[date].count++
    acc[date].temps.push(curr.temperature)
    return acc
  }, {} as Record<string, { total: number; max: number; count: number; temps: number[] }>)

  const dailyChartData = Object.entries(dailyData).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: Math.round(data.total * 10) / 10,
    max: Math.round(data.max * 10) / 10,
    avgTemp: Math.round(data.temps.reduce((a, b) => a + b, 0) / data.temps.length * 10) / 10,
  })).slice(-7) // últimos 7 dias

  // Dados simulados para comparativo histórico
  const mockMonthlyData = [
    { month: 'Jul', total: 145 },
    { month: 'Ago', total: 98 },
    { month: 'Set', total: 187 },
    { month: 'Out', total: 234 },
    { month: 'Nov', total: 312 },
    { month: 'Dez', total: 278 },
  ]
  const maxMonthly = Math.max(...mockMonthlyData.map(d => d.total))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando histórico de {capitalInfo.name}...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Erro ao carregar dados</p>
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-gray-900">
              Histórico de Precipitação
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            Análise de dados históricos - {capitalInfo.name}, {capitalInfo.stateCode}
          </p>
        </div>

        {/* Filtros */}
        <div className="flex items-center gap-3">
          {/* Período */}
          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as Period)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="24h">Últimas 24 horas</option>
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Export */}
          <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      {/* Cards de Resumo - DADOS REAIS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Período</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalPrecip.toFixed(1)} mm</div>
          <div className="text-xs text-green-600 mt-1">Dados reais Open-Meteo</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Máxima (1h)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{maxPrecip.toFixed(1)} mm</div>
          <div className="text-xs text-green-600 mt-1">Dados reais Open-Meteo</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Temp. Média</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgTemp.toFixed(1)}°C</div>
          <div className="text-xs text-green-600 mt-1">Dados reais Open-Meteo</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-cyan-100 rounded-lg">
              <Droplets className="h-5 w-5 text-cyan-600" />
            </div>
            <span className="text-sm text-gray-500">Umidade Média</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgHumidity.toFixed(0)}%</div>
          <div className="text-xs text-green-600 mt-1">Dados reais Open-Meteo</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Diário - DADOS REAIS */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Precipitação por Dia
            </h2>
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Dados reais</span>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {dailyChartData.length > 0 ? (
              dailyChartData.map((data, index) => {
                const maxTotal = Math.max(...dailyChartData.map(d => d.total), 1)
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
              <div className="flex-1 flex items-center justify-center text-gray-400">
                Sem dados disponíveis
              </div>
            )}
          </div>
        </div>

        {/* Gráfico Mensal - SIMULAÇÃO */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Acumulado Mensal (6 meses)
            </h2>
            <SimulationBadge />
          </div>
          <div className="h-64 flex items-end justify-between gap-4">
            {mockMonthlyData.map((data, index) => {
              const heightPercent = (data.total / maxMonthly) * 100

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-600 mb-1">
                    {data.total}
                  </span>
                  <div
                    className="w-full bg-purple-400 rounded-t transition-all opacity-70"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                </div>
              )
            })}
          </div>
          <p className="text-xs text-purple-600 mt-3 text-center">
            Dados ilustrativos para demonstração
          </p>
        </div>
      </div>

      {/* Tabela de Dados - DADOS REAIS */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Dados Detalhados por Dia
          </h2>
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded">Dados reais</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium text-center">Total (mm)</th>
                <th className="pb-3 font-medium text-center">Máx. 1h (mm)</th>
                <th className="pb-3 font-medium text-center">Temp. Média</th>
                <th className="pb-3 font-medium text-center">Classificação</th>
              </tr>
            </thead>
            <tbody>
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
                  <tr key={index} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 font-medium text-gray-900">{data.date}</td>
                    <td className="py-3 text-center">{data.total.toFixed(1)}</td>
                    <td className="py-3 text-center">{data.max.toFixed(1)}</td>
                    <td className="py-3 text-center">{data.avgTemp.toFixed(1)}°C</td>
                    <td className="py-3 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${classification.color}`}>
                        {classification.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparativo - SIMULAÇÃO */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-purple-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Comparativo com Média Histórica
          </h2>
          <SimulationBadge />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Dezembro 2024</p>
            <p className="text-3xl font-bold text-gray-900">278 mm</p>
            <p className="text-sm text-red-600 mt-1">+23% acima da média</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Média Histórica (Dez)</p>
            <p className="text-3xl font-bold text-gray-900">226 mm</p>
            <p className="text-sm text-gray-400 mt-1">Média dos últimos 10 anos</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Ano 2024 (Jan-Dez)</p>
            <p className="text-3xl font-bold text-gray-900">1.254 mm</p>
            <p className="text-sm text-orange-600 mt-1">+12% acima da média anual</p>
          </div>
        </div>
        <p className="text-xs text-purple-600 mt-4 text-center">
          Dados ilustrativos para demonstração - Comparativo histórico requer integração com banco de dados
        </p>
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-gray-600">Dados reais (Open-Meteo API)</span>
        </div>
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-purple-600" />
          <span className="text-gray-600">Simulação (dados ilustrativos)</span>
        </div>
      </div>
    </div>
  )
}
