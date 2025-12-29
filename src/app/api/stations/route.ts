import { NextResponse } from 'next/server'

const INMET_API_BASE = 'https://apitempo.inmet.gov.br'

// Cache simples em memória (em produção, usar Redis)
let stationsCache: { data: any; timestamp: number } | null = null
const CACHE_TTL = 60 * 60 * 1000 // 1 hora

export async function GET() {
  try {
    // Verificar cache
    if (stationsCache && Date.now() - stationsCache.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        data: stationsCache.data,
        cached: true,
        timestamp: new Date(stationsCache.timestamp).toISOString()
      })
    }

    // Buscar lista de estações automáticas
    const response = await fetch(`${INMET_API_BASE}/estacoes/T`, {
      headers: {
        'Accept': 'application/json',
      },
      next: { revalidate: 3600 } // Cache por 1 hora
    })

    if (!response.ok) {
      throw new Error(`INMET API error: ${response.status}`)
    }

    const stations = await response.json()

    // Filtrar estações de interesse (SP e RJ)
    const filteredStations = stations.filter((s: any) =>
      ['SP', 'RJ', 'MG', 'PR', 'SC', 'RS'].includes(s.SG_ESTADO)
    )

    // Atualizar cache
    stationsCache = {
      data: filteredStations,
      timestamp: Date.now()
    }

    return NextResponse.json({
      success: true,
      data: filteredStations,
      total: filteredStations.length,
      cached: false,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching stations:', error)

    // Retornar cache antigo se disponível
    if (stationsCache) {
      return NextResponse.json({
        success: true,
        data: stationsCache.data,
        cached: true,
        stale: true,
        error: 'Using stale cache due to API error',
        timestamp: new Date(stationsCache.timestamp).toISOString()
      })
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch stations' },
      { status: 500 }
    )
  }
}
