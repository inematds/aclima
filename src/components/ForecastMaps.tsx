'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  CloudRain,
  Thermometer,
  Cloud,
  Radio,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Lock
} from 'lucide-react'

interface RainViewerFrame {
  time: number
  path: string
}

interface RainViewerData {
  radar: {
    past: RainViewerFrame[]
    nowcast: RainViewerFrame[]
  }
  host: string
}

type MapLayer = 'radar' | 'precipitation' | 'temperature' | 'clouds'

interface ForecastMapsProps {
  latitude?: number
  longitude?: number
  className?: string
}

const layerConfig: Record<MapLayer, {
  icon: typeof CloudRain
  label: string
  color: string
  activeColor: string
  owmLayer?: string
}> = {
  radar: {
    icon: Radio,
    label: 'Radar',
    color: 'text-gray-600 bg-white border-gray-200 hover:bg-green-50',
    activeColor: 'text-green-700 bg-green-100 border-green-300'
  },
  precipitation: {
    icon: CloudRain,
    label: 'Precipitação',
    color: 'text-gray-600 bg-white border-gray-200 hover:bg-blue-50',
    activeColor: 'text-blue-700 bg-blue-100 border-blue-300',
    owmLayer: 'precipitation_new'
  },
  temperature: {
    icon: Thermometer,
    label: 'Temperatura',
    color: 'text-gray-600 bg-white border-gray-200 hover:bg-red-50',
    activeColor: 'text-red-700 bg-red-100 border-red-300',
    owmLayer: 'temp_new'
  },
  clouds: {
    icon: Cloud,
    label: 'Nuvens',
    color: 'text-gray-600 bg-white border-gray-200 hover:bg-gray-100',
    activeColor: 'text-gray-700 bg-gray-200 border-gray-400',
    owmLayer: 'clouds_new'
  }
}

export default function ForecastMaps({
  latitude = -23.5505,
  longitude = -46.6333,
  className = ''
}: ForecastMapsProps) {
  const [activeLayer, setActiveLayer] = useState<MapLayer>('radar')
  const [rainViewerData, setRainViewerData] = useState<RainViewerData | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // NEXT_PUBLIC_ variables are inlined at build time
  const owmApiKey = process.env.NEXT_PUBLIC_OWM_API_KEY || ''
  const hasOwmKey = owmApiKey.length > 0

  // Fetch RainViewer data
  const fetchRainViewerData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json')
      if (!response.ok) throw new Error('Failed to fetch radar data')
      const data = await response.json()
      setRainViewerData(data)
      // Set to latest frame
      const allFrames = [...(data.radar?.past || []), ...(data.radar?.nowcast || [])]
      setCurrentFrame(Math.max(0, allFrames.length - 1))
    } catch (err) {
      setError('Erro ao carregar dados do radar')
      console.error('RainViewer error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRainViewerData()
    // Refresh every 10 minutes
    const interval = setInterval(fetchRainViewerData, 10 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchRainViewerData])

  // Animation control
  useEffect(() => {
    if (!isPlaying || !rainViewerData || activeLayer !== 'radar') return

    const allFrames = [...(rainViewerData.radar?.past || []), ...(rainViewerData.radar?.nowcast || [])]
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % allFrames.length)
    }, 500)

    return () => clearInterval(interval)
  }, [isPlaying, rainViewerData, activeLayer])

  const allFrames = rainViewerData
    ? [...(rainViewerData.radar?.past || []), ...(rainViewerData.radar?.nowcast || [])]
    : []

  const currentFrameData = allFrames[currentFrame]
  const isPastFrame = rainViewerData && currentFrame < (rainViewerData.radar?.past?.length || 0)

  // Calculate tile coordinates for the location
  const zoom = 6
  const tileX = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom))
  const tileY = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))

  // Get OpenWeatherMap tile URL
  const getOwmTileUrl = (layer: string, x: number, y: number) => {
    if (!owmApiKey) return null
    return `https://tile.openweathermap.org/map/${layer}/${zoom}/${x}/${y}.png?appid=${owmApiKey}`
  }

  // Generate a larger map view (3x3 tiles)
  const getTileGrid = () => {
    const tiles = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const x = tileX + dx
        const y = tileY + dy
        tiles.push({ x, y, dx, dy })
      }
    }
    return tiles
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrevFrame = () => {
    setIsPlaying(false)
    setCurrentFrame(prev => Math.max(0, prev - 1))
  }

  const handleNextFrame = () => {
    setIsPlaying(false)
    setCurrentFrame(prev => Math.min(allFrames.length - 1, prev + 1))
  }

  const handleLayerClick = (layer: MapLayer) => {
    const needsKey = layer !== 'radar' && !hasOwmKey
    if (!needsKey) {
      setActiveLayer(layer)
      if (layer !== 'radar') {
        setIsPlaying(false)
      }
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Mapas de Previsão</h3>
        <button
          onClick={fetchRainViewerData}
          disabled={loading}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Layer selector */}
      <div className="p-2 border-b flex gap-1 overflow-x-auto">
        {(Object.keys(layerConfig) as MapLayer[]).map(layer => {
          const config = layerConfig[layer]
          const Icon = config.icon
          const isActive = activeLayer === layer
          const needsKey = layer !== 'radar' && !hasOwmKey

          return (
            <button
              key={layer}
              onClick={() => handleLayerClick(layer)}
              disabled={needsKey}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                isActive
                  ? config.activeColor
                  : needsKey
                  ? 'text-gray-400 bg-gray-50 border-gray-200 cursor-not-allowed'
                  : config.color
              }`}
              title={needsKey ? 'Configure NEXT_PUBLIC_OWM_API_KEY no .env.local' : config.label}
            >
              {needsKey ? (
                <Lock className="h-3 w-3" />
              ) : (
                <Icon className="h-3.5 w-3.5" />
              )}
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Map view */}
      <div className="relative bg-gray-900 overflow-hidden" style={{ aspectRatio: '1/1', maxHeight: '400px' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center text-center p-4">
            <div>
              <p className="text-red-400 mb-2">{error}</p>
              <button
                onClick={fetchRainViewerData}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Base map (OpenStreetMap) */}
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {getTileGrid().map(({ x, y }) => (
                <div key={`base-${x}-${y}`} className="relative overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
                    alt=""
                    className="w-full h-full opacity-70"
                    style={{ display: 'block' }}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Radar overlay (RainViewer) */}
            {activeLayer === 'radar' && rainViewerData && currentFrameData && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {getTileGrid().map(({ x, y }) => (
                  <div key={`radar-${x}-${y}`} className="relative overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${rainViewerData.host}${currentFrameData.path}/256/${zoom}/${x}/${y}/2/1_1.png`}
                      alt=""
                      className="w-full h-full"
                      style={{ display: 'block' }}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* OpenWeatherMap layers */}
            {activeLayer !== 'radar' && layerConfig[activeLayer].owmLayer && hasOwmKey && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {getTileGrid().map(({ x, y }) => {
                  const url = getOwmTileUrl(layerConfig[activeLayer].owmLayer!, x, y)
                  if (!url) return null
                  return (
                    <div key={`owm-${x}-${y}`} className="relative overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt=""
                        className="w-full h-full"
                        style={{ display: 'block' }}
                        loading="lazy"
                        onError={(e) => {
                          console.error('OWM tile error:', url)
                          ;(e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  )
                })}
              </div>
            )}

            {/* Message if no OWM key */}
            {activeLayer !== 'radar' && !hasOwmKey && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="bg-white rounded-lg p-4 text-center max-w-sm mx-4">
                  <Lock className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">Chave API não configurada</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure NEXT_PUBLIC_OWM_API_KEY no Vercel para usar esta camada
                  </p>
                </div>
              </div>
            )}

            {/* Center marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
            </div>

            {/* Timestamp badge (radar only) */}
            {activeLayer === 'radar' && currentFrameData && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatTime(currentFrameData.time)}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                  isPastFrame ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {isPastFrame ? 'Passado' : 'Previsão'}
                </span>
              </div>
            )}

            {/* Layer info badge (non-radar) */}
            {activeLayer !== 'radar' && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {layerConfig[activeLayer].label} - Tempo real
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
              {activeLayer === 'radar' && (
                <div className="flex items-center gap-1">
                  <span>Fraco</span>
                  <div className="w-16 h-2 rounded" style={{
                    background: 'linear-gradient(to right, #00ff00, #ffff00, #ff9900, #ff0000, #ff00ff)'
                  }} />
                  <span>Forte</span>
                </div>
              )}
              {activeLayer === 'precipitation' && (
                <div className="flex items-center gap-1">
                  <span>0mm</span>
                  <div className="w-16 h-2 rounded" style={{
                    background: 'linear-gradient(to right, #00000000, #00ff00, #ffff00, #ff0000)'
                  }} />
                  <span>140mm</span>
                </div>
              )}
              {activeLayer === 'temperature' && (
                <div className="flex items-center gap-1">
                  <span>-40°C</span>
                  <div className="w-16 h-2 rounded" style={{
                    background: 'linear-gradient(to right, #0000ff, #00ffff, #00ff00, #ffff00, #ff0000)'
                  }} />
                  <span>40°C</span>
                </div>
              )}
              {activeLayer === 'clouds' && (
                <div className="flex items-center gap-1">
                  <span>Limpo</span>
                  <div className="w-16 h-2 rounded" style={{
                    background: 'linear-gradient(to right, #00000000, #ffffff)'
                  }} />
                  <span>Nublado</span>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Timeline controls (radar only) */}
      {activeLayer === 'radar' && allFrames.length > 0 && (
        <div className="p-3 border-t">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>

            <button
              onClick={handlePrevFrame}
              disabled={currentFrame === 0}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={allFrames.length - 1}
                value={currentFrame}
                onChange={(e) => {
                  setIsPlaying(false)
                  setCurrentFrame(parseInt(e.target.value))
                }}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                <span>-2h</span>
                <span>Agora</span>
                <span>+30min</span>
              </div>
            </div>

            <button
              onClick={handleNextFrame}
              disabled={currentFrame === allFrames.length - 1}
              className="p-1 text-gray-600 hover:text-gray-900 disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* API Key notice */}
      {!hasOwmKey && activeLayer === 'radar' && (
        <div className="px-3 py-2 border-t bg-amber-50 text-amber-700 text-xs">
          <Lock className="h-3 w-3 inline mr-1" />
          Para Precipitação, Temperatura e Nuvens, configure <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_OWM_API_KEY</code> no .env.local
        </div>
      )}

      {/* Source */}
      <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
        Fonte: {activeLayer === 'radar' ? 'RainViewer' : 'OpenWeatherMap'} | OpenStreetMap (mapa base)
      </div>
    </div>
  )
}
