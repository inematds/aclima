import { NextRequest, NextResponse } from 'next/server'
import { BRAZILIAN_CAPITALS, BRAZILIAN_STATES, type CapitalSlug, type StateCode } from '@/types/weather'

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'

export interface ForecastDay {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  temperature_2m_mean: number
  precipitation_sum: number
  precipitation_probability_max: number
  rain_sum: number
  weather_code: number
  wind_speed_10m_max: number
  wind_direction_10m_dominant: number
  uv_index_max: number
  sunrise: string
  sunset: string
}

export interface ForecastHourly {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  precipitation: number
  precipitation_probability: number
  weather_code: number
  wind_speed_10m: number
  wind_direction_10m: number
  cloud_cover: number
}

export interface ForecastData {
  location: {
    name: string
    state: string
    latitude: number
    longitude: number
  }
  daily: ForecastDay[]
  hourly: ForecastHourly[]
  timezone: string
}

// Cache em memória
const forecastCache: Map<string, { data: ForecastData; timestamp: number }> = new Map()
const CACHE_TTL = 30 * 60 * 1000 // 30 minutos

async function fetchForecastData(
  latitude: number,
  longitude: number,
  locationName: string,
  state: string,
  forecastDays: number = 7
): Promise<ForecastData | null> {
  const cacheKey = `${latitude},${longitude},${forecastDays}`
  const cached = forecastCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  try {
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      daily: [
        'temperature_2m_max',
        'temperature_2m_min',
        'temperature_2m_mean',
        'precipitation_sum',
        'precipitation_probability_max',
        'rain_sum',
        'weather_code',
        'wind_speed_10m_max',
        'wind_direction_10m_dominant',
        'uv_index_max',
        'sunrise',
        'sunset'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'precipitation_probability',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
        'cloud_cover'
      ].join(','),
      timezone: 'America/Sao_Paulo',
      forecast_days: forecastDays.toString()
    })

    const response = await fetch(`${OPEN_METEO_API}?${params}`, {
      next: { revalidate: 1800 } // 30 minutos
    })

    if (!response.ok) {
      console.error(`Open-Meteo forecast error: ${response.status}`)
      return cached?.data || null
    }

    const data = await response.json()

    const daily: ForecastDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      temperature_2m_max: data.daily.temperature_2m_max[i],
      temperature_2m_min: data.daily.temperature_2m_min[i],
      temperature_2m_mean: data.daily.temperature_2m_mean[i],
      precipitation_sum: data.daily.precipitation_sum[i] || 0,
      precipitation_probability_max: data.daily.precipitation_probability_max[i] || 0,
      rain_sum: data.daily.rain_sum[i] || 0,
      weather_code: data.daily.weather_code[i],
      wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
      wind_direction_10m_dominant: data.daily.wind_direction_10m_dominant[i],
      uv_index_max: data.daily.uv_index_max[i] || 0,
      sunrise: data.daily.sunrise[i],
      sunset: data.daily.sunset[i]
    }))

    const hourly: ForecastHourly[] = data.hourly.time.map((time: string, i: number) => ({
      time,
      temperature_2m: data.hourly.temperature_2m[i],
      relative_humidity_2m: data.hourly.relative_humidity_2m[i],
      precipitation: data.hourly.precipitation[i] || 0,
      precipitation_probability: data.hourly.precipitation_probability[i] || 0,
      weather_code: data.hourly.weather_code[i],
      wind_speed_10m: data.hourly.wind_speed_10m[i],
      wind_direction_10m: data.hourly.wind_direction_10m[i],
      cloud_cover: data.hourly.cloud_cover[i]
    }))

    const forecastData: ForecastData = {
      location: {
        name: locationName,
        state,
        latitude,
        longitude
      },
      daily,
      hourly,
      timezone: data.timezone
    }

    forecastCache.set(cacheKey, { data: forecastData, timestamp: Date.now() })
    return forecastData
  } catch (error) {
    console.error('Error fetching forecast:', error)
    return cached?.data || null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const capitalSlug = searchParams.get('capital') as CapitalSlug | null
  const stateCode = searchParams.get('state') as StateCode | null
  const days = parseInt(searchParams.get('days') || '7')

  const forecastDays = Math.min(Math.max(days, 1), 16)

  try {
    let latitude: number
    let longitude: number
    let locationName: string
    let state: string

    if (capitalSlug && BRAZILIAN_CAPITALS[capitalSlug]) {
      const capitalInfo = BRAZILIAN_CAPITALS[capitalSlug]
      latitude = capitalInfo.latitude
      longitude = capitalInfo.longitude
      locationName = capitalInfo.name
      state = capitalInfo.stateCode
    } else if (stateCode && BRAZILIAN_STATES[stateCode]) {
      const stateInfo = BRAZILIAN_STATES[stateCode]
      const capitalEntry = Object.entries(BRAZILIAN_CAPITALS).find(
        ([, info]) => info.stateCode === stateCode
      )
      if (!capitalEntry) {
        return NextResponse.json({ success: false, error: 'Capital not found' }, { status: 404 })
      }
      const [, capitalInfo] = capitalEntry
      latitude = capitalInfo.latitude
      longitude = capitalInfo.longitude
      locationName = capitalInfo.name
      state = stateInfo.code
    } else {
      const defaultCapital = BRAZILIAN_CAPITALS['sao-paulo']
      latitude = defaultCapital.latitude
      longitude = defaultCapital.longitude
      locationName = defaultCapital.name
      state = defaultCapital.stateCode
    }

    const data = await fetchForecastData(latitude, longitude, locationName, state, forecastDays)

    if (!data) {
      return NextResponse.json({ success: false, error: 'Failed to fetch forecast' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      forecastDays,
      source: 'open-meteo',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in forecast API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
