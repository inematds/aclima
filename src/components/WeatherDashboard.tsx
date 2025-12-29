'use client'

import { useState, useEffect } from 'react'
import { useWeather, useAlerts, formatTimeAgo } from '@/hooks/useWeather'
import CapitalSelector from './CapitalSelector'
import {
  Droplets,
  Thermometer,
  Wind,
  AlertTriangle,
  RefreshCw,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2
} from 'lucide-react'
import type { CapitalSlug } from '@/types/weather'
import { BRAZILIAN_CAPITALS } from '@/types/weather'

const alertColors = {
  normal: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  attention: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  alert: { bg: 'bg-orange-100', border: 'border-orange-500', text: 'text-orange-700' },
  severe: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
}

const statusColors = {
  online: 'text-green-500',
  delayed: 'text-yellow-500',
  offline: 'text-red-500',
}

export default function WeatherDashboard() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')

  const {
    data: weatherData,
    loading: weatherLoading,
    error: weatherError,
    lastUpdate,
    refetch: refetchWeather
  } = useWeather({ refreshInterval: 5 * 60 * 1000, capital: selectedCapital }) // 5 minutos

  const {
    data: alertsData,
    loading: alertsLoading,
    summary,
    refetch: refetchAlerts
  } = useAlerts({ refreshInterval: 10 * 60 * 1000 }) // 10 minutos

  const handleRefresh = () => {
    refetchWeather()
    refetchAlerts()
  }

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  // Calcular estatísticas gerais
  const stats = {
    avgRain: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.rain.current, 0) / weatherData.length
      : 0,
    maxRain1h: weatherData.length > 0
      ? Math.max(...weatherData.map(w => w.rain.last1h))
      : 0,
    maxRain24h: weatherData.length > 0
      ? Math.max(...weatherData.map(w => w.rain.last24h))
      : 0,
    avgTemp: weatherData.length > 0
      ? weatherData.reduce((sum, w) => sum + w.temperature.current, 0) / weatherData.length
      : 0,
  }

  if (weatherLoading && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando dados do INMET...</p>
        </div>
      </div>
    )
  }

  if (weatherError && weatherData.length === 0) {
    return (
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
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">
              Situação Meteorológica
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Última atualização: {lastUpdate ? formatTimeAgo(lastUpdate) : 'N/A'}
            {weatherLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm text-gray-600">Dados INMET</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={weatherLoading}
            className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${weatherLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          stats.avgRain > 5 ? 'border-orange-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Chuva Média</span>
            <Droplets className="h-5 w-5 text-blue-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.avgRain.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">mm/h</span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {weatherData.length} estações
          </p>
        </div>

        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          stats.maxRain1h >= 30 ? 'border-red-500' :
          stats.maxRain1h >= 10 ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Máx. 1 hora</span>
            <TrendingUp className="h-5 w-5 text-orange-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.maxRain1h.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">mm</span>
          </div>
        </div>

        <div className="rounded-xl border-l-4 p-4 bg-white shadow-sm border-blue-500">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Temperatura Média</span>
            <Thermometer className="h-5 w-5 text-red-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {stats.avgTemp.toFixed(1)}
            </span>
            <span className="text-lg text-gray-500">°C</span>
          </div>
        </div>

        <div className={`rounded-xl border-l-4 p-4 bg-white shadow-sm ${
          summary.severe > 0 ? 'border-red-500' :
          summary.alert > 0 ? 'border-orange-500' :
          summary.attention > 0 ? 'border-yellow-500' : 'border-green-500'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Alertas Ativos</span>
            <AlertTriangle className={`h-5 w-5 ${
              summary.severe > 0 ? 'text-red-500' : 'text-yellow-500'
            }`} />
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-bold text-gray-900">
              {alertsData.length}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {summary.severe} severos, {summary.alert} alertas
          </p>
        </div>
      </div>

      {/* Lista de estações */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Estações Monitoradas ({weatherData.length})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="pb-3 font-medium">Estação</th>
                <th className="pb-3 font-medium text-center">Agora</th>
                <th className="pb-3 font-medium text-center">1h</th>
                <th className="pb-3 font-medium text-center">24h</th>
                <th className="pb-3 font-medium text-center">Temp</th>
                <th className="pb-3 font-medium text-center">Status</th>
                <th className="pb-3 font-medium text-center">Atualização</th>
              </tr>
            </thead>
            <tbody>
              {weatherData.map((station) => {
                const colors = alertColors[station.alertLevel]

                return (
                  <tr
                    key={station.stationId}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${colors.bg} ${colors.border} border`} />
                        <div>
                          <p className="font-medium text-gray-900">{station.stationName}</p>
                          <p className="text-xs text-gray-400">{station.stationId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 text-center">
                      <span className="font-semibold">{station.rain.current}</span>
                      <span className="text-gray-400 text-sm"> mm/h</span>
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.rain.last1h} mm
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.rain.last24h} mm
                    </td>
                    <td className="py-3 text-center text-gray-600">
                      {station.temperature.current}°C
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}>
                        {station.alertLevel === 'normal' ? 'Normal' :
                         station.alertLevel === 'attention' ? 'Atenção' :
                         station.alertLevel === 'alert' ? 'Alerta' : 'Severo'}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      <span className={`text-sm ${statusColors[station.status]}`}>
                        {formatTimeAgo(station.timestamp)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {weatherData.length === 0 && !weatherLoading && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma estação encontrada</p>
          </div>
        )}
      </div>

      {/* Alertas */}
      {alertsData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas Ativos
          </h2>
          <div className="space-y-3">
            {alertsData.slice(0, 5).map((alert) => {
              const colors = alertColors[alert.level]
              return (
                <div
                  key={alert.id}
                  className={`${colors.bg} rounded-lg p-4 border ${colors.border}`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 ${colors.text} flex-shrink-0 mt-0.5`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${colors.text}`}>
                          {alert.region}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTimeAgo(alert.startTime)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">Fonte: {alert.source}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
