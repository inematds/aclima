import { NextRequest, NextResponse } from 'next/server'
import { BRAZILIAN_CAPITALS, BRAZILIAN_STATES, type CapitalSlug, type StateCode } from '@/types/weather'

const OPEN_METEO_API = 'https://api.open-meteo.com/v1/forecast'

export interface HistoricalDay {
  date: string
  temperature_2m_max: number
  temperature_2m_min: number
  temperature_2m_mean: number
  precipitation_sum: number
  rain_sum: number
  weather_code: number
  wind_speed_10m_max: number
  relative_humidity_2m_mean: number
}

export interface HistoricalHourly {
  time: string
  temperature_2m: number
  relative_humidity_2m: number
  precipitation: number
  rain: number
  weather_code: number
  wind_speed_10m: number
  cloud_cover: number
  surface_pressure: number
}

export interface HistoricalData {
  location: {
    name: string
    state: string
    latitude: number
    longitude: number
  }
  daily: HistoricalDay[]
  hourly: HistoricalHourly[]
  timezone: string
  period: {
    start: string
    end: string
    days: number
  }
  statistics: {
    avgTemperature: number
    maxTemperature: number
    minTemperature: number
    totalPrecipitation: number
    avgHumidity: number
    rainyDays: number
  }
}

// Cache em memória
const historyCache: Map<string, { data: HistoricalData; timestamp: number }> = new Map()
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

async function fetchHistoricalData(
  latitude: number,
  longitude: number,
  locationName: string,
  state: string,
  pastDays: number = 30
): Promise<HistoricalData | null> {
  const cacheKey = `${latitude},${longitude},${pastDays}`
  const cached = historyCache.get(cacheKey)

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
        'rain_sum',
        'weather_code',
        'wind_speed_10m_max'
      ].join(','),
      hourly: [
        'temperature_2m',
        'relative_humidity_2m',
        'precipitation',
        'rain',
        'weather_code',
        'wind_speed_10m',
        'cloud_cover',
        'surface_pressure'
      ].join(','),
      timezone: 'America/Sao_Paulo',
      past_days: pastDays.toString(),
      forecast_days: '0'
    })

    const response = await fetch(`${OPEN_METEO_API}?${params}`, {
      next: { revalidate: 3600 } // 1 hora
    })

    if (!response.ok) {
      console.error(`Open-Meteo historical error: ${response.status}`)
      return cached?.data || null
    }

    const data = await response.json()

    const daily: HistoricalDay[] = data.daily.time.map((date: string, i: number) => ({
      date,
      temperature_2m_max: data.daily.temperature_2m_max[i],
      temperature_2m_min: data.daily.temperature_2m_min[i],
      temperature_2m_mean: data.daily.temperature_2m_mean[i],
      precipitation_sum: data.daily.precipitation_sum[i] || 0,
      rain_sum: data.daily.rain_sum[i] || 0,
      weather_code: data.daily.weather_code[i],
      wind_speed_10m_max: data.daily.wind_speed_10m_max[i],
      relative_humidity_2m_mean: 0 // Será calculado do hourly
    }))

    const hourly: HistoricalHourly[] = data.hourly.time.map((time: string, i: number) => ({
      time,
      temperature_2m: data.hourly.temperature_2m[i],
      relative_humidity_2m: data.hourly.relative_humidity_2m[i],
      precipitation: data.hourly.precipitation[i] || 0,
      rain: data.hourly.rain[i] || 0,
      weather_code: data.hourly.weather_code[i],
      wind_speed_10m: data.hourly.wind_speed_10m[i],
      cloud_cover: data.hourly.cloud_cover[i],
      surface_pressure: data.hourly.surface_pressure[i]
    }))

    // Calcular média de umidade por dia
    daily.forEach((day, dayIndex) => {
      const dayHourly = hourly.filter(h => h.time.startsWith(day.date))
      if (dayHourly.length > 0) {
        day.relative_humidity_2m_mean = Math.round(
          dayHourly.reduce((sum, h) => sum + h.relative_humidity_2m, 0) / dayHourly.length
        )
      }
    })

    // Calcular estatísticas
    const temps = daily.map(d => d.temperature_2m_mean).filter(t => t !== null)
    const maxTemps = daily.map(d => d.temperature_2m_max).filter(t => t !== null)
    const minTemps = daily.map(d => d.temperature_2m_min).filter(t => t !== null)
    const humidities = daily.map(d => d.relative_humidity_2m_mean).filter(h => h > 0)

    const statistics = {
      avgTemperature: temps.length > 0 ? Math.round(temps.reduce((a, b) => a + b, 0) / temps.length * 10) / 10 : 0,
      maxTemperature: maxTemps.length > 0 ? Math.max(...maxTemps) : 0,
      minTemperature: minTemps.length > 0 ? Math.min(...minTemps) : 0,
      totalPrecipitation: Math.round(daily.reduce((sum, d) => sum + d.precipitation_sum, 0) * 10) / 10,
      avgHumidity: humidities.length > 0 ? Math.round(humidities.reduce((a, b) => a + b, 0) / humidities.length) : 0,
      rainyDays: daily.filter(d => d.precipitation_sum > 1).length
    }

    const historicalData: HistoricalData = {
      location: {
        name: locationName,
        state,
        latitude,
        longitude
      },
      daily,
      hourly,
      timezone: data.timezone,
      period: {
        start: daily[0]?.date || '',
        end: daily[daily.length - 1]?.date || '',
        days: daily.length
      },
      statistics
    }

    historyCache.set(cacheKey, { data: historicalData, timestamp: Date.now() })
    return historicalData
  } catch (error) {
    console.error('Error fetching historical data:', error)
    return cached?.data || null
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const capitalSlug = searchParams.get('capital') as CapitalSlug | null
  const stateCode = searchParams.get('state') as StateCode | null
  const days = parseInt(searchParams.get('days') || '30')

  const pastDays = Math.min(Math.max(days, 1), 92)

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
      state = stateCode
    } else {
      const defaultCapital = BRAZILIAN_CAPITALS['sao-paulo']
      latitude = defaultCapital.latitude
      longitude = defaultCapital.longitude
      locationName = defaultCapital.name
      state = defaultCapital.stateCode
    }

    const data = await fetchHistoricalData(latitude, longitude, locationName, state, pastDays)

    if (!data) {
      return NextResponse.json({ success: false, error: 'Failed to fetch historical data' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data,
      pastDays,
      source: 'open-meteo',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in historical API:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
