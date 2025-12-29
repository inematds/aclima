'use client'

import { useState } from 'react'
import { Calendar, TrendingUp, Droplets, BarChart3, Download, ChevronDown } from 'lucide-react'

type Period = '7d' | '30d' | '90d' | '1y'

interface DailyData {
  date: string
  total: number
  max: number
  avgIntensity: number
  alerts: number
}

// Dados mockados para demonstração
const mockDailyData: DailyData[] = [
  { date: '28/12', total: 32.5, max: 8.2, avgIntensity: 2.4, alerts: 3 },
  { date: '27/12', total: 18.3, max: 5.1, avgIntensity: 1.8, alerts: 1 },
  { date: '26/12', total: 45.2, max: 12.4, avgIntensity: 4.2, alerts: 5 },
  { date: '25/12', total: 8.7, max: 2.3, avgIntensity: 0.9, alerts: 0 },
  { date: '24/12', total: 22.1, max: 6.8, avgIntensity: 2.1, alerts: 2 },
  { date: '23/12', total: 55.8, max: 15.2, avgIntensity: 5.1, alerts: 7 },
  { date: '22/12', total: 12.4, max: 3.5, avgIntensity: 1.2, alerts: 0 },
]

const mockMonthlyData = [
  { month: 'Jul', total: 145 },
  { month: 'Ago', total: 98 },
  { month: 'Set', total: 187 },
  { month: 'Out', total: 234 },
  { month: 'Nov', total: 312 },
  { month: 'Dez', total: 278 },
]

export default function HistoricoPage() {
  const [period, setPeriod] = useState<Period>('7d')
  const [selectedRegion, setSelectedRegion] = useState('all')

  const totalPeriod = mockDailyData.reduce((acc, d) => acc + d.total, 0)
  const maxPeriod = Math.max(...mockDailyData.map(d => d.max))
  const avgPeriod = totalPeriod / mockDailyData.length
  const totalAlerts = mockDailyData.reduce((acc, d) => acc + d.alerts, 0)

  const maxMonthly = Math.max(...mockMonthlyData.map(d => d.total))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Histórico de Precipitação
          </h1>
          <p className="text-gray-500">
            Análise de dados históricos e tendências
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
              <option value="7d">Últimos 7 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="1y">Último ano</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>

          {/* Região */}
          <div className="relative">
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todas as regiões</option>
              <option value="centro">Centro</option>
              <option value="sul">Zona Sul</option>
              <option value="norte">Zona Norte</option>
              <option value="leste">Zona Leste</option>
              <option value="oeste">Zona Oeste</option>
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

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Droplets className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Total Período</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalPeriod.toFixed(1)} mm</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <span className="text-sm text-gray-500">Máxima (1h)</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{maxPeriod.toFixed(1)} mm</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Média Diária</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{avgPeriod.toFixed(1)} mm</div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <Calendar className="h-5 w-5 text-red-600" />
            </div>
            <span className="text-sm text-gray-500">Total Alertas</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalAlerts}</div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Diário */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Precipitação Diária
          </h2>
          <div className="h-64 flex items-end justify-between gap-2">
            {mockDailyData.map((data, index) => {
              const heightPercent = (data.total / 60) * 100
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
            })}
          </div>
        </div>

        {/* Gráfico Mensal */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Acumulado Mensal (6 meses)
          </h2>
          <div className="h-64 flex items-end justify-between gap-4">
            {mockMonthlyData.map((data, index) => {
              const heightPercent = (data.total / maxMonthly) * 100

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <span className="text-xs text-gray-600 mb-1">
                    {data.total}
                  </span>
                  <div
                    className="w-full bg-blue-500 rounded-t transition-all"
                    style={{ height: `${heightPercent}%` }}
                  />
                  <span className="text-xs text-gray-500 mt-2">{data.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Tabela de Dados */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Dados Detalhados
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Data</th>
                <th className="pb-3 font-medium text-center">Total (mm)</th>
                <th className="pb-3 font-medium text-center">Máx. 1h (mm)</th>
                <th className="pb-3 font-medium text-center">Intensidade Média</th>
                <th className="pb-3 font-medium text-center">Alertas</th>
                <th className="pb-3 font-medium text-center">Classificação</th>
              </tr>
            </thead>
            <tbody>
              {mockDailyData.map((data, index) => {
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
                    <td className="py-3 font-medium text-gray-900">{data.date}/2024</td>
                    <td className="py-3 text-center">{data.total.toFixed(1)}</td>
                    <td className="py-3 text-center">{data.max.toFixed(1)}</td>
                    <td className="py-3 text-center">{data.avgIntensity.toFixed(1)} mm/h</td>
                    <td className="py-3 text-center">
                      {data.alerts > 0 ? (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                          {data.alerts}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
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

      {/* Comparativo */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Comparativo com Média Histórica
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Dezembro 2024</p>
            <p className="text-3xl font-bold text-gray-900">278 mm</p>
            <p className="text-sm text-red-600 mt-1">+23% acima da média</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Média Histórica (Dez)</p>
            <p className="text-3xl font-bold text-gray-900">226 mm</p>
            <p className="text-sm text-gray-400 mt-1">Média dos últimos 10 anos</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Ano 2024 (Jan-Dez)</p>
            <p className="text-3xl font-bold text-gray-900">1.254 mm</p>
            <p className="text-sm text-orange-600 mt-1">+12% acima da média anual</p>
          </div>
        </div>
      </div>
    </div>
  )
}
