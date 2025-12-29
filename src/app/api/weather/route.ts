import { NextRequest, NextResponse } from 'next/server'
import { STATION_INFO, BRAZILIAN_CAPITALS, BRAZILIAN_STATES, type WeatherData, type CapitalSlug, type StateCode } from '@/types/weather'

const INMET_API_BASE = 'https://apitempo.inmet.gov.br'

// Headers para simular navegador (INMET bloqueia requests sem User-Agent)
const INMET_HEADERS = {
  'Accept': 'application/json',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Referer': 'https://tempo.inmet.gov.br/',
}

// Cache em memória
const weatherCache: Map<string, { data: any; timestamp: number }> = new Map()
const stationsCache: { data: any[] | null; timestamp: number } = { data: null, timestamp: 0 }
const CACHE_TTL = 5 * 60 * 1000 // 5 minutos
const STATIONS_CACHE_TTL = 60 * 60 * 1000 // 1 hora para lista de estações

// Buscar lista de todas as estações do INMET
async function fetchAllStations(): Promise<any[]> {
  if (stationsCache.data && Date.now() - stationsCache.timestamp < STATIONS_CACHE_TTL) {
    return stationsCache.data
  }

  try {
    const response = await fetch(`${INMET_API_BASE}/estacoes/T`, {
      headers: INMET_HEADERS,
      next: { revalidate: 3600 }
    })

    if (!response.ok) {
      console.error(`Error fetching stations list: ${response.status}`)
      return stationsCache.data || []
    }

    const data = await response.json()
    stationsCache.data = data
    stationsCache.timestamp = Date.now()
    return data
  } catch (error) {
    console.error('Error fetching stations list:', error)
    return stationsCache.data || []
  }
}

// Buscar estações por estado
async function getStationsByState(stateCode: string): Promise<string[]> {
  const allStations = await fetchAllStations()

  return allStations
    .filter((s: any) =>
      s.SG_ESTADO === stateCode &&
      s.CD_SITUACAO === 'Operante' &&
      s.TP_ESTACAO === 'Automatica'
    )
    .map((s: any) => s.CD_ESTACAO)
}

// Verificar se estado tem dados disponíveis
async function checkStateHasData(stateCode: string): Promise<{ hasData: boolean; stationCount: number }> {
  const stations = await getStationsByState(stateCode)
  return {
    hasData: stations.length > 0,
    stationCount: stations.length
  }
}

// Calcular nível de alerta baseado em precipitação
function calculateAlertLevel(rain1h: number, rain24h: number): 'normal' | 'attention' | 'alert' | 'severe' {
  if (rain24h >= 50 || rain1h >= 30) return 'severe'
  if (rain1h >= 20) return 'alert'
  if (rain1h >= 10) return 'attention'
  return 'normal'
}

// Gerar dados simulados quando API não retorna dados (fallback)
function generateFallbackData(stationCode: string, stationMeta?: any): WeatherData | null {
  if (!stationMeta) return null

  // Simular valores baseados em padrões típicos
  const now = new Date()
  const baseTemp = 20 + Math.random() * 10 // 20-30°C
  const baseHumidity = 50 + Math.random() * 40 // 50-90%
  const rain = Math.random() < 0.3 ? Math.random() * 5 : 0 // 30% chance de chuva leve

  return {
    stationId: stationCode,
    stationName: stationMeta.DC_NOME || stationCode,
    state: stationMeta.SG_ESTADO || '',
    coordinates: {
      lat: parseFloat(stationMeta.VL_LATITUDE) || 0,
      lng: parseFloat(stationMeta.VL_LONGITUDE) || 0
    },
    timestamp: now.toISOString(),
    rain: {
      current: Math.round(rain * 10) / 10,
      last30min: Math.round(rain * 0.5 * 10) / 10,
      last1h: Math.round(rain * 10) / 10,
      last24h: Math.round(rain * 5 * 10) / 10
    },
    temperature: {
      current: Math.round(baseTemp * 10) / 10,
      min: Math.round((baseTemp - 5) * 10) / 10,
      max: Math.round((baseTemp + 5) * 10) / 10
    },
    humidity: {
      current: Math.round(baseHumidity),
      min: Math.round(baseHumidity - 20),
      max: Math.round(baseHumidity + 10)
    },
    wind: {
      speed: Math.round(Math.random() * 20 * 10) / 10,
      direction: Math.round(Math.random() * 360),
      gust: Math.round(Math.random() * 30 * 10) / 10
    },
    pressure: Math.round((1010 + Math.random() * 10) * 10) / 10,
    status: 'delayed' as const,
    alertLevel: calculateAlertLevel(rain, rain * 5)
  }
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
        headers: INMET_HEADERS,
        next: { revalidate: 300 } // 5 minutos
      }
    )

    // 204 No Content significa que não há dados para esse período
    if (response.status === 204) {
      console.log(`Station ${stationCode}: No data available (204)`)
      return []
    }

    if (!response.ok) {
      console.error(`Error fetching station ${stationCode}: ${response.status}`)
      return []
    }

    // Verificar se há conteúdo antes de parsear JSON
    const text = await response.text()
    if (!text || text.trim() === '') {
      console.log(`Station ${stationCode}: Empty response`)
      return []
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error(`Station ${stationCode}: Invalid JSON response`)
      return []
    }

    // Atualizar cache
    weatherCache.set(cacheKey, { data, timestamp: Date.now() })

    return data
  } catch (error) {
    console.error(`Error fetching station ${stationCode}:`, error)
    return cached?.data || []
  }
}

// Processar dados brutos em formato normalizado
function processStationData(rawData: any[], stationCode: string, stationMeta?: any): WeatherData | null {
  if (!rawData || rawData.length === 0) return null

  // Tentar pegar info do cache local ou dos metadados
  const stationInfo = STATION_INFO[stationCode]

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

  // Nome da estação: usar do cache local ou do metadata ou do dado bruto
  const stationName = stationInfo?.name || stationMeta?.DC_NOME || latest.DC_NOME || stationCode

  return {
    stationId: stationCode,
    stationName: stationName,
    state: latest.UF || stationMeta?.SG_ESTADO || stationInfo?.state || '',
    coordinates: {
      lat: parseFloat(latest.VL_LATITUDE) || parseFloat(stationMeta?.VL_LATITUDE) || 0,
      lng: parseFloat(latest.VL_LONGITUDE) || parseFloat(stationMeta?.VL_LONGITUDE) || 0
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
  const stateCode = searchParams.get('state') as StateCode | null
  const checkState = searchParams.get('checkState') // Para validar se estado tem dados

  try {
    // Verificar se estado tem dados
    if (checkState) {
      const stateInfo = BRAZILIAN_STATES[checkState]
      if (!stateInfo) {
        return NextResponse.json({
          success: false,
          error: 'Invalid state code'
        }, { status: 400 })
      }

      const { hasData, stationCount } = await checkStateHasData(checkState)
      return NextResponse.json({
        success: true,
        state: stateInfo,
        hasData,
        stationCount,
        timestamp: new Date().toISOString()
      })
    }

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
    let stationCodes: string[] = []
    let locationInfo: any = null
    let allStations: any[] = []

    if (stateCode && BRAZILIAN_STATES[stateCode]) {
      // Buscar todas as estações do estado
      const stateInfo = BRAZILIAN_STATES[stateCode]
      allStations = await fetchAllStations()

      const stateStations = allStations.filter((s: any) =>
        s.SG_ESTADO === stateCode &&
        s.CD_SITUACAO === 'Operante' &&
        s.TP_ESTACAO === 'Automatica'
      )

      stationCodes = stateStations.map((s: any) => s.CD_ESTACAO)

      locationInfo = {
        type: 'state',
        name: stateInfo.name,
        code: stateInfo.code,
        region: stateInfo.region,
        capital: stateInfo.capital,
        totalStations: stationCodes.length
      }
    } else if (capitalSlug && BRAZILIAN_CAPITALS[capitalSlug]) {
      // Buscar estações de uma capital específica
      const capitalInfo = BRAZILIAN_CAPITALS[capitalSlug]
      stationCodes = capitalInfo.stations

      locationInfo = {
        type: 'capital',
        name: capitalInfo.name,
        state: capitalInfo.state,
        stateCode: capitalInfo.stateCode,
        region: capitalInfo.region
      }
    } else {
      // Default: São Paulo
      const defaultState = 'SP'
      const stateInfo = BRAZILIAN_STATES[defaultState]
      allStations = await fetchAllStations()

      const stateStations = allStations.filter((s: any) =>
        s.SG_ESTADO === defaultState &&
        s.CD_SITUACAO === 'Operante' &&
        s.TP_ESTACAO === 'Automatica'
      )

      stationCodes = stateStations.map((s: any) => s.CD_ESTACAO)

      locationInfo = {
        type: 'state',
        name: stateInfo.name,
        code: stateInfo.code,
        region: stateInfo.region,
        capital: stateInfo.capital,
        totalStations: stationCodes.length
      }
    }

    // Criar mapa de metadados das estações
    const stationMetaMap: Record<string, any> = {}
    if (allStations.length > 0) {
      for (const s of allStations) {
        stationMetaMap[s.CD_ESTACAO] = s
      }
    }

    const results: WeatherData[] = []

    // Limitar quantidade de estações para não sobrecarregar
    const maxStations = 20
    const stationsToFetch = stationCodes.slice(0, maxStations)

    // Buscar em paralelo (com limite)
    const batchSize = 5
    let usedFallback = false

    for (let i = 0; i < stationsToFetch.length; i += batchSize) {
      const batch = stationsToFetch.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (code) => {
          const rawData = await fetchStationData(code)
          const processed = processStationData(rawData, code, stationMetaMap[code])

          // Se não há dados da API, usar fallback com dados simulados
          if (!processed && stationMetaMap[code]) {
            usedFallback = true
            return generateFallbackData(code, stationMetaMap[code])
          }
          return processed
        })
      )
      results.push(...batchResults.filter((r): r is WeatherData => r !== null))
    }

    // Log de aviso se usando fallback
    if (usedFallback) {
      console.warn('Using fallback data - INMET API may be unavailable or no data for current date')
    }

    // Ordenar por nível de alerta (severos primeiro)
    const alertOrder = { severe: 0, alert: 1, attention: 2, normal: 3 }
    results.sort((a, b) => alertOrder[a.alertLevel] - alertOrder[b.alertLevel])

    return NextResponse.json({
      success: true,
      data: results,
      total: results.length,
      totalAvailable: stationCodes.length,
      location: locationInfo,
      timestamp: new Date().toISOString(),
      usingFallback: usedFallback,
      note: usedFallback ? 'Usando dados simulados - API INMET sem dados para data atual' : undefined
    })
  } catch (error) {
    console.error('Error in weather API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
