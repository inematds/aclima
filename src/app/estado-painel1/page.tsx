'use client'

import { useState } from 'react'
import {
  Droplets,
  TrendingUp,
  Minus,
  AlertTriangle,
  RefreshCw,
  Loader2
} from 'lucide-react'
import StateSelector from '@/components/StateSelector'
import WeatherMapDynamic from '@/components/WeatherMapDynamic'
import { BRAZILIAN_STATES, type StateCode } from '@/types/weather'
import { useStateWeather, useAlerts, formatTimeAgo } from '@/hooks/useWeather'

type RiskLevel = 'normal' | 'attention' | 'alert' | 'severe'

const riskConfig: Record<RiskLevel, { color: string; bg: string; label: string }> = {
  normal: { color: 'text-green-700', bg: 'bg-green-500', label: 'Normal' },
  attention: { color: 'text-yellow-700', bg: 'bg-yellow-500', label: 'Atenção' },
  alert: { color: 'text-orange-700', bg: 'bg-orange-500', label: 'Alerta' },
  severe: { color: 'text-red-700', bg: 'bg-red-500', label: 'Severo' },
}

export default function EstadoPainel1Page() {
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedState, setSelectedState] = useState<StateCode>('SP')

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    lastUpdate,
    refetch: refetchWeather
  } = useStateWeather({ state: selectedState, refreshInterval: 5 * 60 * 1000 })

  const {
    data: alertsData,
    summary,
    refetch: refetchAlerts
  } = useAlerts({ refreshInterval: 10 * 60 * 1000 })

  const handleRefresh = () => {
    refetchWeather()
    refetchAlerts()
  }

  const stateInfo = BRAZILIAN_STATES[selectedState]

  // Calcular estatísticas
  const stats = {
    avgRain30min: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.rain.last30min, 0) / weatherData.length
      : 0,
    avgRain1h: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.rain.last1h, 0) / weatherData.length
      : 0,
    avgRain24h: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.rain.last24h, 0) / weatherData.length
      : 0,
    maxRain1h: weatherData.length > 0
      ? Math.max(...weatherData.map(w => w.rain.last1h))
      : 0,
  }

  const alertCount = weatherData.filter(w => w.alertLevel !== 'normal').length
  const severeCount = weatherData.filter(w => w.alertLevel === 'severe').length

  // Calcular nível de risco geral
  const getRiskLevel = (): RiskLevel => {
    if (severeCount > 0) return 'severe'
    if (weatherData.some(w => w.alertLevel === 'alert')) return 'alert'
    if (weatherData.some(w => w.alertLevel === 'attention')) return 'attention'
    return 'normal'
  }

  const riskLevel = getRiskLevel()
  const riskPercentage = riskLevel === 'severe' ? 100 : riskLevel === 'alert' ? 75 : riskLevel === 'attention' ? 50 : 25

  // Estação selecionada para detalhes
  const selectedWeather = selectedStation
    ? weatherData.find(w => w.stationId === selectedStation)
    : weatherData[0]

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-gray-900">
              Estado: Situação Meteorológica
            </h1>
            <StateSelector
              selectedState={selectedState}
              onSelect={setSelectedState}
            />
          </div>
          <p className="text-sm text-gray-500">
            Visão integrada das estações INMET em {stateInfo?.name || selectedState}
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
          <button
            onClick={handleRefresh}
            disabled={weatherLoading}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <RefreshCw size={14} className={weatherLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {weatherLoading && weatherData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
            <p className="text-gray-500">Carregando estações de {stateInfo?.name || selectedState}...</p>
            <p className="text-xs text-gray-400 mt-1">Buscando dados de múltiplas estações INMET</p>
          </div>
        </div>
      ) : weatherError && weatherData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-medium">Erro ao carregar dados</p>
            <p className="text-red-600 text-sm">{weatherError}</p>
            <button
              onClick={handleRefresh}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Layout principal - 3 colunas */}
          <div className="flex-1 grid grid-cols-12 gap-4 min-h-0">

            {/* Coluna 1: Lista de Estações */}
            <div className="col-span-5 bg-white rounded-lg shadow-sm border overflow-hidden flex flex-col">
              <div className="p-3 border-b bg-gray-50">
                <h2 className="font-semibold text-gray-900">Estações em {stateInfo?.name}</h2>
                <p className="text-xs text-gray-500">{weatherData.length} estações INMET ativas</p>
              </div>

              {/* Header da tabela */}
              <div className="grid grid-cols-12 gap-1 px-3 py-2 text-xs font-medium text-gray-500 bg-gray-50 border-b">
                <div className="col-span-4">Estação</div>
                <div className="col-span-2 text-center">Agora</div>
                <div className="col-span-2 text-center">1h</div>
                <div className="col-span-2 text-center">24h</div>
                <div className="col-span-2 text-center">Risco</div>
              </div>

              {/* Lista scrollável */}
              <div className="flex-1 overflow-auto">
                {weatherData.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    <p>Nenhuma estação encontrada</p>
                  </div>
                ) : (
                  weatherData.map((station) => (
                    <div
                      key={station.stationId}
                      className={`grid grid-cols-12 gap-1 px-3 py-2 border-b border-gray-100 hover:bg-blue-50 cursor-pointer transition-colors ${
                        selectedStation === station.stationId ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedStation(station.stationId)}
                    >
                      <div className="col-span-4 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${riskConfig[station.alertLevel].bg}`} />
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{station.stationName}</p>
                          <p className="text-xs text-gray-400">{station.stationId}</p>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center">
                        <div className="text-center">
                          <span className="text-sm font-semibold">{station.rain.current}</span>
                          <span className="text-xs text-gray-400 ml-0.5">mm/h</span>
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center justify-center text-sm text-gray-600">
                        {station.rain.last1h} mm
                      </div>
                      <div className="col-span-2 flex items-center justify-center text-sm text-gray-600">
                        {station.rain.last24h} mm
                      </div>
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <span className={`text-xs font-medium ${riskConfig[station.alertLevel].color}`}>
                          {riskConfig[station.alertLevel].label}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Coluna 2: Gráficos e Estatísticas */}
            <div className="col-span-4 flex flex-col gap-4">
              {/* Dados da estação selecionada */}
              {selectedWeather && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {selectedWeather.stationName}
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">
                    {selectedWeather.stationId} | Última atualização: {formatTimeAgo(selectedWeather.timestamp)}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <Droplets className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                      <div className="text-xl font-bold text-blue-700">{selectedWeather.rain.current}</div>
                      <div className="text-xs text-gray-500">mm/h agora</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <TrendingUp className="h-5 w-5 text-orange-500 mx-auto mb-1" />
                      <div className="text-xl font-bold text-orange-700">{selectedWeather.rain.last1h}</div>
                      <div className="text-xs text-gray-500">mm última hora</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Acumulados */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Acumulados Médios - {stateInfo?.name}</h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-xs text-gray-500">30 min</div>
                    <div className="text-xl font-bold text-blue-700">{stats.avgRain30min.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">mm</div>
                  </div>
                  <div className="text-center p-3 bg-yellow-50 rounded-lg">
                    <div className="text-xs text-gray-500">1 hora</div>
                    <div className="text-xl font-bold text-yellow-700">{stats.avgRain1h.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">mm</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-xs text-gray-500">24 horas</div>
                    <div className="text-xl font-bold text-red-700">{stats.avgRain24h.toFixed(1)}</div>
                    <div className="text-xs text-gray-400">mm</div>
                  </div>
                </div>
              </div>

              {/* Tendência de Risco */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Nível de Risco do Estado</h3>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 via-yellow-500 via-orange-500 to-red-500 transition-all"
                      style={{ width: `${riskPercentage}%` }}
                    />
                  </div>
                  <div className={`flex items-center gap-1 ${riskConfig[riskLevel].color}`}>
                    {riskLevel === 'normal' ? <Minus className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                    <span className="text-sm font-semibold">{riskConfig[riskLevel].label}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Máxima 1h: {stats.maxRain1h.toFixed(1)} mm | {alertCount} de {weatherData.length} estações em alerta
                </p>
              </div>

              {/* Temperatura e Umidade */}
              {selectedWeather && (
                <div className="bg-white rounded-lg shadow-sm border p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Condições Atuais</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="text-2xl">🌡️</div>
                      <div>
                        <div className="text-lg font-bold">{selectedWeather.temperature.current}°C</div>
                        <div className="text-xs text-gray-500">Temperatura</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                      <div className="text-2xl">💧</div>
                      <div>
                        <div className="text-lg font-bold">{selectedWeather.humidity.current}%</div>
                        <div className="text-xs text-gray-500">Umidade</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Coluna 3: Mapa e Alertas */}
            <div className="col-span-3 flex flex-col gap-4">
              {/* Mapa */}
              <div className="flex-1 bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="p-3 border-b bg-gray-50">
                  <h3 className="font-semibold text-gray-900">Mapa - {stateInfo?.name}</h3>
                </div>
                <div className="h-[calc(100%-48px)]">
                  <WeatherMapDynamic
                    stations={weatherData}
                    selectedStation={selectedStation}
                    onStationSelect={setSelectedStation}
                    className="h-full"
                  />
                </div>
              </div>

              {/* Mini Alertas */}
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">Estações em Alerta</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    alertCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {alertCount}/{weatherData.length}
                  </span>
                </div>
                <div className="space-y-2 max-h-40 overflow-auto">
                  {weatherData.filter(w => w.alertLevel !== 'normal').length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-2">
                      Nenhum alerta ativo no estado
                    </p>
                  ) : (
                    weatherData.filter(w => w.alertLevel !== 'normal').slice(0, 5).map(station => (
                      <div key={station.stationId} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <AlertTriangle className={`h-4 w-4 ${riskConfig[station.alertLevel].color}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{station.stationName}</p>
                          <p className="text-xs text-gray-500">{station.rain.last1h}mm/1h | {station.rain.last24h}mm/24h</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Legenda */}
          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Normal (&lt;10mm/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Atenção (≥10mm/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500" />
              <span>Alerta (≥20mm/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span>Severo (≥30mm/h ou ≥50mm/24h)</span>
            </div>
            <div className="text-gray-400">|</div>
            <span>Fonte: Estações INMET + Open-Meteo</span>
          </div>
        </>
      )}
    </div>
  )
}
