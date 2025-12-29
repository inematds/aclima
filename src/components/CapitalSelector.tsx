'use client'

import { useState, useMemo } from 'react'
import { MapPin, ChevronDown, Search } from 'lucide-react'
import { BRAZILIAN_CAPITALS, type CapitalSlug } from '@/types/weather'

interface CapitalSelectorProps {
  selectedCapital: CapitalSlug
  onSelect: (capital: CapitalSlug) => void
}

export default function CapitalSelector({ selectedCapital, onSelect }: CapitalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const capitalsList = useMemo(() => {
    return Object.entries(BRAZILIAN_CAPITALS)
      .map(([slug, info]) => ({
        slug: slug as CapitalSlug,
        ...info
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [])

  const filteredCapitals = useMemo(() => {
    if (!search) return capitalsList
    const searchLower = search.toLowerCase()
    return capitalsList.filter(
      c => c.name.toLowerCase().includes(searchLower) ||
           c.state.toLowerCase().includes(searchLower) ||
           c.stateCode.toLowerCase().includes(searchLower)
    )
  }, [capitalsList, search])

  const groupedByRegion = useMemo(() => {
    const groups: Record<string, typeof filteredCapitals> = {}
    for (const capital of filteredCapitals) {
      if (!groups[capital.region]) {
        groups[capital.region] = []
      }
      groups[capital.region].push(capital)
    }
    return groups
  }, [filteredCapitals])

  const regionOrder = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']
  const selectedInfo = BRAZILIAN_CAPITALS[selectedCapital]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors shadow-sm"
      >
        <MapPin className="w-5 h-5 text-blue-600" />
        <span className="font-medium text-gray-900">{selectedInfo.name}</span>
        <span className="text-gray-500 text-sm">({selectedInfo.stateCode})</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[1001]"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-[1002] max-h-[70vh] overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar capital..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto max-h-[calc(70vh-60px)]">
              {regionOrder.map(region => {
                const capitals = groupedByRegion[region]
                if (!capitals || capitals.length === 0) return null

                return (
                  <div key={region}>
                    <div className="px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider sticky top-0">
                      {region}
                    </div>
                    {capitals.map(capital => (
                      <button
                        key={capital.slug}
                        onClick={() => {
                          onSelect(capital.slug)
                          setIsOpen(false)
                          setSearch('')
                        }}
                        className={`w-full px-4 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors ${
                          capital.slug === selectedCapital ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${capital.slug === selectedCapital ? 'text-blue-600' : 'text-gray-400'}`} />
                          <span className={`font-medium ${capital.slug === selectedCapital ? 'text-blue-600' : 'text-gray-900'}`}>
                            {capital.name}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{capital.stateCode}</span>
                      </button>
                    ))}
                  </div>
                )
              })}

              {filteredCapitals.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  Nenhuma capital encontrada
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
