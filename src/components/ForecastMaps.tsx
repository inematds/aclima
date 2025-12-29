'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Radio,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw
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

interface ForecastMapsProps {
  latitude?: number
  longitude?: number
  className?: string
}

export default function ForecastMaps({
  latitude = -23.5505,
  longitude = -46.6333,
  className = ''
}: ForecastMapsProps) {
  const [rainViewerData, setRainViewerData] = useState<RainViewerData | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    if (!isPlaying || !rainViewerData) return

    const allFrames = [...(rainViewerData.radar?.past || []), ...(rainViewerData.radar?.nowcast || [])]
    const interval = setInterval(() => {
      setCurrentFrame(prev => (prev + 1) % allFrames.length)
    }, 500)

    return () => clearInterval(interval)
  }, [isPlaying, rainViewerData])

  const allFrames = rainViewerData
    ? [...(rainViewerData.radar?.past || []), ...(rainViewerData.radar?.nowcast || [])]
    : []

  const currentFrameData = allFrames[currentFrame]
  const isPastFrame = rainViewerData && currentFrame < (rainViewerData.radar?.past?.length || 0)

  // Calculate tile coordinates for the location
  const zoom = 6
  const tileX = Math.floor((longitude + 180) / 360 * Math.pow(2, zoom))
  const tileY = Math.floor((1 - Math.log(Math.tan(latitude * Math.PI / 180) + 1 / Math.cos(latitude * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom))

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

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-green-600" />
          <h3 className="font-semibold text-gray-900">Radar de Precipitação</h3>
        </div>
        <button
          onClick={fetchRainViewerData}
          disabled={loading}
          className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
          title="Atualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Map view */}
      <div className="relative aspect-video bg-gray-900 overflow-hidden">
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
                <div key={`${x}-${y}`} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`}
                    alt=""
                    className="w-full h-full object-cover opacity-70"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>

            {/* Radar overlay */}
            {rainViewerData && currentFrameData && (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {getTileGrid().map(({ x, y }) => (
                  <div key={`radar-${x}-${y}`} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`${rainViewerData.host}${currentFrameData.path}/256/${zoom}/${x}/${y}/2/1_1.png`}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Center marker */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg" />
            </div>

            {/* Timestamp badge */}
            {currentFrameData && (
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                {formatTime(currentFrameData.time)}
                <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${
                  isPastFrame ? 'bg-blue-500' : 'bg-orange-500'
                }`}>
                  {isPastFrame ? 'Passado' : 'Previsão'}
                </span>
              </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded">
              <div className="flex items-center gap-1">
                <span>Fraco</span>
                <div className="w-16 h-2 rounded" style={{
                  background: 'linear-gradient(to right, #00ff00, #ffff00, #ff9900, #ff0000, #ff00ff)'
                }} />
                <span>Forte</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Timeline controls */}
      {allFrames.length > 0 && (
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

      {/* Source */}
      <div className="px-3 py-2 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
        Fonte: RainViewer (radar) | OpenStreetMap (mapa base)
      </div>
    </div>
  )
}
