'use client'

import { useState } from 'react'
import {
  Radio,
  Droplets,
  Thermometer,
  Wind,
  Gauge,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Settings
} from 'lucide-react'

type SensorStatus = 'online' | 'offline' | 'warning'
type Trend = 'up' | 'down' | 'stable'

interface Sensor {
  id: string
  type: 'rain' | 'temperature' | 'humidity' | 'pressure' | 'wind'
  value: number
  unit: string
  status: SensorStatus
  trend: Trend
  lastUpdate: string
  min24h: number
  max24h: number
}

interface Station {
  id: string
  name: string
  code: string
  location: string
  zone: string
  status: SensorStatus
  lastUpdate: string
  battery: number
  signal: number
  sensors: Sensor[]
}

const mockStations: Station[] = [
  {
    id: '1',
    name: 'Estação Central',
    code: 'EST-001',
    location: 'Praça da Sé, 100',
    zone: 'Centro',
    status: 'online',
    lastUpdate: '30 seg',
    battery: 92,
    signal: 98,
    sensors: [
      { id: 's1', type: 'rain', value: 4.2, unit: 'mm/h', status: 'online', trend: 'up', lastUpdate: '30s', min24h: 0, max24h: 8.5 },
      { id: 's2', type: 'temperature', value: 24.5, unit: '°C', status: 'online', trend: 'stable', lastUpdate: '30s', min24h: 19.2, max24h: 28.4 },
      { id: 's3', type: 'humidity', value: 85, unit: '%', status: 'online', trend: 'up', lastUpdate: '30s', min24h: 62, max24h: 92 },
      { id: 's4', type: 'pressure', value: 1013.2, unit: 'hPa', status: 'online', trend: 'down', lastUpdate: '30s', min24h: 1008.5, max24h: 1018.3 },
      { id: 's5', type: 'wind', value: 12.5, unit: 'km/h', status: 'online', trend: 'stable', lastUpdate: '30s', min24h: 2.1, max24h: 25.8 },
    ]
  },
  {
    id: '2',
    name: 'Estação Sul',
    code: 'EST-002',
    location: 'Av. Interlagos, 500',
    zone: 'Zona Sul',
    status: 'online',
    lastUpdate: '45 seg',
    battery: 78,
    signal: 85,
    sensors: [
      { id: 's1', type: 'rain', value: 6.8, unit: 'mm/h', status: 'online', trend: 'up', lastUpdate: '45s', min24h: 0, max24h: 12.4 },
      { id: 's2', type: 'temperature', value: 23.2, unit: '°C', status: 'online', trend: 'down', lastUpdate: '45s', min24h: 18.5, max24h: 27.1 },
      { id: 's3', type: 'humidity', value: 88, unit: '%', status: 'online', trend: 'up', lastUpdate: '45s', min24h: 65, max24h: 95 },
      { id: 's4', type: 'pressure', value: 1012.8, unit: 'hPa', status: 'online', trend: 'down', lastUpdate: '45s', min24h: 1007.2, max24h: 1017.8 },
      { id: 's5', type: 'wind', value: 18.2, unit: 'km/h', status: 'online', trend: 'up', lastUpdate: '45s', min24h: 5.4, max24h: 32.1 },
    ]
  },
  {
    id: '3',
    name: 'Estação Norte',
    code: 'EST-003',
    location: 'Av. Edu Chaves, 200',
    zone: 'Zona Norte',
    status: 'warning',
    lastUpdate: '5 min',
    battery: 45,
    signal: 52,
    sensors: [
      { id: 's1', type: 'rain', value: 2.1, unit: 'mm/h', status: 'warning', trend: 'stable', lastUpdate: '5m', min24h: 0, max24h: 5.2 },
      { id: 's2', type: 'temperature', value: 25.8, unit: '°C', status: 'online', trend: 'stable', lastUpdate: '5m', min24h: 20.1, max24h: 29.2 },
      { id: 's3', type: 'humidity', value: 75, unit: '%', status: 'online', trend: 'stable', lastUpdate: '5m', min24h: 58, max24h: 85 },
      { id: 's4', type: 'pressure', value: 1014.1, unit: 'hPa', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
      { id: 's5', type: 'wind', value: 8.5, unit: 'km/h', status: 'online', trend: 'down', lastUpdate: '5m', min24h: 1.2, max24h: 15.4 },
    ]
  },
  {
    id: '4',
    name: 'Estação Leste',
    code: 'EST-004',
    location: 'Shopping Aricanduva',
    zone: 'Zona Leste',
    status: 'offline',
    lastUpdate: '2 horas',
    battery: 0,
    signal: 0,
    sensors: [
      { id: 's1', type: 'rain', value: 0, unit: 'mm/h', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
      { id: 's2', type: 'temperature', value: 0, unit: '°C', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
      { id: 's3', type: 'humidity', value: 0, unit: '%', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
      { id: 's4', type: 'pressure', value: 0, unit: 'hPa', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
      { id: 's5', type: 'wind', value: 0, unit: 'km/h', status: 'offline', trend: 'stable', lastUpdate: '2h', min24h: 0, max24h: 0 },
    ]
  },
]

const sensorIcons: Record<string, typeof Droplets> = {
  rain: Droplets,
  temperature: Thermometer,
  humidity: Wind,
  pressure: Gauge,
  wind: Wind,
}

const sensorLabels: Record<string, string> = {
  rain: 'Precipitação',
  temperature: 'Temperatura',
  humidity: 'Umidade',
  pressure: 'Pressão',
  wind: 'Vento',
}

const statusConfig: Record<SensorStatus, { color: string; bg: string; icon: typeof CheckCircle }> = {
  online: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
  offline: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  if (trend === 'up') return <TrendingUp className="h-3 w-3 text-red-500" />
  if (trend === 'down') return <TrendingDown className="h-3 w-3 text-blue-500" />
  return <Minus className="h-3 w-3 text-gray-400" />
}

// Mini gráfico de tendência
const MiniChart = ({ data }: { data: number[] }) => {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1

  return (
    <div className="flex items-end gap-0.5 h-8">
      {data.map((value, i) => {
        const height = ((value - min) / range) * 100
        return (
          <div
            key={i}
            className="flex-1 bg-blue-400 rounded-t"
            style={{ height: `${Math.max(height, 10)}%` }}
          />
        )
      })}
    </div>
  )
}

export default function Painel3Page() {
  const [selectedStation, setSelectedStation] = useState<string>(mockStations[0].id)
  const station = mockStations.find(s => s.id === selectedStation)!

  const onlineCount = mockStations.filter(s => s.status === 'online').length
  const warningCount = mockStations.filter(s => s.status === 'warning').length
  const offlineCount = mockStations.filter(s => s.status === 'offline').length

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Painel 3: Estação Climática Realtime
          </h1>
          <p className="text-sm text-gray-500">
            Dados brutos e atualizados de sensores com máxima legibilidade
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{onlineCount} online</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>{warningCount} alertas</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{offlineCount} offline</span>
          </div>
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">
        {/* Lista de Estações por Zona */}
        <div className="col-span-3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
          <div className="p-3 border-b bg-gray-50">
            <h2 className="font-semibold text-gray-900">Estações por Zona</h2>
            <p className="text-xs text-gray-500">{mockStations.length} estações</p>
          </div>

          <div className="flex-1 overflow-auto">
            {mockStations.map((s) => {
              const config = statusConfig[s.status]
              const StatusIcon = config.icon

              return (
                <button
                  key={s.id}
                  className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedStation === s.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                  }`}
                  onClick={() => setSelectedStation(s.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Radio className="h-4 w-4 text-blue-500" />
                      <span className="font-medium text-gray-900">{s.code}</span>
                    </div>
                    <StatusIcon className={`h-4 w-4 ${config.color}`} />
                  </div>
                  <p className="text-sm text-gray-600 truncate">{s.name}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-400">{s.zone}</span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {s.lastUpdate}
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Indicadores Numéricos */}
        <div className="col-span-6 flex flex-col gap-4">
          {/* Header da estação selecionada */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${statusConfig[station.status].bg}`}>
                  <Radio className={`h-6 w-6 ${statusConfig[station.status].color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">{station.name}</h3>
                  <p className="text-sm text-gray-500">{station.code} • {station.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm">
                    <Zap className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium">{station.battery}%</span>
                  </div>
                  <p className="text-xs text-gray-400">Bateria</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-sm">
                    <Radio className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{station.signal}%</span>
                  </div>
                  <p className="text-xs text-gray-400">Sinal</p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Settings className="h-5 w-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid de Sensores */}
          <div className="flex-1 grid grid-cols-3 gap-3">
            {station.sensors.map((sensor) => {
              const Icon = sensorIcons[sensor.type]
              const config = statusConfig[sensor.status]

              return (
                <div
                  key={sensor.id}
                  className={`bg-white rounded-lg shadow-sm border p-4 ${
                    sensor.status === 'offline' ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-blue-500" />
                      <span className="text-sm font-medium text-gray-700">
                        {sensorLabels[sensor.type]}
                      </span>
                    </div>
                    <div className={`p-1 rounded ${config.bg}`}>
                      {(() => {
                        const StatusIcon = config.icon
                        return <StatusIcon className={`h-3 w-3 ${config.color}`} />
                      })()}
                    </div>
                  </div>

                  {sensor.status !== 'offline' ? (
                    <>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-3xl font-bold text-gray-900">
                          {sensor.value}
                        </span>
                        <span className="text-lg text-gray-500">{sensor.unit}</span>
                        <TrendIcon trend={sensor.trend} />
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span>Min: {sensor.min24h}</span>
                        <span>Máx: {sensor.max24h}</span>
                      </div>

                      <div className="mt-2 text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {sensor.lastUpdate}
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-gray-400">
                      <XCircle className="h-8 w-8 mx-auto mb-1" />
                      <p className="text-sm">Sem dados</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Gráficos Compactos e Status */}
        <div className="col-span-3 flex flex-col gap-4">
          {/* Tendência de Precipitação */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Tendência Recente</h3>
            <p className="text-xs text-gray-500 mb-3">Precipitação - Últimas 2 horas</p>

            <MiniChart data={[0.5, 1.2, 2.1, 3.5, 4.8, 5.2, 4.5, 4.2]} />

            <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
              <span>14:00</span>
              <span>16:00</span>
            </div>

            <div className="mt-3 p-2 bg-orange-50 rounded flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-orange-700">Tendência de aumento</span>
            </div>
          </div>

          {/* Status dos Sensores */}
          <div className="bg-white rounded-lg shadow-sm border p-4 flex-1">
            <h3 className="font-semibold text-gray-900 mb-3">Status dos Sensores</h3>

            <div className="space-y-2">
              {station.sensors.map((sensor) => {
                const config = statusConfig[sensor.status]
                const StatusIcon = config.icon

                return (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                  >
                    <span className="text-sm text-gray-700">
                      {sensorLabels[sensor.type]}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${config.color}`}>
                        {sensor.status === 'online' ? 'OK' :
                         sensor.status === 'warning' ? 'Alerta' : 'Falha'}
                      </span>
                      <StatusIcon className={`h-4 w-4 ${config.color}`} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Detecção de Falhas */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h3 className="font-semibold text-gray-900 mb-3">Detecção de Falhas</h3>

            {offlineCount > 0 || warningCount > 0 ? (
              <div className="space-y-2">
                {mockStations.filter(s => s.status !== 'online').map(s => (
                  <div
                    key={s.id}
                    className={`p-2 rounded flex items-center gap-2 ${
                      s.status === 'offline' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}
                  >
                    {s.status === 'offline' ? (
                      <XCircle className="h-4 w-4 text-red-500" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{s.code}</p>
                      <p className="text-xs text-gray-500">
                        {s.status === 'offline' ? 'Sem comunicação' : 'Verificar sensores'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-green-600">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                <p className="text-sm">Todos os sensores operacionais</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
