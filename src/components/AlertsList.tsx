import { AlertTriangle, AlertCircle, XCircle } from 'lucide-react'

type AlertLevel = 'attention' | 'alert' | 'severe'

interface Alert {
  id: string
  region: string
  level: AlertLevel
  message: string
  time: string
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    region: 'Centro',
    level: 'severe',
    message: 'Risco de alagamento - 50mm nas últimas 24h',
    time: '10 min atrás',
  },
  {
    id: '2',
    region: 'Zona Sul',
    level: 'alert',
    message: 'Chuva intensa - 32mm na última hora',
    time: '25 min atrás',
  },
  {
    id: '3',
    region: 'Zona Norte',
    level: 'attention',
    message: 'Chuva moderada - monitorando',
    time: '45 min atrás',
  },
]

const alertConfig: Record<AlertLevel, { icon: typeof AlertTriangle; color: string; bg: string }> = {
  attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
  },
  severe: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
  },
}

export default function AlertsList() {
  return (
    <div className="space-y-3">
      {mockAlerts.map((alert) => {
        const config = alertConfig[alert.level]
        const Icon = config.icon

        return (
          <div
            key={alert.id}
            className={`${config.bg} rounded-lg p-3 border border-gray-100`}
          >
            <div className="flex items-start gap-3">
              <Icon className={`${config.color} h-5 w-5 mt-0.5 flex-shrink-0`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">{alert.region}</span>
                  <span className="text-xs text-gray-500">{alert.time}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              </div>
            </div>
          </div>
        )
      })}

      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800 py-2">
        Ver todos os alertas →
      </button>
    </div>
  )
}
