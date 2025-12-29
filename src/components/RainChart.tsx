'use client'

// Dados mockados para demonstração
const mockData = [
  { hour: '00h', value: 0.5 },
  { hour: '02h', value: 0.2 },
  { hour: '04h', value: 0.8 },
  { hour: '06h', value: 2.1 },
  { hour: '08h', value: 5.4 },
  { hour: '10h', value: 8.2 },
  { hour: '12h', value: 3.5 },
  { hour: '14h', value: 1.2 },
  { hour: '16h', value: 4.8 },
  { hour: '18h', value: 6.3 },
  { hour: '20h', value: 2.4 },
  { hour: '22h', value: 1.8 },
]

const maxValue = Math.max(...mockData.map(d => d.value))

export default function RainChart() {
  return (
    <div className="h-64">
      <div className="flex items-end justify-between h-full gap-2">
        {mockData.map((data, index) => {
          const heightPercent = (data.value / maxValue) * 100
          const isHigh = data.value > 5

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-48">
                <span className="text-xs text-gray-600 mb-1">
                  {data.value.toFixed(1)}
                </span>
                <div
                  className={`w-full rounded-t transition-all duration-300 ${
                    isHigh ? 'bg-orange-400' : 'bg-blue-400'
                  }`}
                  style={{ height: `${heightPercent}%`, minHeight: '4px' }}
                />
              </div>
              <span className="text-xs text-gray-500">{data.hour}</span>
            </div>
          )
        })}
      </div>

      {/* Legenda */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-400 rounded" />
          <span className="text-gray-600">Normal (≤5mm/h)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400 rounded" />
          <span className="text-gray-600">Intenso (&gt;5mm/h)</span>
        </div>
      </div>
    </div>
  )
}
