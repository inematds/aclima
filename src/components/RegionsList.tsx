import { MapPin, Droplets, Clock, AlertTriangle } from 'lucide-react'

type Status = 'normal' | 'attention' | 'alert' | 'severe'

interface Region {
  id: string
  name: string
  rainNow: number
  rain1h: number
  rain24h: number
  status: Status
  lastUpdate: string
}

const mockRegions: Region[] = [
  {
    id: '1',
    name: 'Centro',
    rainNow: 2.4,
    rain1h: 12.5,
    rain24h: 52.3,
    status: 'severe',
    lastUpdate: '2 min',
  },
  {
    id: '2',
    name: 'Zona Sul',
    rainNow: 4.8,
    rain1h: 18.2,
    rain24h: 35.1,
    status: 'alert',
    lastUpdate: '1 min',
  },
  {
    id: '3',
    name: 'Zona Norte',
    rainNow: 1.2,
    rain1h: 8.4,
    rain24h: 22.6,
    status: 'attention',
    lastUpdate: '3 min',
  },
  {
    id: '4',
    name: 'Zona Leste',
    rainNow: 0.5,
    rain1h: 2.1,
    rain24h: 8.9,
    status: 'normal',
    lastUpdate: '1 min',
  },
  {
    id: '5',
    name: 'Zona Oeste',
    rainNow: 0.8,
    rain1h: 3.5,
    rain24h: 12.4,
    status: 'normal',
    lastUpdate: '2 min',
  },
]

const statusConfig: Record<Status, { color: string; bg: string; label: string }> = {
  normal: { color: 'text-green-700', bg: 'bg-green-100', label: 'Normal' },
  attention: { color: 'text-yellow-700', bg: 'bg-yellow-100', label: 'Atenção' },
  alert: { color: 'text-orange-700', bg: 'bg-orange-100', label: 'Alerta' },
  severe: { color: 'text-red-700', bg: 'bg-red-100', label: 'Severo' },
}

export default function RegionsList() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-sm text-gray-500 border-b">
            <th className="pb-3 font-medium">Região</th>
            <th className="pb-3 font-medium text-center">Agora</th>
            <th className="pb-3 font-medium text-center">1h</th>
            <th className="pb-3 font-medium text-center">24h</th>
            <th className="pb-3 font-medium text-center">Status</th>
            <th className="pb-3 font-medium text-center">Atualização</th>
          </tr>
        </thead>
        <tbody>
          {mockRegions.map((region) => {
            const config = statusConfig[region.status]

            return (
              <tr
                key={region.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{region.name}</span>
                  </div>
                </td>
                <td className="py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span>{region.rainNow} mm/h</span>
                  </div>
                </td>
                <td className="py-4 text-center text-gray-600">
                  {region.rain1h} mm
                </td>
                <td className="py-4 text-center text-gray-600">
                  {region.rain24h} mm
                </td>
                <td className="py-4 text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {region.status !== 'normal' && <AlertTriangle className="h-3 w-3" />}
                    {config.label}
                  </span>
                </td>
                <td className="py-4 text-center">
                  <div className="flex items-center justify-center gap-1 text-gray-500 text-sm">
                    <Clock className="h-3 w-3" />
                    {region.lastUpdate}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
