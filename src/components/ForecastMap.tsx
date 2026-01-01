'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { ForecastData } from '@/app/api/forecast/route'

interface ForecastMapProps {
  latitude: number
  longitude: number
  forecastData: ForecastData | null
  selectedDay: number
  mapVariable: 'temperature' | 'precipitation' | 'wind'
}

const TEMP_COLORS = [
  { temp: -10, color: '#1e3a5f' },
  { temp: 0, color: '#3b82f6' },
  { temp: 10, color: '#22c55e' },
  { temp: 20, color: '#eab308' },
  { temp: 30, color: '#f97316' },
  { temp: 40, color: '#dc2626' },
]

const PRECIP_COLORS = [
  { value: 0, color: '#e5e7eb' },
  { value: 1, color: '#bfdbfe' },
  { value: 5, color: '#60a5fa' },
  { value: 10, color: '#3b82f6' },
  { value: 25, color: '#1d4ed8' },
  { value: 50, color: '#1e3a8a' },
]

const WIND_COLORS = [
  { value: 0, color: '#d1fae5' },
  { value: 10, color: '#6ee7b7' },
  { value: 20, color: '#34d399' },
  { value: 30, color: '#10b981' },
  { value: 50, color: '#059669' },
  { value: 70, color: '#047857' },
]

function getColorForValue(value: number, colorScale: { value?: number; temp?: number; color: string }[]): string {
  const key = 'temp' in colorScale[0] ? 'temp' : 'value'
  for (let i = colorScale.length - 1; i >= 0; i--) {
    const threshold = (colorScale[i] as any)[key]
    if (value >= threshold) {
      return colorScale[i].color
    }
  }
  return colorScale[0].color
}

export default function ForecastMap({
  latitude,
  longitude,
  forecastData,
  selectedDay,
  mapVariable
}: ForecastMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const circleRef = useRef<L.Circle | null>(null)
  const legendRef = useRef<L.Control | null>(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 8,
      zoomControl: true,
    })

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // Update map center when location changes
  useEffect(() => {
    if (!mapInstanceRef.current) return
    mapInstanceRef.current.setView([latitude, longitude], 8)
  }, [latitude, longitude])

  // Update visualization
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !forecastData) return

    // Remove existing circle and legend
    if (circleRef.current) {
      circleRef.current.remove()
    }
    if (legendRef.current) {
      legendRef.current.remove()
    }

    const dayData = forecastData.daily[selectedDay]
    if (!dayData) return

    let value: number
    let color: string
    let label: string
    let unit: string
    let colorScale: { value?: number; temp?: number; color: string }[]

    switch (mapVariable) {
      case 'temperature':
        value = dayData.temperature_2m_mean
        colorScale = TEMP_COLORS
        color = getColorForValue(value, colorScale)
        label = 'Temperatura'
        unit = '°C'
        break
      case 'precipitation':
        value = dayData.precipitation_sum
        colorScale = PRECIP_COLORS
        color = getColorForValue(value, colorScale)
        label = 'Precipitacao'
        unit = 'mm'
        break
      case 'wind':
        value = dayData.wind_speed_10m_max
        colorScale = WIND_COLORS
        color = getColorForValue(value, colorScale)
        label = 'Vento'
        unit = 'km/h'
        break
    }

    // Create circle marker
    const circle = L.circle([latitude, longitude], {
      radius: 50000, // 50km radius
      fillColor: color,
      fillOpacity: 0.4,
      color: color,
      weight: 2,
    }).addTo(map)

    // Add popup
    circle.bindPopup(`
      <div style="text-align: center; min-width: 150px;">
        <strong>${forecastData.location.name}</strong><br/>
        <span style="color: ${color}; font-size: 1.25rem; font-weight: bold;">
          ${value.toFixed(1)} ${unit}
        </span><br/>
        <small>${label}</small>
      </div>
    `)

    circleRef.current = circle

    // Add legend
    const legend = new L.Control({ position: 'bottomleft' })
    legend.onAdd = function () {
      const div = L.DomUtil.create('div', 'legend')
      div.style.backgroundColor = 'white'
      div.style.padding = '10px'
      div.style.borderRadius = '8px'
      div.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      div.style.fontSize = '12px'

      let html = `<div style="font-weight: 600; margin-bottom: 8px;">${label} (${unit})</div>`

      const key = 'temp' in colorScale[0] ? 'temp' : 'value'
      colorScale.forEach((item, i) => {
        const threshold = (item as any)[key]
        const next = colorScale[i + 1] ? (colorScale[i + 1] as any)[key] : '+'
        html += `
          <div style="display: flex; align-items: center; gap: 8px; margin: 2px 0;">
            <div style="width: 20px; height: 12px; background: ${item.color}; border-radius: 2px;"></div>
            <span>${threshold} - ${next}</span>
          </div>
        `
      })

      div.innerHTML = html
      return div
    }
    legend.addTo(map)
    legendRef.current = legend

  }, [forecastData, selectedDay, mapVariable, latitude, longitude])

  return <div ref={mapRef} className="w-full h-full" />
}
