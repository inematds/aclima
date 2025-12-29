import { Radio, Droplets, Thermometer, Wind, Clock, CheckCircle, XCircle } from 'lucide-react'

type StationStatus = 'online' | 'offline' | 'delayed'

interface Station {
  id: string
  name: string
  location: string
  status: StationStatus
  rainNow: number
  rain1h: number
  rain24h: number
  temperature: number
  humidity: number
  lastUpdate: string
}

const mockStations: Station[] = [
  {
    id: '1',
    name: 'EST-001',
    location: 'Centro - Praça Central',
    status: 'online',
    rainNow: 2.4,
    rain1h: 12.5,
    rain24h: 52.3,
    temperature: 24.5,
    humidity: 85,
    lastUpdate: '1 min',
  },
  {
    id: '2',
    name: 'EST-002',
    location: 'Zona Sul - Parque Municipal',
    status: 'online',
    rainNow: 4.8,
    rain1h: 18.2,
    rain24h: 35.1,
    temperature: 23.8,
    humidity: 88,
    lastUpdate: '2 min',
  },
  {
    id: '3',
    name: 'EST-003',
    location: 'Zona Norte - Estádio',
    status: 'delayed',
    rainNow: 1.2,
    rain1h: 8.4,
    rain24h: 22.6,
    temperature: 25.1,
    humidity: 78,
    lastUpdate: '15 min',
  },
  {
    id: '4',
    name: 'EST-004',
    location: 'Zona Leste - Shopping',
    status: 'online',
    rainNow: 0.5,
    rain1h: 2.1,
    rain24h: 8.9,
    temperature: 26.2,
    humidity: 72,
    lastUpdate: '1 min',
  },
  {
    id: '5',
    name: 'EST-005',
    location: 'Zona Oeste - Terminal',
    status: 'offline',
    rainNow: 0,
    rain1h: 0,
    rain24h: 0,
    temperature: 0,
    humidity: 0,
    lastUpdate: '2h',
  },
]

const statusConfig: Record<StationStatus, { color: string; bg: string; label: string; icon: typeof CheckCircle }> = {
  online: { color: 'text-green-600', bg: 'bg-green-100', label: 'Online', icon: CheckCircle },
  offline: { color: 'text-red-600', bg: 'bg-red-100', label: 'Offline', icon: XCircle },
  delayed: { color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'Atrasado', icon: Clock },
}

export default function EstacoesPage() {
  const onlineCount = mockStations.filter(s => s.status === 'online').length
  const offlineCount = mockStations.filter(s => s.status === 'offline').length
  const delayedCount = mockStations.filter(s => s.status === 'delayed').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Estações Climáticas
        </h1>
        <p className="text-gray-500">
          Monitoramento em tempo real da rede de sensores
        </p>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div>
              <div className="text-3xl font-bold text-green-700">{onlineCount}</div>
              <div className="text-sm text-green-600">Estações Online</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-3xl font-bold text-yellow-700">{delayedCount}</div>
              <div className="text-sm text-yellow-600">Com Atraso</div>
            </div>
          </div>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-3xl font-bold text-red-700">{offlineCount}</div>
              <div className="text-sm text-red-600">Offline</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockStations.map((station) => {
          const config = statusConfig[station.status]
          const StatusIcon = config.icon

          return (
            <div
              key={station.id}
              className={`bg-white rounded-xl shadow-sm border p-5 ${
                station.status === 'offline' ? 'opacity-60' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Radio className="h-5 w-5 text-blue-500" />
                  <span className="font-bold text-gray-900">{station.name}</span>
                </div>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                  <StatusIcon className="h-3 w-3" />
                  {config.label}
                </span>
              </div>

              {/* Location */}
              <p className="text-sm text-gray-500 mb-4">{station.location}</p>

              {station.status !== 'offline' ? (
                <>
                  {/* Rain Data */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <Droplets className="h-4 w-4 text-blue-500 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">{station.rainNow}</div>
                      <div className="text-xs text-gray-500">mm/h</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">1h</div>
                      <div className="text-lg font-bold text-gray-900">{station.rain1h}</div>
                      <div className="text-xs text-gray-500">mm</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">24h</div>
                      <div className="text-lg font-bold text-gray-900">{station.rain24h}</div>
                      <div className="text-xs text-gray-500">mm</div>
                    </div>
                  </div>

                  {/* Other Sensors */}
                  <div className="flex items-center justify-between text-sm border-t pt-3">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Thermometer className="h-4 w-4" />
                      {station.temperature}°C
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Wind className="h-4 w-4" />
                      {station.humidity}%
                    </div>
                    <div className="flex items-center gap-1 text-gray-500">
                      <Clock className="h-4 w-4" />
                      {station.lastUpdate}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-gray-400">
                  <XCircle className="h-8 w-8 mx-auto mb-2" />
                  <p>Sem dados disponíveis</p>
                  <p className="text-xs">Última atualização: {station.lastUpdate}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
