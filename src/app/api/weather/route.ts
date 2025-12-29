import { NextRequest, NextResponse } from 'next/server'
import { BRAZILIAN_CAPITALS, BRAZILIAN_STATES, type WeatherData, type CapitalSlug, type StateCode } from '@/types/weather'

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'

// Cache em memória
const weatherCache: Map<string, { data: WeatherData; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Calcular nível de alerta baseado em precipitação
function calculateAlertLevel(rain1h: number, rain24h: number): 'normal' | 'attention' | 'alert' | 'severe' {
  if (rain24h >= 50 || rain1h >= 30) return 'severe'
  if (rain1h >= 20) return 'alert'
  if (rain1h >= 10) return 'attention'
  return 'normal'
}

// Buscar dados do Open-Meteo para uma localização
async function fetchOpenMeteoData(
  latitude: number,
  longitude: number,
  locationId: string,
  locationName: string,
  state: string
): Promise<WeatherData | null> {
  const cacheKey = `${latitude},${longitude}`
  const cached = weatherCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
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
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'rain'
      ].join(','),
      timezone: 'America/Sao_Paulo',
      past_hours: '24',
      forecast_hours: '1'
    })

    const response = await fetch(`${OPEN_METEO_API}?${params}`, {
      next: { revalidate: 300 } // 5 minutos
    })

    if (!response.ok) {
      console.error(`Open-Meteo error for ${locationName}: ${response.status}`)
      return cached?.data || null
    }

    const data = await response.json()

    // Calcular acumulados de precipitação das últimas horas
    const hourlyPrecip = data.hourly?.precipitation || []
    const hourlyRain = data.hourly?.rain || []
    const hourlyTemp = data.hourly?.temperature_2m || []
    const hourlyHumidity = data.hourly?.relative_humidity_2m || []

    // Últimas 24 horas de dados
    const last24h = hourlyPrecip.slice(-24)
    const last1h = hourlyPrecip.slice(-1)
    const last30min = hourlyPrecip.slice(-1).map((v: number) => v / 2) // Aproximação

    const rain24h = last24h.reduce((sum: number, val: number) => sum + (val || 0), 0)
    const rain1h = last1h.reduce((sum: number, val: number) => sum + (val || 0), 0)
    const rain30min = last30min.reduce((sum: number, val: number) => sum + (val || 0), 0)

    // Min/Max das últimas 24h
    const temps = hourlyTemp.slice(-24).filter((t: number) => t !== null)
    const humidities = hourlyHumidity.slice(-24).filter((h: number) => h !== null)

    const tempMin = temps.length > 0 ? Math.min(...temps) : data.current.temperature_2m
    const tempMax = temps.length > 0 ? Math.max(...temps) : data.current.temperature_2m
    const humidityMin = humidities.length > 0 ? Math.min(...humidities) : data.current.relative_humidity_2m
    const humidityMax = humidities.length > 0 ? Math.max(...humidities) : data.current.relative_humidity_2m

    const weatherData: WeatherData = {
      stationId: locationId,
      stationName: locationName,
      state: state,
      coordinates: {
        lat: latitude,
        lng: longitude
      },
      timestamp: data.current.time,

      rain: {
        current: Math.round((data.current.precipitation || 0) * 10) / 10,
        last30min: Math.round(rain30min * 10) / 10,
        last1h: Math.round(rain1h * 10) / 10,
        last24h: Math.round(rain24h * 10) / 10
      },

      temperature: {
        current: Math.round(data.current.temperature_2m * 10) / 10,
        min: Math.round(tempMin * 10) / 10,
        max: Math.round(tempMax * 10) / 10
      },

      humidity: {
        current: Math.round(data.current.relative_humidity_2m),
        min: Math.round(humidityMin),
        max: Math.round(humidityMax)
      },

      wind: {
        speed: Math.round(data.current.wind_speed_10m * 10) / 10,
        direction: Math.round(data.current.wind_direction_10m),
        gust: Math.round((data.current.wind_gusts_10m || 0) * 10) / 10
      },

      pressure: Math.round((data.current.surface_pressure || 0) * 10) / 10,

      status: 'online',
      alertLevel: calculateAlertLevel(rain1h, rain24h)
    }

    // Atualizar cache
    weatherCache.set(cacheKey, { data: weatherData, timestamp: Date.now() })

    return weatherData
  } catch (error) {
    console.error(`Error fetching Open-Meteo data for ${locationName}:`, error)
    return cached?.data || null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const capitalSlug = searchParams.get('capital') as CapitalSlug | null
  const stateCode = searchParams.get('state') as StateCode | null
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')

  try {
    // Busca por coordenadas específicas
    if (lat && lng) {
      const latitude = parseFloat(lat)
      const longitude = parseFloat(lng)

      if (isNaN(latitude) || isNaN(longitude)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid coordinates'
        }, { status: 400 })
      }

      const data = await fetchOpenMeteoData(
        latitude,
        longitude,
        'custom',
        'Localização Personalizada',
        ''
      )

      if (!data) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch weather data'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: [data],
        total: 1,
        source: 'open-meteo',
        timestamp: new Date().toISOString()
      })
    }

    // Busca por capital específica
    if (capitalSlug && BRAZILIAN_CAPITALS[capitalSlug]) {
      const capitalInfo = BRAZILIAN_CAPITALS[capitalSlug]

      const data = await fetchOpenMeteoData(
        capitalInfo.latitude,
        capitalInfo.longitude,
        capitalSlug,
        capitalInfo.name,
        capitalInfo.stateCode
      )

      if (!data) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch weather data'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: [data],
        total: 1,
        location: {
          type: 'capital',
          name: capitalInfo.name,
          state: capitalInfo.state,
          stateCode: capitalInfo.stateCode,
          region: capitalInfo.region
        },
        source: 'open-meteo',
        timestamp: new Date().toISOString()
      })
    }

    // Busca por estado - retorna todas as capitais da região
    if (stateCode && BRAZILIAN_STATES[stateCode]) {
      const stateInfo = BRAZILIAN_STATES[stateCode]

      // Encontrar a capital do estado
      const capitalEntry = Object.entries(BRAZILIAN_CAPITALS).find(
        ([, info]) => info.stateCode === stateCode
      )

      if (!capitalEntry) {
        return NextResponse.json({
          success: false,
          error: 'Capital not found for state'
        }, { status: 404 })
      }

      const [slug, capitalInfo] = capitalEntry

      const data = await fetchOpenMeteoData(
        capitalInfo.latitude,
        capitalInfo.longitude,
        slug,
        capitalInfo.name,
        capitalInfo.stateCode
      )

      if (!data) {
        return NextResponse.json({
          success: false,
          error: 'Failed to fetch weather data'
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        data: [data],
        total: 1,
        location: {
          type: 'state',
          name: stateInfo.name,
          code: stateInfo.code,
          region: stateInfo.region,
          capital: stateInfo.capital
        },
        source: 'open-meteo',
        timestamp: new Date().toISOString()
      })
    }

    // Default: São Paulo
    const defaultCapital = BRAZILIAN_CAPITALS['sao-paulo']
    const data = await fetchOpenMeteoData(
      defaultCapital.latitude,
      defaultCapital.longitude,
      'sao-paulo',
      defaultCapital.name,
      defaultCapital.stateCode
    )

    if (!data) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch weather data'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: [data],
      total: 1,
      location: {
        type: 'capital',
        name: defaultCapital.name,
        state: defaultCapital.state,
        stateCode: defaultCapital.stateCode,
        region: defaultCapital.region
      },
      source: 'open-meteo',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error in weather API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
