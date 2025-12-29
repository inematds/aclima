'use client'

import { useState, useMemo, useEffect } from 'react'
import { MapPin, ChevronDown, Search, Loader2, AlertCircle } from 'lucide-react'
import { BRAZILIAN_STATES, type StateCode } from '@/types/weather'

interface StateSelectorProps {
  selectedState: StateCode
  onSelect: (state: StateCode) => void
  loading?: boolean
}

interface StateWithData {
  code: StateCode
  name: string
  region: string
  capital: string
  hasData?: boolean
  stationCount?: number
}

export default function StateSelector({ selectedState, onSelect, loading }: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [statesData, setStatesData] = useState<Record<string, { hasData: boolean; stationCount: number }>>({})
  const [checkingStates, setCheckingStates] = useState(false)

  // Verificar quais estados têm dados ao abrir o dropdown
  useEffect(() => {
    if (isOpen && Object.keys(statesData).length === 0) {
      checkAllStates()
    }
  }, [isOpen])

  const checkAllStates = async () => {
    setCheckingStates(true)
    const results: Record<string, { hasData: boolean; stationCount: number }> = {}

    // Verificar estados em paralelo (em batches para não sobrecarregar)
    const stateCodes = Object.keys(BRAZILIAN_STATES) as StateCode[]
    const batchSize = 5

    for (let i = 0; i < stateCodes.length; i += batchSize) {
      const batch = stateCodes.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (code) => {
          try {
            const response = await fetch(`/api/weather?checkState=${code}`)
            const data = await response.json()
            return { code, hasData: data.hasData, stationCount: data.stationCount }
          } catch {
            return { code, hasData: false, stationCount: 0 }
          }
        })
      )

      for (const result of batchResults) {
        results[result.code] = { hasData: result.hasData, stationCount: result.stationCount }
      }

      // Atualizar parcialmente para feedback visual
      setStatesData(prev => ({ ...prev, ...results }))
    }

    setCheckingStates(false)
  }

  const statesList = useMemo(() => {
    return Object.entries(BRAZILIAN_STATES)
      .map(([stateCode, info]) => ({
        code: stateCode as StateCode,
        name: info.name,
        region: info.region,
        capital: info.capital,
        hasData: statesData[stateCode]?.hasData,
        stationCount: statesData[stateCode]?.stationCount
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [statesData])

  const filteredStates = useMemo(() => {
    if (!search) return statesList
    const searchLower = search.toLowerCase()
    return statesList.filter(
      s => s.name.toLowerCase().includes(searchLower) ||
           s.code.toLowerCase().includes(searchLower) ||
           s.capital.toLowerCase().includes(searchLower)
    )
  }, [statesList, search])

  const groupedByRegion = useMemo(() => {
    const groups: Record<string, typeof filteredStates> = {}
    for (const state of filteredStates) {
      if (!groups[state.region]) {
        groups[state.region] = []
      }
      groups[state.region].push(state)
    }
    return groups
  }, [filteredStates])

  const regionOrder = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
  const selectedInfo = BRAZILIAN_STATES[selectedState]
  const selectedData = statesData[selectedState]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
      >
        <MapPin className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-gray-900">{selectedInfo.name}</span>
        <span className="text-gray-500 text-sm">({selectedState})</span>
        {loading ? (
          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-[70vh] overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estado..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
              {checkingStates && (
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Verificando disponibilidade de dados...
                </div>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[calc(70vh-80px)]">
              {regionOrder.map(region => {
                const states = groupedByRegion[region]
                if (!states || states.length === 0) return null

                return (
                  <div key={region}>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                      {region}
                    </div>
                    {states.map(state => {
                      const hasDataInfo = statesData[state.code]
                      const isDisabled = hasDataInfo && !hasDataInfo.hasData

                      return (
                        <button
                          key={state.code}
                          onClick={() => {
                            if (!isDisabled) {
                              onSelect(state.code)
                              setIsOpen(false)
                              setSearch('')
                            }
                          }}
                          disabled={isDisabled}
                          className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors ${
                            state.code === selectedState ? 'bg-blue-50' : ''
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-blue-50'}`}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className={`w-4 h-4 ${
                              isDisabled ? 'text-gray-300' :
                              state.code === selectedState ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                            <div className="text-left">
                              <span className={`font-medium ${
                                isDisabled ? 'text-gray-400' :
                                state.code === selectedState ? 'text-blue-600' : 'text-gray-900'
                              }`}>
                                {state.name}
                              </span>
                              <span className="text-xs text-gray-400 ml-2">
                                Capital: {state.capital}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasDataInfo ? (
                              hasDataInfo.hasData ? (
                                <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                                  {hasDataInfo.stationCount} estações
                                </span>
                              ) : (
                                <span className="text-xs text-red-500 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  Sem dados
                                </span>
                              )
                            ) : checkingStates ? (
                              <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                            ) : null}
                            <span className="text-sm text-gray-500">{state.code}</span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {filteredStates.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nenhum estado encontrado
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
