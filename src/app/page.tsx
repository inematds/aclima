import StatusCard from '@/components/StatusCard'
import AlertsList from '@/components/AlertsList'
import RainChart from '@/components/RainChart'
import RegionsList from '@/components/RegionsList'

export default function Home() {
  return (
    <div className="space-y-6">
      {/* Header da página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Situação Meteorológica Atual
          </h1>
          <p className="text-gray-500">
            Última atualização: {new Date().toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span className="text-sm text-gray-600">Ao vivo</span>
        </div>
      </div>

      {/* Cards de Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Chuva Agora"
          value="2.4"
          unit="mm/h"
          status="normal"
          trend="stable"
        />
        <StatusCard
          title="Acumulado 1h"
          value="8.2"
          unit="mm"
          status="normal"
          trend="up"
        />
        <StatusCard
          title="Acumulado 24h"
          value="32.5"
          unit="mm"
          status="attention"
          trend="up"
        />
        <StatusCard
          title="Alertas Ativos"
          value="3"
          unit=""
          status="alert"
          trend="stable"
        />
      </div>

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de chuva */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Precipitação nas últimas 24 horas
          </h2>
          <RainChart />
        </div>

        {/* Lista de alertas */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Alertas Ativos
          </h2>
          <AlertsList />
        </div>
      </div>

      {/* Lista de regiões */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Monitoramento por Região
        </h2>
        <RegionsList />
      </div>
    </div>
  )
}
