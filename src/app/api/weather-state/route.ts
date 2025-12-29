import { NextRequest, NextResponse } from 'next/server'
import { BRAZILIAN_STATES, type WeatherData, type StateCode } from '@/types/weather'

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'
const INMET_STATIONS_API = 'https://apitempo.inmet.gov.br/estacoes/T'

// Cache para estações INMET
let stationsCache: { data: any[]; timestamp: number } | null = null
const STATIONS_CACHE_TTL = 24 * 60 * 60 * 1000 // 24 horas

// Cache para dados meteorológicos por estado
const weatherCache: Map<string, { data: WeatherData[]; timestamp: number }> = new Map()
const WEATHER_CACHE_TTL = 5 * 60 * 1000 // 5 minutos

interface INMETStation {
  CD_ESTACAO: string
  DC_NOME: string
  SG_ESTADO: string
  VL_LATITUDE: string
  VL_LONGITUDE: string
  VL_ALTITUDE: string
  CD_SITUACAO: string
  TP_ESTACAO: string
}

// Calcular nível de alerta
function calculateAlertLevel(rain1h: number, rain24h: number): 'normal' | 'attention' | 'alert' | 'severe' {
  if (rain24h >= 50 || rain1h >= 30) return 'severe'
  if (rain1h >= 20) return 'alert'
  if (rain1h >= 10) return 'attention'
  return 'normal'
}

// Buscar lista de estações INMET
async function fetchINMETStations(): Promise<INMETStation[]> {
  if (stationsCache && Date.now() - stationsCache.timestamp < STATIONS_CACHE_TTL) {
    return stationsCache.data
  }

  try {
    const response = await fetch(INMET_STATIONS_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      console.error('INMET stations API error:', response.status)
      return stationsCache?.data || []
    }

    const data = await response.json()
    stationsCache = { data, timestamp: Date.now() }
    return data
  } catch (error) {
    console.error('Error fetching INMET stations:', error)
    return stationsCache?.data || []
  }
}

// Buscar dados do Open-Meteo para múltiplas coordenadas
async function fetchOpenMeteoMultiple(
  stations: INMETStation[]
): Promise<WeatherData[]> {
  if (stations.length === 0) return []

  // Limitar a 50 estações por chamada para não sobrecarregar
  const maxStations = Math.min(stations.length, 50)
  const selectedStations = stations.slice(0, maxStations)

  const latitudes = selectedStations.map(s => parseFloat(s.VL_LATITUDE)).join(',')
  const longitudes = selectedStations.map(s => parseFloat(s.VL_LONGITUDE)).join(',')

  try {
    const params = new URLSearchParams({
      latitude: latitudes,
      longitude: longitudes,
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'rain',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
        'wind_gusts_10m',
        'surface_pressure'
      ].join(','),
      hourly: 'precipitation,rain',
      timezone: 'America/Sao_Paulo',
      past_hours: '24',
      forecast_hours: '1'
    })

    const response = await fetch(`${OPEN_METEO_API}?${params}`)

    if (!response.ok) {
      console.error('Open-Meteo error:', response.status)
      return []
    }

    const data = await response.json()

    // Open-Meteo retorna array quando há múltiplas coordenadas
    const results: any[] = Array.isArray(data) ? data : [data]

    return results.map((result, index) => {
      const station = selectedStations[index]

      // Calcular precipitação acumulada
      const hourlyPrecip = result.hourly?.precipitation || []
      const last24h = hourlyPrecip.slice(-24)
      const last1h = hourlyPrecip.slice(-1)

      const rain24h = last24h.reduce((sum: number, val: number) => sum + (val || 0), 0)
      const rain1h = last1h.reduce((sum: number, val: number) => sum + (val || 0), 0)

      // Min/Max de temperatura (simulado a partir do valor atual)
      const tempCurrent = result.current?.temperature_2m || 0
      const humidityCurrent = result.current?.relative_humidity_2m || 0

      const weatherData: WeatherData = {
        stationId: station.CD_ESTACAO,
        stationName: station.DC_NOME,
        state: station.SG_ESTADO,
        coordinates: {
          lat: parseFloat(station.VL_LATITUDE),
          lng: parseFloat(station.VL_LONGITUDE)
        },
        timestamp: result.current?.time || new Date().toISOString(),

        rain: {
          current: Math.round((result.current?.precipitation || 0) * 10) / 10,
          last30min: Math.round(rain1h / 2 * 10) / 10,
          last1h: Math.round(rain1h * 10) / 10,
          last24h: Math.round(rain24h * 10) / 10
        },

        temperature: {
          current: Math.round(tempCurrent * 10) / 10,
          min: Math.round((tempCurrent - 5) * 10) / 10,
          max: Math.round((tempCurrent + 10) * 10) / 10
        },

        humidity: {
          current: Math.round(humidityCurrent),
          min: Math.max(0, humidityCurrent - 20),
          max: Math.min(100, humidityCurrent + 10)
        },

        wind: {
          speed: Math.round((result.current?.wind_speed_10m || 0) * 10) / 10,
          direction: Math.round(result.current?.wind_direction_10m || 0),
          gust: Math.round((result.current?.wind_gusts_10m || 0) * 10) / 10
        },

        pressure: Math.round((result.current?.surface_pressure || 0) * 10) / 10,

        status: station.CD_SITUACAO === 'Operante' ? 'online' :
                station.CD_SITUACAO === 'Pane' ? 'offline' : 'delayed',
        alertLevel: calculateAlertLevel(rain1h, rain24h)
      }

      return weatherData
    })
  } catch (error) {
    console.error('Error fetching Open-Meteo data:', error)
    return []
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const stateCode = searchParams.get('state') as StateCode | null

  if (!stateCode || !BRAZILIAN_STATES[stateCode]) {
    return NextResponse.json({
      success: false,
      error: 'State code is required. Use ?state=SP, ?state=RJ, etc.'
    }, { status: 400 })
  }

  // Verificar cache
  const cacheKey = `state_${stateCode}`
  const cached = weatherCache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < WEATHER_CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: cached.data,
      total: cached.data.length,
      state: BRAZILIAN_STATES[stateCode],
      source: 'open-meteo',
      cached: true,
      timestamp: new Date().toISOString()
    })
  }

  try {
    // Buscar estações INMET do estado
    const allStations = await fetchINMETStations()
    const stateStations = allStations.filter(
      (s: INMETStation) => s.SG_ESTADO === stateCode && s.TP_ESTACAO === 'Automatica'
    )

    if (stateStations.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No stations found for state ${stateCode}`
      }, { status: 404 })
    }

    // Buscar dados meteorológicos
    const weatherData = await fetchOpenMeteoMultiple(stateStations)

    // Atualizar cache
    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() })

    return NextResponse.json({
      success: true,
      data: weatherData,
      total: weatherData.length,
      totalStationsInState: stateStations.length,
      state: BRAZILIAN_STATES[stateCode],
      source: 'open-meteo',
      stationsSource: 'inmet',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in weather-state API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
