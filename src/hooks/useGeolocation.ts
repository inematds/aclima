'use client'

import { useState, useEffect } from 'react'
import { BRAZILIAN_STATES, type StateCode } from '@/types/weather'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  state: StateCode | null
  loading: boolean
  error: string | null
  permission: 'granted' | 'denied' | 'prompt' | null
}

// Mapeamento aproximado de coordenadas para estados
// Baseado nos centros geográficos dos estados
const STATE_BOUNDS: Record<StateCode, { latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  'AC': { latMin: -11.15, latMax: -7.11, lonMin: -73.99, lonMax: -66.62 },
  'AL': { latMin: -10.50, latMax: -8.81, lonMin: -38.24, lonMax: -35.09 },
  'AP': { latMin: -1.23, latMax: 4.44, lonMin: -54.87, lonMax: -49.87 },
  'AM': { latMin: -9.82, latMax: 2.25, lonMin: -73.80, lonMax: -56.10 },
  'BA': { latMin: -18.35, latMax: -8.53, lonMin: -46.62, lonMax: -37.34 },
  'CE': { latMin: -7.86, latMax: -2.78, lonMin: -41.42, lonMax: -37.25 },
  'DF': { latMin: -16.05, latMax: -15.50, lonMin: -48.29, lonMax: -47.31 },
  'ES': { latMin: -21.30, latMax: -17.89, lonMin: -41.88, lonMax: -39.68 },
  'GO': { latMin: -19.50, latMax: -12.39, lonMin: -53.25, lonMax: -45.91 },
  'MA': { latMin: -10.26, latMax: -1.04, lonMin: -48.76, lonMax: -41.79 },
  'MT': { latMin: -18.04, latMax: -7.35, lonMin: -61.63, lonMax: -50.22 },
  'MS': { latMin: -24.07, latMax: -17.17, lonMin: -58.17, lonMax: -53.26 },
  'MG': { latMin: -22.92, latMax: -14.23, lonMin: -51.05, lonMax: -39.86 },
  'PA': { latMin: -9.84, latMax: 2.60, lonMin: -58.90, lonMax: -46.06 },
  'PB': { latMin: -8.30, latMax: -6.02, lonMin: -38.77, lonMax: -34.79 },
  'PR': { latMin: -26.72, latMax: -22.52, lonMin: -54.62, lonMax: -48.02 },
  'PE': { latMin: -9.48, latMax: -7.15, lonMin: -41.36, lonMax: -34.81 },
  'PI': { latMin: -10.93, latMax: -2.74, lonMin: -45.99, lonMax: -40.37 },
  'RJ': { latMin: -23.37, latMax: -20.76, lonMin: -44.89, lonMax: -40.96 },
  'RN': { latMin: -6.98, latMax: -4.83, lonMin: -38.58, lonMax: -34.97 },
  'RS': { latMin: -33.75, latMax: -27.08, lonMin: -57.64, lonMax: -49.69 },
  'RO': { latMin: -13.69, latMax: -7.97, lonMin: -66.62, lonMax: -59.77 },
  'RR': { latMin: -1.60, latMax: 5.27, lonMin: -64.82, lonMax: -58.88 },
  'SC': { latMin: -29.36, latMax: -25.95, lonMin: -53.84, lonMax: -48.36 },
  'SP': { latMin: -25.31, latMax: -19.78, lonMin: -53.11, lonMax: -44.16 },
  'SE': { latMin: -11.57, latMax: -9.51, lonMin: -38.25, lonMax: -36.39 },
  'TO': { latMin: -13.47, latMax: -5.17, lonMin: -50.73, lonMax: -45.73 },
}

function getStateFromCoordinates(lat: number, lon: number): StateCode | null {
  for (const [stateCode, bounds] of Object.entries(STATE_BOUNDS)) {
    if (
      lat >= bounds.latMin &&
      lat <= bounds.latMax &&
      lon >= bounds.lonMin &&
      lon <= bounds.lonMax
    ) {
      return stateCode as StateCode
    }
  }

  // Se não encontrou, retornar o estado mais próximo
  let closestState: StateCode = 'SP'
  let minDistance = Infinity

  for (const [stateCode, bounds] of Object.entries(STATE_BOUNDS)) {
    const centerLat = (bounds.latMin + bounds.latMax) / 2
    const centerLon = (bounds.lonMin + bounds.lonMax) / 2
    const distance = Math.sqrt(
      Math.pow(lat - centerLat, 2) + Math.pow(lon - centerLon, 2)
    )

    if (distance < minDistance) {
      minDistance = distance
      closestState = stateCode as StateCode
    }
  }

  return closestState
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    state: null,
    loading: true,
    error: null,
    permission: null
  })

  useEffect(() => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Geolocalização não suportada',
        state: 'SP' // Default para SP
      }))
      return
    }

    // Verificar permissão
    navigator.permissions?.query({ name: 'geolocation' }).then(result => {
      setState(prev => ({ ...prev, permission: result.state as any }))

      if (result.state === 'denied') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: 'Permissão negada',
          state: 'SP' // Default para SP
        }))
        return
      }

      // Tentar obter localização
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const detectedState = getStateFromCoordinates(latitude, longitude)

          setState({
            latitude,
            longitude,
            state: detectedState,
            loading: false,
            error: null,
            permission: 'granted'
          })
        },
        (error) => {
          let errorMessage = 'Erro ao obter localização'
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permissão negada'
              break
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Localização indisponível'
              break
            case error.TIMEOUT:
              errorMessage = 'Tempo esgotado'
              break
          }

          setState(prev => ({
            ...prev,
            loading: false,
            error: errorMessage,
            state: 'SP' // Default para SP
          }))
        },
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 300000 // Cache por 5 minutos
        }
      )
    }).catch(() => {
      // Fallback se permissions API não disponível
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const detectedState = getStateFromCoordinates(latitude, longitude)

          setState({
            latitude,
            longitude,
            state: detectedState,
            loading: false,
            error: null,
            permission: 'granted'
          })
        },
        () => {
          setState(prev => ({
            ...prev,
            loading: false,
            error: 'Não foi possível obter localização',
            state: 'SP'
          }))
        },
        { timeout: 10000 }
      )
    })
  }, [])

  return state
}
