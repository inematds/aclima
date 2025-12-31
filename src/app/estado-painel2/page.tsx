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
  Bell,
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

type AlertLevel = 'attention' | 'alert' | 'severe'

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

function EstadoPainel2Content() {
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

  // Filtrar estações com alertas
  const stationsWithAlerts = weatherData.filter(w => w.alertLevel !== 'normal')
  const severeCount = stationsWithAlerts.filter(s => s.alertLevel === 'severe').length
  const alertCount = stationsWithAlerts.filter(s => s.alertLevel === 'alert').length
  const attentionCount = stationsWithAlerts.filter(s => s.alertLevel === 'attention').length

  const selectedWeather = selectedStation
    ? weatherData.find(w => w.stationId === selectedStation)
    : stationsWithAlerts[0] || weatherData[0]

  const getAlertLevel = (level: string): AlertLevel => {
    if (level === 'severe') return 'severe'
    if (level === 'alert') return 'alert'
    return 'attention'
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              Estado: Alertas Hidrológicos
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
            Monitoramento em tempo real - {stateInfo?.name} ({weatherData.length} estações INMET)
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stationsWithAlerts.length > 0 && (
            <Bell className="h-5 w-5 text-red-500 animate-pulse" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {stationsWithAlerts.length} de {weatherData.length} em alerta
          </span>
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
        <>
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

          {/* Layout principal */}
          <div className="grid grid-cols-12 gap-4">
            {/* Mapa de Status */}
            <div className="col-span-5 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Mapa - {stateInfo?.name}</h2>
                <div className="flex gap-2">
                  {(['severe', 'alert', 'attention'] as AlertLevel[]).map(level => (
                    <div key={level} className="flex items-center gap-1">
                      <div className={`w-3 h-3 rounded-full ${
                        level === 'severe' ? 'bg-red-500' :
                        level === 'alert' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-xs text-gray-500">
                        {stationsWithAlerts.filter(s => s.alertLevel === level).length}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapa */}
              <div className="flex-1">
                <WeatherMapDynamic
                  stations={weatherData}
                  selectedStation={selectedStation}
                  onStationSelect={setSelectedStation}
                  className="h-full"
                />
              </div>
            </div>

            {/* Lista de Alertas */}
            <div className="col-span-3 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Estações em Alerta</h2>
                <p className="text-xs text-gray-500">{stationsWithAlerts.length} de {weatherData.length}</p>
              </div>

              <div className="flex-1 overflow-auto">
                {stationsWithAlerts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">Nenhum alerta ativo no estado</p>
                  </div>
                ) : (
                  stationsWithAlerts.map((station) => {
                    const level = getAlertLevel(station.alertLevel)
                    const config = alertLevelConfig[level]
                    const Icon = config.icon

                    return (
                      <button
                        key={station.stationId}
                        className={`w-full text-left p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                          selectedStation === station.stationId ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => setSelectedStation(station.stationId)}
                      >
                        <div className="flex items-start gap-2">
                          <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {config.label}
                              </span>
                              <span className="text-xs text-gray-400">{station.stationId}</span>
                            </div>
                            <p className="font-medium text-gray-900 text-sm mt-1 truncate">
                              {station.stationName}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {station.rain.last1h}mm/1h | {station.rain.last24h}mm/24h
                            </p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            </div>

            {/* Painel de Detalhes */}
            <div className="col-span-4 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Detalhes da Estação</h2>
              </div>

              {selectedWeather ? (
                <div className="flex-1 p-4 overflow-auto">
                  {/* Cabeçalho de Alerta */}
                  {selectedWeather.alertLevel !== 'normal' && (
                    <div className={`${alertLevelConfig[getAlertLevel(selectedWeather.alertLevel)].bg} ${alertLevelConfig[getAlertLevel(selectedWeather.alertLevel)].border} border rounded-lg p-4 mb-4`}>
                      <div className="flex items-center gap-2 mb-2">
                        {(() => {
                          const level = getAlertLevel(selectedWeather.alertLevel)
                          const Icon = alertLevelConfig[level].icon
                          return <Icon className={`h-6 w-6 ${alertLevelConfig[level].color}`} />
                        })()}
                        <span className={`font-bold ${alertLevelConfig[getAlertLevel(selectedWeather.alertLevel)].color}`}>
                          {alertLevelConfig[getAlertLevel(selectedWeather.alertLevel)].label}
                        </span>
                      </div>
                      <p className="text-gray-700">
                        Precipitação elevada detectada nesta estação.
                      </p>
                    </div>
                  )}

                  {/* Estação */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Estação INMET</h4>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{selectedWeather.stationName}</span>
                    </div>
                    <p className="text-sm text-gray-500 ml-6">{selectedWeather.stationId}</p>
                  </div>

                  {/* Tempo */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Última Atualização</h4>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{formatTimeAgo(selectedWeather.timestamp)}</span>
                    </div>
                  </div>

                  {/* Precipitação */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Precipitação</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                        <div className="text-xl font-bold">{selectedWeather.rain.current}</div>
                        <div className="text-xs text-gray-500">mm/h</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Droplets className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                        <div className="text-xl font-bold">{selectedWeather.rain.last1h}</div>
                        <div className="text-xs text-gray-500">mm/1h</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <Droplets className="h-5 w-5 text-blue-700 mx-auto mb-1" />
                        <div className="text-xl font-bold">{selectedWeather.rain.last24h}</div>
                        <div className="text-xs text-gray-500">mm/24h</div>
                      </div>
                    </div>
                  </div>

                  {/* Condições */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Condições</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Temperatura</div>
                        <div className="text-lg font-bold">{selectedWeather.temperature.current}°C</div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs text-gray-500">Umidade</div>
                        <div className="text-lg font-bold">{selectedWeather.humidity.current}%</div>
                      </div>
                    </div>
                  </div>

                  {/* Fonte */}
                  <div className="mb-4">
                    <h4 className="text-xs font-medium text-gray-500 uppercase mb-1">Fonte dos Dados</h4>
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700 text-sm">Estações INMET + Open-Meteo API</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                  <p>Selecione uma estação para ver detalhes</p>
                </div>
              )}
            </div>
          </div>

        </>
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
    </div>
  )
}

export default function EstadoPainel2Page() {
  return (
    <ResponsiveLayout mobileContent={<MobileStatePanelDynamic />}>
      <EstadoPainel2Content />
    </ResponsiveLayout>
  )
}
