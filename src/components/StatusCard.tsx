import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Status = 'normal' | 'attention' | 'alert' | 'severe'
type Trend = 'up' | 'down' | 'stable'

interface StatusCardProps {
  title: string
  value: string
  unit: string
  status: Status
  trend: Trend
}

const statusColors: Record<Status, string> = {
  normal: 'bg-green-100 border-green-500 text-green-700',
  attention: 'bg-yellow-100 border-yellow-500 text-yellow-700',
  alert: 'bg-orange-100 border-orange-500 text-orange-700',
  severe: 'bg-red-100 border-red-500 text-red-700',
}

const statusLabels: Record<Status, string> = {
  normal: 'Normal',
  attention: 'Atenção',
  alert: 'Alerta',
  severe: 'Severo',
}

const TrendIcon = ({ trend }: { trend: Trend }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className="h-4 w-4 text-red-500" />
    case 'down':
      return <TrendingDown className="h-4 w-4 text-green-500" />
    default:
      return <Minus className="h-4 w-4 text-gray-400" />
  }
}

export default function StatusCard({ title, value, unit, status, trend }: StatusCardProps) {
  return (
    <div className={`rounded-xl border-l-4 p-4 ${statusColors[status]} bg-white shadow-sm`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[status]}`}>
          {statusLabels[status]}
        </span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        <span className="text-lg text-gray-500">{unit}</span>
        <div className="ml-auto">
          <TrendIcon trend={trend} />
        </div>
      </div>
    </div>
  )
}
