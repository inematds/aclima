import { NextRequest, NextResponse } from 'next/server'
import { STATION_INFO, BRAZILIAN_CAPITALS, type WeatherData, type CapitalSlug } from '@/types/weather'

const INMET_API_BASE = 'https://apitempo.inmet.gov.br'

// Cache em memória
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos

// Calcular nível de alerta baseado em precipitação
function calculateAlertLevel(rain1h: number, rain24h: number): 'normal' | 'attention' | 'alert' | 'severe' {
  if (rain24h >= 50 || rain1h >= 30) return 'severe'
  if (rain1h >= 20) return 'alert'
  if (rain1h >= 10) return 'attention'
  return 'normal'
}

// Determinar status da estação
function getStationStatus(lastUpdate: Date): 'online' | 'delayed' | 'offline' {
  const now = new Date()
  const diffMinutes = (now.getTime() - lastUpdate.getTime()) / (1000 * 60)

  if (diffMinutes <= 15) return 'online'
  if (diffMinutes <= 60) return 'delayed'
  return 'offline'
}

// Buscar dados de uma estação
async function fetchStationData(stationCode: string): Promise<any[]> {
  const cacheKey = stationCode
  const cached = weatherCache.get(cacheKey)

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  // Buscar últimas 24 horas
  const endDate = new Date()
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000)

  const formatDate = (d: Date) => d.toISOString().split('T')[0]

  try {
    const response = await fetch(
      `${INMET_API_BASE}/estacao/${formatDate(startDate)}/${formatDate(endDate)}/${stationCode}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 } // 5 minutos
      }
    )

    if (!response.ok) {
      console.error(`Error fetching station ${stationCode}: ${response.status}`)
      return []
    }

    const data = await response.json()

    // Atualizar cache
    weatherCache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.error(`Error fetching station ${stationCode}:`, error)
    return cached?.data || []
  }
}

// Processar dados brutos em formato normalizado
function processStationData(rawData: any[], stationCode: string): WeatherData | null {
  if (!rawData || rawData.length === 0) return null

  const stationInfo = STATION_INFO[stationCode]
  if (!stationInfo) return null

  // Ordenar por data/hora (mais recente primeiro)
  const sortedData = [...rawData].sort((a, b) => {
    const dateA = new Date(`${a.DT_MEDICAO}T${a.HR_MEDICAO}:00Z`)
    const dateB = new Date(`${b.DT_MEDICAO}T${b.HR_MEDICAO}:00Z`)
    return dateB.getTime() - dateA.getTime()
  })

  const latest = sortedData[0]
  const latestDate = new Date(`${latest.DT_MEDICAO}T${latest.HR_MEDICAO}:00Z`)

  // Calcular acumulados
  const now = new Date()
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000)

  let rain30min = 0
  let rain1h = 0
  let rain24h = 0

  for (const obs of sortedData) {
    const obsDate = new Date(`${obs.DT_MEDICAO}T${obs.HR_MEDICAO}:00Z`)
    const rain = parseFloat(obs.CHUVA) || 0

    rain24h += rain

    if (obsDate >= oneHourAgo) {
      rain1h += rain
    }

    if (obsDate >= thirtyMinAgo) {
      rain30min += rain
    }
  }

  // Temperatura e umidade
  const temp = parseFloat(latest.TEM_INS) || 0
  const tempMin = parseFloat(latest.TEM_MIN) || temp
  const tempMax = parseFloat(latest.TEM_MAX) || temp

  const humidity = parseFloat(latest.UMD_INS) || 0
  const humidityMin = parseFloat(latest.UMD_MIN) || humidity
  const humidityMax = parseFloat(latest.UMD_MAX) || humidity

  // Vento (converter m/s para km/h)
  const windSpeed = (parseFloat(latest.VEN_VEL) || 0) * 3.6
  const windDir = parseFloat(latest.VEN_DIR) || 0
  const windGust = (parseFloat(latest.VEN_RAJ) || 0) * 3.6

  // Pressão
  const pressure = parseFloat(latest.PRE_INS) || 0

  // Calcular taxa de chuva atual (mm/h aproximado)
  const rainCurrent = rain1h // Simplificado

  return {
    stationId: stationCode,
    stationName: stationInfo.name,
    state: latest.UF || 'SP',
    coordinates: {
      lat: parseFloat(latest.VL_LATITUDE) || 0,
      lng: parseFloat(latest.VL_LONGITUDE) || 0
    },
    timestamp: latestDate.toISOString(),

    rain: {
      current: Math.round(rainCurrent * 10) / 10,
      last30min: Math.round(rain30min * 10) / 10,
      last1h: Math.round(rain1h * 10) / 10,
      last24h: Math.round(rain24h * 10) / 10
    },

    temperature: {
      current: Math.round(temp * 10) / 10,
      min: Math.round(tempMin * 10) / 10,
      max: Math.round(tempMax * 10) / 10
    },

    humidity: {
      current: Math.round(humidity),
      min: Math.round(humidityMin),
      max: Math.round(humidityMax)
    },

    wind: {
      speed: Math.round(windSpeed * 10) / 10,
      direction: Math.round(windDir),
      gust: Math.round(windGust * 10) / 10
    },

    pressure: Math.round(pressure * 10) / 10,

    status: getStationStatus(latestDate),
    alertLevel: calculateAlertLevel(rain1h, rain24h)
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const stationCode = searchParams.get('station')
  const capitalSlug = searchParams.get('capital') as CapitalSlug | null

  try {
    if (stationCode) {
      // Buscar uma estação específica
      const rawData = await fetchStationData(stationCode)
      const processed = processStationData(rawData, stationCode)

      if (!processed) {
        return NextResponse.json(
          { success: false, error: 'Station not found or no data available' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        data: processed,
        timestamp: new Date().toISOString()
      })
    }

    // Determinar quais estações buscar
    let stationCodes: string[]
    let capitalInfo = null

    if (capitalSlug && BRAZILIAN_CAPITALS[capitalSlug]) {
      // Buscar estações de uma capital específica
      capitalInfo = BRAZILIAN_CAPITALS[capitalSlug]
      stationCodes = capitalInfo.stations
    } else {
      // Default: São Paulo
      capitalInfo = BRAZILIAN_CAPITALS['sao-paulo']
      stationCodes = capitalInfo.stations
    }

    const results: WeatherData[] = []

    // Buscar em paralelo (com limite)
    const batchSize = 5
    for (let i = 0; i < stationCodes.length; i += batchSize) {
      const batch = stationCodes.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (code) => {
          const rawData = await fetchStationData(code)
          return processStationData(rawData, code)
        })
      )
      results.push(...batchResults.filter((r): r is WeatherData => r !== null))
    }

    // Ordenar por nível de alerta (severos primeiro)
    const alertOrder = { severe: 0, alert: 1, attention: 2, normal: 3 }
    results.sort((a, b) => alertOrder[a.alertLevel] - alertOrder[b.alertLevel])

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      capital: capitalInfo ? {
        name: capitalInfo.name,
        state: capitalInfo.state,
        stateCode: capitalInfo.stateCode,
        region: capitalInfo.region
      } : null,
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
