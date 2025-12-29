'use client'

import { useState } from 'react'
import {
  MapPin,
  Droplets,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  RefreshCw
} from 'lucide-react'

type RiskLevel = 'normal' | 'attention' | 'alert' | 'severe'
type Trend = 'up' | 'down' | 'stable'

interface Region {
  id: string
  name: string
  rainNow: number
  rain30min: number
  rain1h: number
  rain24h: number
  risk: RiskLevel
  trend: Trend
  lastUpdate: string
}

const mockRegions: Region[] = [
  { id: '1', name: 'Centro', rainNow: 4.2, rain30min: 8.5, rain1h: 15.2, rain24h: 52.3, risk: 'severe', trend: 'up', lastUpdate: '1 min' },
  { id: '2', name: 'Zona Sul - Jardim América', rainNow: 3.8, rain30min: 6.2, rain1h: 12.4, rain24h: 38.7, risk: 'alert', trend: 'up', lastUpdate: '2 min' },
  { id: '3', name: 'Zona Sul - Ipiranga', rainNow: 2.1, rain30min: 4.5, rain1h: 8.9, rain24h: 28.3, risk: 'attention', trend: 'stable', lastUpdate: '1 min' },
  { id: '4', name: 'Zona Norte - Santana', rainNow: 1.5, rain30min: 3.2, rain1h: 6.5, rain24h: 22.1, risk: 'attention', trend: 'down', lastUpdate: '3 min' },
  { id: '5', name: 'Zona Norte - Tucuruvi', rainNow: 0.8, rain30min: 1.8, rain1h: 4.2, rain24h: 15.6, risk: 'normal', trend: 'stable', lastUpdate: '2 min' },
  { id: '6', name: 'Zona Leste - Penha', rainNow: 0.5, rain30min: 1.2, rain1h: 2.8, rain24h: 9.4, risk: 'normal', trend: 'down', lastUpdate: '1 min' },
  { id: '7', name: 'Zona Oeste - Pinheiros', rainNow: 1.2, rain30min: 2.5, rain1h: 5.1, rain24h: 18.2, risk: 'normal', trend: 'up', lastUpdate: '2 min' },
]

// Dados para gráfico temporal
const timeData = [
  { time: '12:00', rain: 0.5, accumulated: 25.2 },
  { time: '12:30', rain: 1.2, accumulated: 25.7 },
  { time: '13:00', rain: 2.8, accumulated: 28.5 },
  { time: '13:30', rain: 4.5, accumulated: 33.0 },
  { time: '14:00', rain: 6.2, accumulated: 39.2 },
  { time: '14:30', rain: 5.1, accumulated: 44.3 },
  { time: '15:00', rain: 3.8, accumulated: 48.1 },
  { time: '15:30', rain: 4.2, accumulated: 52.3 },
]

const riskConfig: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  normal: { color: 'text-green-700', bg: 'bg-green-500', label: 'Normal' },
  attention: { color: 'text-yellow-700', bg: 'bg-yellow-500', label: 'Atenção' },
  alert: { color: 'text-orange-700', bg: 'bg-orange-500', label: 'Alerta' },
  severe: { color: 'text-red-700', bg: 'bg-red-500', label: 'Severo' },
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up') return <TrendingUp className="h-4 w-4 text-red-500" />
  if (trend === 'down') return <TrendingDown className="h-4 w-4 text-green-500" />
  return <Minus className="h-4 w-4 text-gray-400" />
}

export default function Painel1Page() {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null)

  const alertCount = mockRegions.filter(r => r.risk !== 'normal').length
  const severeCount = mockRegions.filter(r => r.risk === 'severe').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Painel 1: Situação Meteorológica Atual
          </h1>
          <p className="text-sm text-gray-500">
            Visão integrada e comparativa das condições em tempo real
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-gray-600">Ao vivo</span>
          </div>
          <button className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800">
            <RefreshCw size={14} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Layout principal - 3 colunas */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

        {/* Coluna 1: Lista de Regiões */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Comparativo de Regiões</h2>
            <p className="text-xs text-gray-500">{mockRegions.length} regiões monitoradas</p>
          </div>

          {/* Header da tabela */}
          <div className="grid grid-cols-12 gap-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
            <div className="col-span-4">Região</div>
            <div className="col-span-2 text-center">Agora</div>
            <div className="col-span-2 text-center">30min</div>
            <div className="col-span-2 text-center">1h</div>
            <div className="col-span-2 text-center">Risco</div>
          </div>

          {/* Lista scrollável */}
          <div className="flex-1 overflow-auto">
            {mockRegions.map((region) => (
              <div
                key={region.id}
                className={`grid grid-cols-12 gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                  selectedRegion === region.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedRegion(region.id)}
              >
                <div className="col-span-4 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${riskConfig[region.risk].bg}`} />
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-900 truncate">{region.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {region.lastUpdate}
                    </p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-sm font-semibold">{region.rainNow}</span>
                    <span className="text-xs text-gray-400 ml-0.5">mm/h</span>
                  </div>
                </div>
                <div className="col-span-2 flex items-center justify-center text-sm text-gray-600">
                  {region.rain30min}
                </div>
                <div className="col-span-2 flex items-center justify-center text-sm text-gray-600">
                  {region.rain1h}
                </div>
                <div className="col-span-2 flex items-center justify-center gap-1">
                  <TrendIcon trend={region.trend} />
                  <span className={`text-xs font-medium ${riskConfig[region.risk].color}`}>
                    {riskConfig[region.risk].label}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Gráficos Temporais */}
        <div className="col-span-4 flex flex-col gap-4">
          {/* Gráfico de Chuva */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-1">Chuva ao Longo do Tempo</h3>
            <p className="text-xs text-gray-500 mb-3">Últimas 4 horas - Região: {selectedRegion ? mockRegions.find(r => r.id === selectedRegion)?.name : 'Centro'}</p>

            <div className="h-32 flex items-end gap-1">
              {timeData.map((d, i) => {
                const height = (d.rain / 7) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">{d.rain}</span>
                    <div
                      className={`w-full rounded-t ${d.rain > 5 ? 'bg-orange-400' : 'bg-blue-400'}`}
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-xs text-gray-400 mt-1">{d.time.split(':')[0]}h</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Acumulados */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Acumulados</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xs text-gray-500">30 min</div>
                <div className="text-xl font-bold text-blue-700">8.5</div>
                <div className="text-xs text-gray-400">mm</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-xs text-gray-500">1 hora</div>
                <div className="text-xl font-bold text-yellow-700">15.2</div>
                <div className="text-xs text-gray-400">mm</div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <div className="text-xs text-gray-500">24 horas</div>
                <div className="text-xl font-bold text-red-700">52.3</div>
                <div className="text-xs text-gray-400">mm</div>
              </div>
            </div>
          </div>

          {/* Tendência de Risco */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Tendência de Risco</h3>
            <div className="flex items-center gap-4">
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500" style={{ width: '75%' }} />
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-semibold">Alto</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Previsão: intensificação nas próximas 2 horas
            </p>
          </div>
        </div>

        {/* Coluna 3: Mapa e Alertas */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Mapa Placeholder */}
          <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900">Mapa Interativo</h3>
            </div>
            <div className="h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center p-4">
              <div className="text-center text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">Mapa com heatmap</p>
                <p className="text-xs">Em desenvolvimento</p>
                <p className="text-xs mt-2">(Leaflet/MapBox)</p>
              </div>
            </div>
          </div>

          {/* Mini Alertas */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Alertas Ativos</h3>
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                {alertCount}
              </span>
            </div>
            <div className="space-y-2">
              {mockRegions.filter(r => r.risk !== 'normal').slice(0, 3).map(region => (
                <div key={region.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                  <AlertTriangle className={`h-4 w-4 ${riskConfig[region.risk].color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{region.name}</p>
                    <p className="text-xs text-gray-500">{region.rain1h}mm/1h</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legenda */}
      <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span>Atenção (≥10mm/30min)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span>Alerta (≥30mm/1h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Severo (≥50mm/24h)</span>
        </div>
      </div>
    </div>
  )
}
