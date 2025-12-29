'use client'

import { useState, useEffect, useCallback } from 'react'
import type { WeatherData, AlertData } from '@/types/weather'

interface UseWeatherOptions {
  refreshInterval?: number // em milissegundos
  station?: string // código da estação específica
}

interface WeatherState {
  data: WeatherData[]
  loading: boolean
  error: string | null
  lastUpdate: Date | null
}

interface AlertsState {
  data: AlertData[]
  loading: boolean
  error: string | null
  lastUpdate: Date | null
  summary: {
    severe: number
    alert: number
    attention: number
  }
}

// Hook para dados meteorológicos
export function useWeather(options: UseWeatherOptions = {}) {
  const { refreshInterval = 5 * 60 * 1000, station } = options // 5 min padrão

  const [state, setState] = useState<WeatherState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null
  })

  const fetchWeather = useCallback(async () => {
    try {
      const url = station ? `/api/weather?station=${station}` : '/api/weather'
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setState({
          data: Array.isArray(result.data) ? result.data : [result.data],
          loading: false,
          error: null,
          lastUpdate: new Date()
        })
      } else {
        throw new Error(result.error || 'Failed to fetch weather data')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [station])

  // Buscar dados iniciais
  useEffect(() => {
    fetchWeather()
  }, [fetchWeather])

  // Atualização automática
  useEffect(() => {
    if (refreshInterval <= 0) return

    const interval = setInterval(fetchWeather, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchWeather, refreshInterval])

  return {
    ...state,
    refetch: fetchWeather
  }
}

// Hook para alertas
export function useAlerts(options: { refreshInterval?: number } = {}) {
  const { refreshInterval = 10 * 60 * 1000 } = options // 10 min padrão

  const [state, setState] = useState<AlertsState>({
    data: [],
    loading: true,
    error: null,
    lastUpdate: null,
    summary: { severe: 0, alert: 0, attention: 0 }
  })

  const fetchAlerts = useCallback(async () => {
    try {
      const response = await fetch('/api/alerts')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setState({
          data: result.data || [],
          loading: false,
          error: null,
          lastUpdate: new Date(),
          summary: result.summary || { severe: 0, alert: 0, attention: 0 }
        })
      } else {
        throw new Error(result.error || 'Failed to fetch alerts')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [])

  // Buscar dados iniciais
  useEffect(() => {
    fetchAlerts()
  }, [fetchAlerts])

  // Atualização automática
  useEffect(() => {
    if (refreshInterval <= 0) return

    const interval = setInterval(fetchAlerts, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchAlerts, refreshInterval])

  return {
    ...state,
    refetch: fetchAlerts
  }
}

// Hook para lista de estações
export function useStations() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStations() {
      try {
        const response = await fetch('/api/stations')
        const result = await response.json()

        if (result.success) {
          setData(result.data || [])
        } else {
          throw new Error(result.error || 'Failed to fetch stations')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchStations()
  }, [])

  return { data, loading, error }
}

// Utilitário para formatar tempo relativo
export function formatTimeAgo(date: Date | string | null): string {
  if (!date) return 'N/A'

  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))

  if (diffMins < 1) return 'agora'
  if (diffMins < 60) return `${diffMins} min`
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`
  return `${Math.floor(diffMins / 1440)}d`
}
