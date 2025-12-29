import { NextResponse } from 'next/server'

// API de geocoding usando Open-Meteo Geocoding API (gratuita)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const city = searchParams.get('city')
  const state = searchParams.get('state') // UF opcional

  if (!city) {
    return NextResponse.json(
      { error: 'Parâmetro "city" é obrigatório' },
      { status: 400 }
    )
  }

  try {
    // Construir query de busca
    const searchQuery = state ? `${city}, ${state}, Brasil` : `${city}, Brasil`

    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=5&language=pt&format=json`
    )

    if (!response.ok) {
      throw new Error('Erro ao buscar localização')
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      return NextResponse.json(
        { error: 'Cidade não encontrada', results: [] },
        { status: 404 }
      )
    }

    // Filtrar apenas resultados do Brasil
    const brazilResults = data.results.filter((r: any) =>
      r.country_code === 'BR' || r.country === 'Brasil' || r.country === 'Brazil'
    )

    const results = brazilResults.map((r: any) => ({
      name: r.name,
      state: r.admin1 || '',
      country: r.country,
      latitude: r.latitude,
      longitude: r.longitude,
      population: r.population || 0,
      elevation: r.elevation || 0,
    }))

    return NextResponse.json({
      success: true,
      results,
      query: searchQuery,
    })
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar localização' },
      { status: 500 }
    )
  }
}
