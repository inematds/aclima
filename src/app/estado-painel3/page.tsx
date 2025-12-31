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
  Loader2,
  Building2
} from 'lucide-react'
import StateSelector from '@/components/StateSelector'
import WeatherMapDynamic from '@/components/WeatherMapDynamic'
import ForecastMapsDynamic from '@/components/ForecastMapsDynamic'
import ResponsiveLayout from '@/components/ResponsiveLayout'
import MobileStatePanelDynamic from '@/components/mobile/MobileStatePanelDynamic'
import { BRAZILIAN_STATES, BRAZILIAN_CAPITALS, type StateCode } from '@/types/weather'
import { useStateWeather, formatTimeAgo } from '@/hooks/useWeather'

type SensorStatus = 'online' | 'offline' | 'warning'

const statusConfig: Record<SensorStatus, { color: string; bg: string; icon: typeof CheckCircle }> = {
  online: { color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle },
  warning: { color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertTriangle },
  offline: { color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

function EstadoPainel3Content() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<StateCode>('SP')

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    refetch: refetchWeather
  } = useStateWeather({ state: selectedState, refreshInterval: 5 * 60 * 1000 })

  const stateInfo = BRAZILIAN_STATES[selectedState]

  // Encontrar coordenadas da capital do estado
  const capitalEntry = Object.values(BRAZILIAN_CAPITALS).find(
    cap => cap.stateCode === selectedState
  )
  const capitalCoords = capitalEntry
    ? { lat: capitalEntry.latitude, lng: capitalEntry.longitude }
    : { lat: -15.7801, lng: -47.9292 }

  // Encontrar estação da capital
  const capitalStation = weatherData.find(w =>
    w.stationName.toLowerCase().includes(stateInfo?.capital?.toLowerCase() || '')
  )

  const selectCapitalStation = () => {
    if (capitalStation) {
      setSelectedStation(capitalStation.stationId)
    }
  }

  // Contar status das estações
  const onlineCount = weatherData.filter(s => s.status === 'online').length
  const delayedCount = weatherData.filter(s => s.status === 'delayed').length
  const offlineCount = weatherData.filter(s => s.status === 'offline').length

  // Estação selecionada
  const station = selectedStation
    ? weatherData.find(s => s.stationId === selectedStation)
    : weatherData[0]

  // Mapear status da estação
  const getStationStatus = (status: string): SensorStatus => {
    if (status === 'online') return 'online'
    if (status === 'delayed') return 'warning'
    return 'offline'
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              Estado: Estação Climática
            </h1>
            <StateSelector
              selectedState={selectedState}
              onSelect={setSelectedState}
            />
            {capitalStation && (
              <button
                onClick={selectCapitalStation}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedStation === capitalStation.stationId
                    ? 'bg-amber-100 text-amber-700 border border-amber-300'
                    : 'bg-gray-100 text-gray-700 hover:bg-amber-50 hover:text-amber-600'
                }`}
                title={`Ver dados de ${stateInfo?.capital}`}
              >
                <Building2 size={14} />
                <span>{stateInfo?.capital}</span>
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500">
            Dados em tempo real dos sensores INMET - {stateInfo?.name}
          </p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>{onlineCount} online</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <span>{delayedCount} atrasadas</span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            <span>{offlineCount} offline</span>
          </div>
        </div>
      </div>

      {weatherLoading && weatherData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500">Carregando estações de {stateInfo?.name}...</p>
            <p className="text-xs text-gray-400 mt-1">Buscando dados de múltiplas estações INMET</p>
          </div>
        </div>
      ) : weatherError && weatherData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Erro ao carregar dados</p>
            <button
              onClick={() => refetchWeather()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-4">
          {/* Lista de Estações */}
          <div className="col-span-3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
            <div className="p-3 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Estações INMET</h2>
              <p className="text-xs text-gray-500">{weatherData.length} estações em {stateInfo?.name}</p>
            </div>

            <div className="flex-1 overflow-auto">
              {weatherData.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  <p>Nenhuma estação encontrada</p>
                </div>
              ) : (
                weatherData.map((s) => {
                  const status = getStationStatus(s.status)
                  const config = statusConfig[status]
                  const StatusIcon = config.icon

                  return (
                    <button
                      key={s.stationId}
                      className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                        selectedStation === s.stationId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => setSelectedStation(s.stationId)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Radio className="h-4 w-4 text-blue-500" />
                          <span className="font-medium text-gray-900">{s.stationId}</span>
                        </div>
                        <StatusIcon className={`h-4 w-4 ${config.color}`} />
                      </div>
                      <p className="text-sm text-gray-600 truncate">{s.stationName}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-400">{s.rain.last1h}mm/1h</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(s.timestamp)}
                        </span>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Indicadores Numéricos */}
          <div className="col-span-6 flex flex-col gap-4">
            {station ? (
              <>
                {/* Header da estação selecionada */}
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <Radio className={`h-6 w-6 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{station.stationName}</h3>
                        <p className="text-sm text-gray-500">{station.stationId} • Estação INMET</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="flex items-center gap-1 text-sm">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{formatTimeAgo(station.timestamp)}</span>
                        </div>
                        <p className="text-xs text-gray-400">Atualização</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Grid de Sensores */}
                <div className="grid grid-cols-3 gap-3">
                  {/* Precipitação */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Precipitação</span>
                      </div>
                      <div className={`p-1 rounded ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <CheckCircle className={`h-3 w-3 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{station.rain.current}</span>
                      <span className="text-lg text-gray-500">mm/h</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>1h: {station.rain.last1h}mm</span>
                      <span>24h: {station.rain.last24h}mm</span>
                    </div>
                  </div>

                  {/* Temperatura */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Thermometer className="h-5 w-5 text-red-500" />
                        <span className="text-sm font-medium text-gray-700">Temperatura</span>
                      </div>
                      <div className={`p-1 rounded ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <CheckCircle className={`h-3 w-3 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{station.temperature.current}</span>
                      <span className="text-lg text-gray-500">°C</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Min: {station.temperature.min}°C</span>
                      <span>Máx: {station.temperature.max}°C</span>
                    </div>
                  </div>

                  {/* Umidade */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-5 w-5 text-cyan-500" />
                        <span className="text-sm font-medium text-gray-700">Umidade</span>
                      </div>
                      <div className={`p-1 rounded ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <CheckCircle className={`h-3 w-3 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{station.humidity.current}</span>
                      <span className="text-lg text-gray-500">%</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Min: {station.humidity.min}%</span>
                      <span>Máx: {station.humidity.max}%</span>
                    </div>
                  </div>

                  {/* Vento */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Wind className="h-5 w-5 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Vento</span>
                      </div>
                      <div className={`p-1 rounded ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <CheckCircle className={`h-3 w-3 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{station.wind.speed}</span>
                      <span className="text-lg text-gray-500">km/h</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>Dir: {station.wind.direction}°</span>
                      <span>Rajada: {station.wind.gust}km/h</span>
                    </div>
                  </div>

                  {/* Pressão */}
                  <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Gauge className="h-5 w-5 text-purple-500" />
                        <span className="text-sm font-medium text-gray-700">Pressão</span>
                      </div>
                      <div className={`p-1 rounded ${statusConfig[getStationStatus(station.status)].bg}`}>
                        <CheckCircle className={`h-3 w-3 ${statusConfig[getStationStatus(station.status)].color}`} />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold text-gray-900">{station.pressure}</span>
                      <span className="text-lg text-gray-500">hPa</span>
                    </div>
                  </div>

                  {/* Nível de Alerta */}
                  <div className={`rounded-lg shadow-sm border p-4 ${
                    station.alertLevel === 'severe' ? 'bg-red-50 border-red-200' :
                    station.alertLevel === 'alert' ? 'bg-orange-50 border-orange-200' :
                    station.alertLevel === 'attention' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-5 w-5 ${
                          station.alertLevel === 'severe' ? 'text-red-500' :
                          station.alertLevel === 'alert' ? 'text-orange-500' :
                          station.alertLevel === 'attention' ? 'text-yellow-500' :
                          'text-green-500'
                        }`} />
                        <span className="text-sm font-medium text-gray-700">Nível de Alerta</span>
                      </div>
                    </div>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-bold ${
                        station.alertLevel === 'severe' ? 'text-red-700' :
                        station.alertLevel === 'alert' ? 'text-orange-700' :
                        station.alertLevel === 'attention' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>
                        {station.alertLevel === 'severe' ? 'SEVERO' :
                         station.alertLevel === 'alert' ? 'ALERTA' :
                         station.alertLevel === 'attention' ? 'ATENÇÃO' : 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white rounded-lg shadow-sm border">
                <p className="text-gray-500">Selecione uma estação</p>
              </div>
            )}
          </div>

          {/* Status e Resumo */}
          <div className="col-span-3 flex flex-col gap-4">
            {/* Mapa */}
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="p-2 border-b bg-gray-50">
                <h3 className="font-semibold text-gray-900 text-sm">Mapa - {stateInfo?.name}</h3>
              </div>
              <div className="h-[280px]">
                <WeatherMapDynamic
                  stations={weatherData}
                  selectedStation={selectedStation}
                  onStationSelect={setSelectedStation}
                  className="h-full"
                />
              </div>
            </div>

            {/* Resumo do Estado */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Resumo - {stateInfo?.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">Total de Estações</span>
                  <span className="font-bold">{weatherData.length}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <span className="text-sm text-gray-700">Online</span>
                  <span className="font-bold text-green-600">{onlineCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                  <span className="text-sm text-gray-700">Atrasadas</span>
                  <span className="font-bold text-yellow-600">{delayedCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-red-50 rounded">
                  <span className="text-sm text-gray-700">Offline</span>
                  <span className="font-bold text-red-600">{offlineCount}</span>
                </div>
              </div>
            </div>

            {/* Médias */}
            {weatherData.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Médias do Estado</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-blue-500" />
                      <span className="text-sm text-gray-600">Chuva (1h)</span>
                    </div>
                    <span className="font-medium">
                      {(weatherData.reduce((sum, s) => sum + s.rain.last1h, 0) / weatherData.length).toFixed(1)} mm
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">Temperatura</span>
                    </div>
                    <span className="font-medium">
                      {(weatherData.reduce((sum, s) => sum + s.temperature.current, 0) / weatherData.length).toFixed(1)}°C
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-cyan-500" />
                      <span className="text-sm text-gray-600">Umidade</span>
                    </div>
                    <span className="font-medium">
                      {Math.round(weatherData.reduce((sum, s) => sum + s.humidity.current, 0) / weatherData.length)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Alertas */}
            <div className="bg-white rounded-lg shadow-sm border p-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-semibold text-gray-900 mb-3">Estações em Alerta</h3>
              <div className="space-y-2 overflow-auto flex-1">
                {weatherData.filter(s => s.alertLevel !== 'normal').length === 0 ? (
                  <div className="text-center py-4 text-green-600">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Todas as estações normais</p>
                  </div>
                ) : (
                  weatherData.filter(s => s.alertLevel !== 'normal').slice(0, 10).map(s => (
                    <div
                      key={s.stationId}
                      className={`p-2 rounded flex items-center gap-2 cursor-pointer ${
                        s.alertLevel === 'severe' ? 'bg-red-50' :
                        s.alertLevel === 'alert' ? 'bg-orange-50' : 'bg-yellow-50'
                      }`}
                      onClick={() => setSelectedStation(s.stationId)}
                    >
                      <AlertTriangle className={`h-4 w-4 ${
                        s.alertLevel === 'severe' ? 'text-red-500' :
                        s.alertLevel === 'alert' ? 'text-orange-500' : 'text-yellow-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{s.stationName}</p>
                        <p className="text-xs text-gray-500">{s.stationId} | {s.rain.last1h}mm/1h</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Mapas de Previsão - Seção Final */}
      {weatherData.length > 0 && (
        <div className="mt-4 bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
            <h2 className="text-lg font-semibold text-gray-900">
              Mapas de Previsão - {stateInfo?.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Radar de precipitação e camadas meteorológicas em tempo real
            </p>
          </div>
          <div className="p-4">
            <ForecastMapsDynamic
              latitude={capitalCoords.lat}
              longitude={capitalCoords.lng}
            />
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-4 text-center text-xs text-gray-500">
        Fonte: Estações INMET + Open-Meteo API | Atualização a cada 5 minutos
      </div>
    </div>
  )
}

export default function EstadoPainel3Page() {
  return (
    <ResponsiveLayout mobileContent={<MobileStatePanelDynamic />}>
      <EstadoPainel3Content />
    </ResponsiveLayout>
  )
}
