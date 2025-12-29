'use client'

import { useState } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  XCircle,
  MapPin,
  Clock,
  Droplets,
  Shield,
  ChevronRight,
  Bell
} from 'lucide-react'

type AlertLevel = 'attention' | 'alert' | 'severe'
type AlertType = 'flood' | 'overflow' | 'landslide' | 'rain'

interface Alert {
  id: string
  region: string
  subregion: string
  level: AlertLevel
  type: AlertType
  message: string
  startTime: string
  duration: string
  rain1h: number
  rain24h: number
  source: string
  coordinates: { lat: number; lng: number }
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    region: 'Centro',
    subregion: 'Praça da Sé',
    level: 'severe',
    type: 'flood',
    message: 'Alagamento confirmado. Água atingindo 30cm em vias principais.',
    startTime: '14:25',
    duration: '1h 05min',
    rain1h: 35.2,
    rain24h: 58.4,
    source: 'Defesa Civil',
    coordinates: { lat: -23.550, lng: -46.634 }
  },
  {
    id: '2',
    region: 'Zona Sul',
    subregion: 'Jardim Ângela',
    level: 'severe',
    type: 'landslide',
    message: 'Risco de deslizamento em área de encosta. Evacuação recomendada.',
    startTime: '14:10',
    duration: '1h 20min',
    rain1h: 42.1,
    rain24h: 72.3,
    source: 'CGE',
    coordinates: { lat: -23.683, lng: -46.753 }
  },
  {
    id: '3',
    region: 'Zona Norte',
    subregion: 'Casa Verde',
    level: 'alert',
    type: 'overflow',
    message: 'Nível do córrego Carandiru em elevação. Monitoramento ativo.',
    startTime: '14:45',
    duration: '45min',
    rain1h: 28.5,
    rain24h: 45.2,
    source: 'SAISP',
    coordinates: { lat: -23.518, lng: -46.657 }
  },
  {
    id: '4',
    region: 'Zona Leste',
    subregion: 'São Miguel',
    level: 'alert',
    type: 'rain',
    message: 'Chuva intensa na região. Possíveis pontos de alagamento.',
    startTime: '15:00',
    duration: '30min',
    rain1h: 25.8,
    rain24h: 38.9,
    source: 'INMET',
    coordinates: { lat: -23.498, lng: -46.448 }
  },
  {
    id: '5',
    region: 'Zona Oeste',
    subregion: 'Rio Pequeno',
    level: 'attention',
    type: 'rain',
    message: 'Chuva moderada persistente. Acompanhar evolução.',
    startTime: '15:10',
    duration: '20min',
    rain1h: 12.4,
    rain24h: 28.7,
    source: 'CEMADEN',
    coordinates: { lat: -23.557, lng: -46.749 }
  },
]

const alertLevelConfig: Record<AlertLevel, {
  icon: typeof AlertTriangle
  color: string
  bg: string
  border: string
  label: string
}> = {
  attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'ATENÇÃO'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'ALERTA'
  },
  severe: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'SEVERO'
  },
}

const alertTypeLabels: Record<AlertType, string> = {
  flood: 'Alagamento',
  overflow: 'Transbordamento',
  landslide: 'Deslizamento',
  rain: 'Chuva Intensa',
}

export default function Painel2Page() {
  const [selectedAlert, setSelectedAlert] = useState<string | null>(mockAlerts[0].id)
  const selected = mockAlerts.find(a => a.id === selectedAlert)

  const severeCount = mockAlerts.filter(a => a.level === 'severe').length
  const alertCount = mockAlerts.filter(a => a.level === 'alert').length
  const attentionCount = mockAlerts.filter(a => a.level === 'attention').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Painel 2: Alertas Hidrológicos e Risco
          </h1>
          <p className="text-sm text-gray-500">
            Monitoramento em tempo real do estado hidrológico e níveis de risco
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-red-500 animate-pulse" />
          <span className="text-sm font-medium text-gray-700">
            {mockAlerts.length} alertas ativos
          </span>
        </div>
      </div>

      {/* Indicadores Agregados */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-red-600 font-medium">Severos</p>
                <p className="text-4xl font-bold text-red-700">{severeCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-red-500">Ação imediata</p>
              <p className="text-xs text-red-500">necessária</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-8 w-8 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-orange-600 font-medium">Alertas</p>
                <p className="text-4xl font-bold text-orange-700">{alertCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-orange-500">Monitoramento</p>
              <p className="text-xs text-orange-500">intensivo</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <AlertCircle className="h-8 w-8 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-yellow-600 font-medium">Atenção</p>
                <p className="text-4xl font-bold text-yellow-700">{attentionCount}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-yellow-500">Acompanhar</p>
              <p className="text-xs text-yellow-500">evolução</p>
            </div>
          </div>
        </div>
      </div>

      {/* Layout principal - Mapa + Lista + Detalhes */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Mapa de Status */}
        <div className="col-span-5 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Mapa de Status</h2>
            <div className="flex gap-2">
              {(['severe', 'alert', 'attention'] as AlertLevel[]).map(level => (
                <div key={level} className="flex items-center gap-1">
                  <div className={`w-3 h-3 rounded-full ${
                    level === 'severe' ? 'bg-red-500' :
                    level === 'alert' ? 'bg-orange-500' : 'bg-yellow-500'
                  }`} />
                  <span className="text-xs text-gray-500">
                    {mockAlerts.filter(a => a.level === level).length}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa Placeholder com pontos */}
          <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 relative p-4">
            {mockAlerts.map((alert, i) => {
              const config = alertLevelConfig[alert.level]
              const positions = [
                { top: '20%', left: '45%' },
                { top: '70%', left: '30%' },
                { top: '35%', left: '60%' },
                { top: '55%', left: '75%' },
                { top: '45%', left: '25%' },
              ]
              const pos = positions[i] || { top: '50%', left: '50%' }

              return (
                <button
                  key={alert.id}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                    selectedAlert === alert.id ? 'z-10 scale-125' : ''
                  } transition-transform`}
                  style={{ top: pos.top, left: pos.left }}
                  onClick={() => setSelectedAlert(alert.id)}
                >
                  <div className={`p-2 rounded-full ${config.bg} border-2 ${config.border} shadow-lg`}>
                    <config.icon className={`h-5 w-5 ${config.color}`} />
                  </div>
                  {alert.level === 'severe' && (
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                  )}
                </button>
              )
            })}

            <div className="absolute bottom-4 left-4 bg-white/90 rounded-lg p-2 text-xs text-gray-500">
              <p>Clique nos pontos para detalhes</p>
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Lista de Alertas</h2>
          </div>

          <div className="flex-1 overflow-auto">
            {mockAlerts.map((alert) => {
              const config = alertLevelConfig[alert.level]
              const Icon = config.icon

              return (
                <button
                  key={alert.id}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedAlert === alert.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedAlert(alert.id)}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-400">{alert.startTime}</span>
                      </div>
                      <p className="font-medium text-gray-900 text-sm mt-1 truncate">
                        {alert.region}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {alertTypeLabels[alert.type]}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Painel de Detalhes */}
        <div className="col-span-4 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Detalhes do Alerta</h2>
          </div>

          {selected ? (
            <div className="flex-1 p-4 overflow-auto">
              {/* Cabeçalho do alerta */}
              <div className={`${alertLevelConfig[selected.level].bg} ${alertLevelConfig[selected.level].border} border rounded-lg p-4 mb-4`}>
                <div className="flex items-center gap-2 mb-2">
                  {(() => {
                    const Icon = alertLevelConfig[selected.level].icon
                    return <Icon className={`h-6 w-6 ${alertLevelConfig[selected.level].color}`} />
                  })()}
                  <span className={`font-bold ${alertLevelConfig[selected.level].color}`}>
                    {alertLevelConfig[selected.level].label}
                  </span>
                  <span className="text-sm text-gray-500">
                    • {alertTypeLabels[selected.type]}
                  </span>
                </div>
                <p className="text-gray-700">{selected.message}</p>
              </div>

              {/* Região */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Região Afetada</h4>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{selected.region}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600">{selected.subregion}</span>
                </div>
              </div>

              {/* Tempo */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Início</h4>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{selected.startTime}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Duração</h4>
                  <span className="font-medium">{selected.duration}</span>
                </div>
              </div>

              {/* Precipitação */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Precipitação</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <div className="text-xl font-bold">{selected.rain1h}</div>
                    <div className="text-xs text-gray-500">mm/1h</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <Droplets className="h-5 w-5 text-blue-700 mx-auto mb-1" />
                    <div className="text-xl font-bold">{selected.rain24h}</div>
                    <div className="text-xs text-gray-500">mm/24h</div>
                  </div>
                </div>
              </div>

              {/* Fonte */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Fonte do Dado</h4>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-700">{selected.source}</span>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
                  Ver no Mapa
                </button>
                <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200">
                  Histórico
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p>Selecione um alerta para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
