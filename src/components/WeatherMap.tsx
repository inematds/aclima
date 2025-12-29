'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { WeatherData } from '@/types/weather'

interface WeatherMapProps {
  stations: WeatherData[]
  selectedStation?: string | null
  onStationSelect?: (stationId: string) => void
  center?: [number, number]
  zoom?: number
  className?: string
}

const ALERT_COLORS = {
  normal: '#22c55e',    // green-500
  attention: '#eab308', // yellow-500
  alert: '#f97316',     // orange-500
  severe: '#ef4444',    // red-500
}

const ALERT_LABELS = {
  normal: 'Normal',
  attention: 'Atenção',
  alert: 'Alerta',
  severe: 'Severo',
}

export default function WeatherMap({
  stations,
  selectedStation,
  onStationSelect,
  center,
  zoom = 6,
  className = ''
}: WeatherMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.CircleMarker[]>([])

  // Calculate center from stations if not provided
  const mapCenter = center || calculateCenter(stations)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    // Initialize map
    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom,
      zoomControl: true,
      attributionControl: true,
    })

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update markers when stations change
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove())
    markersRef.current = []

    // Add new markers
    stations.forEach(station => {
      const color = ALERT_COLORS[station.alertLevel]
      const isSelected = station.stationId === selectedStation

      const marker = L.circleMarker([station.coordinates.lat, station.coordinates.lng], {
        radius: isSelected ? 12 : 8,
        fillColor: color,
        color: isSelected ? '#1e40af' : '#ffffff',
        weight: isSelected ? 3 : 2,
        opacity: 1,
        fillOpacity: 0.8,
      })

      // Popup content
      const popupContent = `
        <div style="min-width: 180px; font-family: system-ui, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px; color: #1f2937;">
            ${station.stationName}
          </div>
          <div style="display: grid; gap: 4px; font-size: 12px; color: #4b5563;">
            <div style="display: flex; justify-content: space-between;">
              <span>Chuva 1h:</span>
              <span style="font-weight: 500; color: #1f2937;">${station.rain.last1h} mm</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Chuva 24h:</span>
              <span style="font-weight: 500; color: #1f2937;">${station.rain.last24h} mm</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Temperatura:</span>
              <span style="font-weight: 500; color: #1f2937;">${station.temperature.current}°C</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>Umidade:</span>
              <span style="font-weight: 500; color: #1f2937;">${station.humidity.current}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 4px; padding-top: 4px; border-top: 1px solid #e5e7eb;">
              <span>Nível:</span>
              <span style="font-weight: 600; color: ${color};">${ALERT_LABELS[station.alertLevel]}</span>
            </div>
          </div>
        </div>
      `

      marker.bindPopup(popupContent)

      // Click handler
      if (onStationSelect) {
        marker.on('click', () => {
          onStationSelect(station.stationId)
        })
      }

      marker.addTo(map)
      markersRef.current.push(marker)
    })

    // Fit bounds to show all stations
    if (stations.length > 0 && !center) {
      const bounds = L.latLngBounds(
        stations.map(s => [s.coordinates.lat, s.coordinates.lng])
      )
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 10 })
    }
  }, [stations, selectedStation, onStationSelect, center])

  // Update center when it changes
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !center) return
    map.setView(center, zoom)
  }, [center, zoom])

  return (
    <div className={`relative ${className}`}>
      <div ref={mapRef} className="w-full h-full rounded-lg" style={{ minHeight: '300px' }} />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000]">
        <div className="text-xs font-semibold text-gray-700 mb-2">Nível de Risco</div>
        <div className="space-y-1.5">
          {Object.entries(ALERT_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-gray-600">
                {ALERT_LABELS[level as keyof typeof ALERT_LABELS]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Station count */}
      <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg px-3 py-2 z-[1000]">
        <span className="text-xs text-gray-600">
          <span className="font-semibold text-gray-900">{stations.length}</span> estações
        </span>
      </div>
    </div>
  )
}

function calculateCenter(stations: WeatherData[]): [number, number] {
  if (stations.length === 0) {
    // Default to center of Brazil
    return [-14.235, -51.9253]
  }

  const sumLat = stations.reduce((sum, s) => sum + s.coordinates.lat, 0)
  const sumLng = stations.reduce((sum, s) => sum + s.coordinates.lng, 0)

  return [sumLat / stations.length, sumLng / stations.length]
}
