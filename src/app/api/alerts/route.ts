import { NextResponse } from 'next/server'
import type { AlertData } from '@/types/weather'

// Cache para alertas
let alertsCache: { data: AlertData[]; timestamp: number } | null = null
const CACHE_TTL = 10 * 60 * 1000 // 10 minutos

// Mapear severidade INMET para nosso sistema
function mapSeverity(inmetSeverity: string): 'attention' | 'alert' | 'severe' {
  const lower = inmetSeverity.toLowerCase()
  if (lower.includes('grande') || lower.includes('muito alto') || lower.includes('extremo')) {
    return 'severe'
  }
  if (lower.includes('alto') || lower.includes('moderado')) {
    return 'alert'
  }
  return 'attention'
}

// Mapear tipo de alerta
function mapAlertType(description: string): 'rain' | 'flood' | 'storm' | 'wind' {
  const lower = description.toLowerCase()
  if (lower.includes('chuva') || lower.includes('precipitação')) return 'rain'
  if (lower.includes('alagamento') || lower.includes('inundação')) return 'flood'
  if (lower.includes('tempestade') || lower.includes('raio')) return 'storm'
  if (lower.includes('vento') || lower.includes('vendaval')) return 'wind'
  return 'rain'
}

// Buscar alertas ativos do INMET
async function fetchINMETAlerts(): Promise<AlertData[]> {
  const alerts: AlertData[] = []

  // Estados para monitorar
  const states = ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS']

  // Buscar avisos gerais do INMET (usando endpoint público)
  try {
    // Nota: O INMET não tem uma API REST pública bem documentada para alertas
    // Esta é uma implementação exemplo que pode precisar de ajustes
    // baseado na disponibilidade real da API

    const response = await fetch(
      'https://apiprevmet3.inmet.gov.br/avisos/ativos',
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 600 }
      }
    )

    if (response.ok) {
      const data = await response.json()

      if (Array.isArray(data)) {
        for (const aviso of data) {
          // Filtrar por estados de interesse
          const estadosAfetados = aviso.estados || []
          const relevante = estadosAfetados.some((e: string) =>
            states.includes(e.toUpperCase())
          )

          if (relevante) {
            alerts.push({
              id: aviso.id?.toString() || Math.random().toString(36).substr(2, 9),
              region: estadosAfetados.join(', '),
              level: mapSeverity(aviso.severidade || 'moderado'),
              type: mapAlertType(aviso.descricao || ''),
              message: aviso.descricao || 'Alerta meteorológico ativo',
              startTime: aviso.inicio || new Date().toISOString(),
              endTime: aviso.fim,
              source: 'INMET',
              rain1h: aviso.chuva_1h,
              rain24h: aviso.chuva_24h
            })
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching INMET alerts:', error)
  }

  return alerts
}

// Se não conseguir da API, gerar alertas baseados nos dados meteorológicos
async function generateAlertsFromWeather(): Promise<AlertData[]> {
  const alerts: AlertData[] = []

  // Não tentar durante build estático
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_URL) {
    return alerts
  }

  try {
    // Buscar dados do nosso endpoint de weather
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    const response = await fetch(`${baseUrl}/api/weather`, {
      next: { revalidate: 300 },
      signal: AbortSignal.timeout(5000) // timeout de 5s
    })

    if (response.ok) {
      const { data } = await response.json()

      if (Array.isArray(data)) {
        for (const station of data) {
          if (station.alertLevel !== 'normal') {
            let message = ''
            let type: 'rain' | 'flood' | 'storm' | 'wind' = 'rain'

            if (station.rain.last24h >= 50) {
              message = `Acumulado de ${station.rain.last24h}mm em 24h. Risco de alagamentos.`
              type = 'flood'
            } else if (station.rain.last1h >= 30) {
              message = `Chuva intensa: ${station.rain.last1h}mm na última hora.`
              type = 'rain'
            } else if (station.rain.last1h >= 10) {
              message = `Chuva moderada: ${station.rain.last1h}mm na última hora. Monitorando.`
              type = 'rain'
            }

            if (station.wind.gust >= 60) {
              message += ` Rajadas de vento de ${station.wind.gust}km/h.`
              type = 'wind'
            }

            if (message) {
              alerts.push({
                id: `gen-${station.stationId}`,
                region: station.stationName,
                level: station.alertLevel as 'attention' | 'alert' | 'severe',
                type,
                message,
                startTime: station.timestamp,
                source: 'AClima (calculado)',
                rain1h: station.rain.last1h,
                rain24h: station.rain.last24h
              })
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error generating alerts from weather:', error)
  }

  return alerts
}

export async function GET() {
  try {
    // Verificar cache
    if (alertsCache && Date.now() - alertsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: alertsCache.data,
        cached: true,
        timestamp: new Date(alertsCache.timestamp).toISOString()
      })
    }

    // Tentar buscar do INMET primeiro
    let alerts = await fetchINMETAlerts()

    // Se não tiver alertas do INMET, gerar dos dados meteorológicos
    if (alerts.length === 0) {
      alerts = await generateAlertsFromWeather()
    }

    // Ordenar por severidade
    const severityOrder = { severe: 0, alert: 1, attention: 2 }
    alerts.sort((a, b) => severityOrder[a.level] - severityOrder[b.level])

    // Atualizar cache
    alertsCache = {
      data: alerts,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      data: alerts,
      total: alerts.length,
      summary: {
        severe: alerts.filter(a => a.level === 'severe').length,
        alert: alerts.filter(a => a.level === 'alert').length,
        attention: alerts.filter(a => a.level === 'attention').length
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error in alerts API:', error)

    // Retornar cache antigo se disponível
    if (alertsCache) {
      return NextResponse.json({
        success: true,
        data: alertsCache.data,
        cached: true,
        stale: true,
        timestamp: new Date(alertsCache.timestamp).toISOString()
      })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}
