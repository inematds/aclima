'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Loader2, Locate, Layers, X } from 'lucide-react'
import { useWeather } from '@/hooks/useWeather'
import { useGeolocation } from '@/hooks/useGeolocation'
import type { WeatherData, StateCode } from '@/types/weather'

const ALERT_COLORS = {
  normal: '#22c55e',
  attention: '#eab308',
  alert: '#f97316',
  severe: '#ef4444',
}

const ALERT_LABELS = {
  normal: 'Normal',
  attention: 'Atenção',
  alert: 'Alerta',
  severe: 'Severo',
}

export default function MobileMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.CircleMarker[]>([])

  const geolocation = useGeolocation()
  const [selectedStation, setSelectedStation] = useState<WeatherData | null>(null)
  const [showLegend, setShowLegend] = useState(false)

  const effectiveState: StateCode = geolocation.state || 'SP'

  const { data: weatherData, loading } = useWeather({
    refreshInterval: 5 * 60 * 1000,
    state: effectiveState
  })

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const center: [number, number] = geolocation.latitude && geolocation.longitude
      ? [geolocation.latitude, geolocation.longitude]
      : [-15.7801, -47.9292]

    const map = L.map(mapRef.current, {
      center,
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map)

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [geolocation.latitude, geolocation.longitude])

  // Update markers
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    weatherData.forEach(station => {
      const color = ALERT_COLORS[station.alertLevel]

      const marker = L.circleMarker([station.coordinates.lat, station.coordinates.lng], {
        radius: 10,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9,
      })

      marker.on('click', () => {
        setSelectedStation(station)
        map.setView([station.coordinates.lat, station.coordinates.lng], 10)
      })

      marker.addTo(map)
      markersRef.current.push(marker)
    })

    if (weatherData.length > 0 && !geolocation.latitude) {
      const bounds = L.latLngBounds(
        weatherData.map(s => [s.coordinates.lat, s.coordinates.lng])
      )
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 })
    }
  }, [weatherData, geolocation.latitude])

  // Center on user location
  const centerOnLocation = () => {
    if (geolocation.latitude && geolocation.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.setView([geolocation.latitude, geolocation.longitude], 10)
    }
  }

  return (
    <div className="fixed inset-0 pb-16">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-[1000]">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      )}

      {/* Top controls */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex items-center justify-between">
        <div className="bg-white rounded-full shadow-lg px-4 py-2">
          <span className="text-sm font-medium text-gray-900">
            {weatherData.length} estações
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={centerOnLocation}
            disabled={!geolocation.latitude}
            className="bg-white rounded-full shadow-lg p-3 disabled:opacity-50"
          >
            <Locate className="h-5 w-5 text-gray-700" />
          </button>

          <button
            onClick={() => setShowLegend(!showLegend)}
            className={`rounded-full shadow-lg p-3 ${showLegend ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
          >
            <Layers className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
          <div className="text-xs font-semibold text-gray-700 mb-2">Nível de Risco</div>
          <div className="space-y-1.5">
            {Object.entries(ALERT_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs text-gray-600">
                  {ALERT_LABELS[level as keyof typeof ALERT_LABELS]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Station detail bottom sheet */}
      {selectedStation && (
        <div className="absolute bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg z-[1000] overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">{selectedStation.stationName}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ALERT_COLORS[selectedStation.alertLevel] }}
                  />
                  <span className="text-xs text-gray-500">
                    {ALERT_LABELS[selectedStation.alertLevel]}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStation(null)}
                className="p-1 text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2 mt-3">
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStation.temperature.current}°
                </div>
                <div className="text-[10px] text-gray-500">Temp</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-gray-900">
                  {selectedStation.humidity.current}%
                </div>
                <div className="text-[10px] text-gray-500">Umid</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {selectedStation.rain.last1h}mm
                </div>
                <div className="text-[10px] text-gray-500">1h</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {selectedStation.rain.last24h}mm
                </div>
                <div className="text-[10px] text-gray-500">24h</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
