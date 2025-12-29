import { AlertTriangle, AlertCircle, XCircle, MapPin, Clock, Filter } from 'lucide-react'

type AlertLevel = 'attention' | 'alert' | 'severe'

interface Alert {
  id: string
  region: string
  level: AlertLevel
  type: string
  message: string
  time: string
  rain1h: number
  rain24h: number
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    region: 'Centro',
    level: 'severe',
    type: 'Alagamento',
    message: 'Risco de alagamento iminente. Acumulado 24h acima de 50mm.',
    time: '10 min atrás',
    rain1h: 12.5,
    rain24h: 52.3,
  },
  {
    id: '2',
    region: 'Zona Sul - Jardim América',
    level: 'severe',
    type: 'Alagamento',
    message: 'Pontos de alagamento reportados na região.',
    time: '15 min atrás',
    rain1h: 18.2,
    rain24h: 48.7,
  },
  {
    id: '3',
    region: 'Zona Norte',
    level: 'alert',
    type: 'Chuva Intensa',
    message: 'Chuva intensa nas últimas horas. Monitorar evolução.',
    time: '25 min atrás',
    rain1h: 15.4,
    rain24h: 35.1,
  },
  {
    id: '4',
    region: 'Zona Leste',
    level: 'attention',
    type: 'Monitoramento',
    message: 'Chuva moderada. Situação sob controle.',
    time: '45 min atrás',
    rain1h: 8.2,
    rain24h: 22.6,
  },
]

const alertConfig: Record<AlertLevel, {
  icon: typeof AlertTriangle
  color: string
  bg: string
  border: string
  label: string
}> = {
  attention: {
    icon: AlertCircle,
    color: 'text-yellow-600',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    label: 'Atenção',
  },
  alert: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    label: 'Alerta',
  },
  severe: {
    icon: XCircle,
    color: 'text-red-600',
    bg: 'bg-red-50',
    border: 'border-red-200',
    label: 'Severo',
  },
}

export default function AlertasPage() {
  const severeCount = mockAlerts.filter(a => a.level === 'severe').length
  const alertCount = mockAlerts.filter(a => a.level === 'alert').length
  const attentionCount = mockAlerts.filter(a => a.level === 'attention').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Alertas Hidrológicos e Risco
          </h1>
          <p className="text-gray-500">
            Monitoramento em tempo real de alertas ativos
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
          <Filter size={18} />
          Filtrar
        </button>
      </div>

      {/* Contadores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-8 w-8 text-red-600" />
            <div>
              <div className="text-3xl font-bold text-red-700">{severeCount}</div>
              <div className="text-sm text-red-600">Alertas Severos</div>
            </div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-orange-600" />
            <div>
              <div className="text-3xl font-bold text-orange-700">{alertCount}</div>
              <div className="text-sm text-orange-600">Alertas</div>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-yellow-600" />
            <div>
              <div className="text-3xl font-bold text-yellow-700">{attentionCount}</div>
              <div className="text-sm text-yellow-600">Em Atenção</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="space-y-4">
        {mockAlerts.map((alert) => {
          const config = alertConfig[alert.level]
          const Icon = config.icon

          return (
            <div
              key={alert.id}
              className={`${config.bg} ${config.border} border rounded-xl p-5`}
            >
              <div className="flex items-start gap-4">
                <Icon className={`${config.color} h-6 w-6 mt-0.5 flex-shrink-0`} />

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                      <span className="text-sm font-medium text-gray-600">
                        {alert.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="h-4 w-4" />
                      {alert.time}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{alert.region}</span>
                  </div>

                  <p className="text-gray-700 mb-3">{alert.message}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <span className="text-gray-500">Última 1h:</span>
                      <span className="ml-1 font-semibold">{alert.rain1h} mm</span>
                    </div>
                    <div>
                      <span className="text-gray-500">24h:</span>
                      <span className="ml-1 font-semibold">{alert.rain24h} mm</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
