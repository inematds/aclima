'use client'

import { useState, useEffect, useCallback } from 'react'
import type { CapitalSlug, StateCode } from '@/types/weather'
import type { ForecastData } from '@/app/api/forecast/route'

interface UseForecastOptions {
  days?: number
  capital?: CapitalSlug
  state?: StateCode
  refreshInterval?: number
}

interface ForecastState {
  data: ForecastData | null
  loading: boolean
  error: string | null
  lastUpdate: Date | null
}

export function useForecast(options: UseForecastOptions = {}) {
  const { days = 7, capital, state: stateCode, refreshInterval = 30 * 60 * 1000 } = options

  const [state, setState] = useState<ForecastState>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  })

  const fetchForecast = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({ days: days.toString() })
      if (stateCode) params.set('state', stateCode)
      else if (capital) params.set('capital', capital)

      const response = await fetch(`/api/forecast?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        })
      } else {
        throw new Error(result.error || 'Failed to fetch forecast')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [days, capital, stateCode])

  useEffect(() => {
    fetchForecast()
  }, [fetchForecast])

  useEffect(() => {
    if (refreshInterval <= 0) return
    const interval = setInterval(fetchForecast, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchForecast, refreshInterval])

  return {
    ...state,
    refetch: fetchForecast
  }
}

export function useHistorical(options: UseForecastOptions = {}) {
  const { days = 30, capital, state: stateCode, refreshInterval = 60 * 60 * 1000 } = options

  const [state, setState] = useState<{
    data: any | null
    loading: boolean
    error: string | null
    lastUpdate: Date | null
  }>({
    data: null,
    loading: true,
    error: null,
    lastUpdate: null
  })

  const fetchHistorical = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }))

    try {
      const params = new URLSearchParams({ days: days.toString() })
      if (stateCode) params.set('state', stateCode)
      else if (capital) params.set('capital', capital)

      const response = await fetch(`/api/historical?${params}`)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()

      if (result.success) {
        setState({
          data: result.data,
          loading: false,
          error: null,
          lastUpdate: new Date()
        })
      } else {
        throw new Error(result.error || 'Failed to fetch historical data')
      }
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }))
    }
  }, [days, capital, stateCode])

  useEffect(() => {
    fetchHistorical()
  }, [fetchHistorical])

  useEffect(() => {
    if (refreshInterval <= 0) return
    const interval = setInterval(fetchHistorical, refreshInterval)
    return () => clearInterval(interval)
  }, [fetchHistorical, refreshInterval])

  return {
    ...state,
    refetch: fetchHistorical
  }
}

// Weather code to description and icon
export const WEATHER_CODES: Record<number, { description: string; icon: string }> = {
  0: { description: 'Céu limpo', icon: '☀️' },
  1: { description: 'Principalmente limpo', icon: '🌤️' },
  2: { description: 'Parcialmente nublado', icon: '⛅' },
  3: { description: 'Nublado', icon: '☁️' },
  45: { description: 'Nevoeiro', icon: '🌫️' },
  48: { description: 'Nevoeiro com geada', icon: '🌫️' },
  51: { description: 'Garoa leve', icon: '🌧️' },
  53: { description: 'Garoa moderada', icon: '🌧️' },
  55: { description: 'Garoa intensa', icon: '🌧️' },
  56: { description: 'Garoa congelante leve', icon: '🌧️' },
  57: { description: 'Garoa congelante intensa', icon: '🌧️' },
  61: { description: 'Chuva leve', icon: '🌦️' },
  63: { description: 'Chuva moderada', icon: '🌧️' },
  65: { description: 'Chuva forte', icon: '🌧️' },
  66: { description: 'Chuva congelante leve', icon: '🌧️' },
  67: { description: 'Chuva congelante forte', icon: '🌧️' },
  71: { description: 'Neve leve', icon: '🌨️' },
  73: { description: 'Neve moderada', icon: '🌨️' },
  75: { description: 'Neve forte', icon: '🌨️' },
  77: { description: 'Grãos de neve', icon: '🌨️' },
  80: { description: 'Pancadas de chuva leve', icon: '🌦️' },
  81: { description: 'Pancadas de chuva moderada', icon: '🌧️' },
  82: { description: 'Pancadas de chuva forte', icon: '🌧️' },
  85: { description: 'Pancadas de neve leve', icon: '🌨️' },
  86: { description: 'Pancadas de neve forte', icon: '🌨️' },
  95: { description: 'Trovoada', icon: '⛈️' },
  96: { description: 'Trovoada com granizo leve', icon: '⛈️' },
  99: { description: 'Trovoada com granizo forte', icon: '⛈️' }
}

export function getWeatherInfo(code: number) {
  return WEATHER_CODES[code] || { description: 'Desconhecido', icon: '❓' }
}
