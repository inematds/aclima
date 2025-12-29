'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, XCircle, MapPin, Clock, Filter, Loader2, RefreshCw } from 'lucide-react'
import CapitalSelector from '@/components/CapitalSelector'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'
import { useWeather, formatTimeAgo } from '@/hooks/useWeather'

type AlertLevel = 'attention' | 'alert' | 'severe'

const alertConfig: Record<AlertLevel, {
  icon: typeof AlertTriangle
  color: string
  bg: string
  border: string
  label: string
  action: string
}> = {
  attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Atenção',
    action: 'Acompanhar evolução'
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Alerta',
    action: 'Monitoramento intensivo'
  },
  severe: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Severo',
    action: 'Ação imediata necessária'
  },
}

function getAlertMessage(level: AlertLevel, rain1h: number, rain24h: number): string {
  if (level === 'severe') {
    if (rain24h >= 50) {
      return `Risco de alagamento. Acumulado 24h de ${rain24h}mm ultrapassa limite crítico de 50mm.`
    }
    return `Chuva muito intensa: ${rain1h}mm/h. Risco de alagamentos e deslizamentos.`
  }
  if (level === 'alert') {
    return `Chuva intensa: ${rain1h}mm na última hora. Monitorar evolução.`
  }
  return `Chuva moderada: ${rain1h}mm na última hora. Situação sob controle.`
}

export default function AlertasPage() {
  const [selectedCapital, setSelectedCapital] = useState<CapitalSlug>('sao-paulo')
  const [filterLevel, setFilterLevel] = useState<'all' | AlertLevel>('all')

  const {
    data: weatherData,
    loading,
    error,
    refetch
  } = useWeather({ refreshInterval: 5 * 60 * 1000, capital: selectedCapital })

  const capitalInfo = BRAZILIAN_CAPITALS[selectedCapital]

  // Filtrar estações com alertas
  const stationsWithAlerts = weatherData
    .filter(w => w.alertLevel !== 'normal')
    .map(w => ({
      id: w.stationId,
      region: w.stationName,
      level: w.alertLevel as AlertLevel,
      type: w.alertLevel === 'severe' ? 'Alagamento' : w.alertLevel === 'alert' ? 'Chuva Intensa' : 'Monitoramento',
      message: getAlertMessage(w.alertLevel as AlertLevel, w.rain.last1h, w.rain.last24h),
      time: w.timestamp,
      rain1h: w.rain.last1h,
      rain24h: w.rain.last24h,
    }))
    .filter(a => filterLevel === 'all' || a.level === filterLevel)

  const severeCount = weatherData.filter(w => w.alertLevel === 'severe').length
  const alertCount = weatherData.filter(w => w.alertLevel === 'alert').length
  const attentionCount = weatherData.filter(w => w.alertLevel === 'attention').length

  if (loading && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
          <p className="text-gray-500">Carregando alertas de {capitalInfo.name}...</p>
        </div>
      </div>
    )
  }

  if (error && weatherData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-red-700 font-medium">Erro ao carregar dados</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar novamente
          </button>
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
              Alertas Hidrológicos e Risco
            </h1>
            <CapitalSelector
              selectedCapital={selectedCapital}
              onSelect={setSelectedCapital}
            />
          </div>
          <p className="text-gray-500">
            Monitoramento em tempo real - {capitalInfo.name}, {capitalInfo.stateCode}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value as 'all' | AlertLevel)}
            className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="all">Todos os níveis</option>
            <option value="severe">Severos</option>
            <option value="alert">Alertas</option>
            <option value="attention">Atenção</option>
          </select>
          <button
            onClick={() => refetch()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            Atualizar
          </button>
        </div>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-3xl font-bold text-red-700">{severeCount}</div>
              <div className="text-sm text-red-600">Alertas Severos</div>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-3xl font-bold text-orange-700">{alertCount}</div>
              <div className="text-sm text-orange-600">Alertas</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-3xl font-bold text-yellow-700">{attentionCount}</div>
              <div className="text-sm text-yellow-600">Em Atenção</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {stationsWithAlerts.length === 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Nenhum alerta ativo
            </h3>
            <p className="text-green-600">
              Todas as estações em {capitalInfo.name} estão com condições normais.
            </p>
          </div>
        ) : (
          stationsWithAlerts.map((alert) => {
            const config = alertConfig[alert.level]
            const Icon = config.icon

            return (
              <div
                key={alert.id}
                className={`${config.bg} ${config.border} border rounded-xl p-5`}
              >
                <div className="flex items-start gap-4">
                  <Icon className={`${config.color} h-6 w-6 mt-0.5 flex-shrink-0`} />

                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.color} border ${config.border}`}>
                          {config.label}
                        </span>
                        <span className="text-sm font-medium text-gray-600">
                          {alert.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {formatTimeAgo(alert.time)}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-gray-900">{alert.region}</span>
                    </div>

                    <p className="text-gray-700 mb-3">{alert.message}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-gray-500">Última 1h:</span>
                          <span className="ml-1 font-semibold">{alert.rain1h} mm</span>
                        </div>
                        <div>
                          <span className="text-gray-500">24h:</span>
                          <span className="ml-1 font-semibold">{alert.rain24h} mm</span>
                        </div>
                      </div>
                      <span className={`text-xs ${config.color}`}>
                        {config.action}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Fonte */}
      <div className="text-center text-sm text-gray-500">
        Dados meteorológicos: Open-Meteo API | Alertas calculados automaticamente
      </div>
    </div>
  )
}
