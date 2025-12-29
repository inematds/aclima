'use client'

import { useState, useMemo } from 'react'
import { MapPin, ChevronDown, Search, Loader2 } from 'lucide-react'
import { BRAZILIAN_STATES, type StateCode } from '@/types/weather'

interface StateSelectorProps {
  selectedState: StateCode
  onSelect: (state: StateCode) => void
  loading?: boolean
}

export default function StateSelector({ selectedState, onSelect, loading }: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const statesList = useMemo(() => {
    return Object.entries(BRAZILIAN_STATES)
      .map(([stateCode, info]) => ({
        code: stateCode as StateCode,
        name: info.name,
        region: info.region,
        capital: info.capital
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [])

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
            className="fixed inset-0 z-[1001]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-[1002] max-h-[70vh] overflow-hidden">
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
                    {states.map(state => (
                      <button
                        key={state.code}
                        onClick={() => {
                          onSelect(state.code)
                          setIsOpen(false)
                          setSearch('')
                        }}
                        className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors hover:bg-blue-50 ${
                          state.code === selectedState ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${
                            state.code === selectedState ? 'text-blue-600' : 'text-gray-400'
                          }`} />
                          <div className="text-left">
                            <span className={`font-medium ${
                              state.code === selectedState ? 'text-blue-600' : 'text-gray-900'
                            }`}>
                              {state.name}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              Capital: {state.capital}
                            </span>
                          </div>
                        </div>
                        <span className="text-sm text-gray-500">{state.code}</span>
                      </button>
                    ))}
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
