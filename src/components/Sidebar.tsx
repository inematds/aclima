'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CloudRain,
  AlertTriangle,
  Radio,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Map,
  ExternalLink
} from 'lucide-react'

const menuItems = [
  {
    name: 'Situação Atual',
    href: '/',
    icon: CloudRain,
    description: 'Visão geral meteorológica'
  },
  {
    name: 'Alertas',
    href: '/alertas',
    icon: AlertTriangle,
    description: 'Alertas hidrológicos e risco'
  },
  {
    name: 'Estações',
    href: '/estacoes',
    icon: Radio,
    description: 'Dados das estações'
  },
  {
    name: 'Histórico',
    href: '/historico',
    icon: BarChart3,
    description: 'Dados históricos'
  },
]

const panelItems = [
  {
    name: 'Painel 1',
    href: '/painel1',
    icon: LayoutDashboard,
    description: 'Situação Meteorológica'
  },
  {
    name: 'Painel 2',
    href: '/painel2',
    icon: LayoutDashboard,
    description: 'Alertas Hidrológicos'
  },
  {
    name: 'Painel 3',
    href: '/painel3',
    icon: LayoutDashboard,
    description: 'Estação Climática'
  },
]

const externalLinks = [
  {
    name: 'Mapa INMET',
    href: 'https://mapas.inmet.gov.br/',
    icon: Map,
    description: 'Mapa interativo do INMET'
  },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <aside
      className={`
        bg-slate-900 text-white flex flex-col transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <CloudRain className="h-8 w-8 text-blue-400" />
            <span className="font-bold text-xl">AClima</span>
          </div>
        )}
        {collapsed && <CloudRain className="h-8 w-8 text-blue-400 mx-auto" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-slate-700 rounded"
        >
          {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 py-4 overflow-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} />
                  {!collapsed && (
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Seção de Painéis para Comparação */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Painéis (Specs)
            </p>
          </div>
        )}
        <ul className="space-y-1 px-2">
          {panelItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} />
                  {!collapsed && (
                    <div>
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">{item.description}</div>
                    </div>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>

        {/* Links Externos */}
        {!collapsed && (
          <div className="mt-4 pt-4 border-t border-slate-700">
            <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Links Externos
            </p>
          </div>
        )}
        <ul className="space-y-1 px-2">
          {externalLinks.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-slate-300 hover:bg-slate-800 hover:text-white"
                title={collapsed ? item.name : undefined}
              >
                <item.icon size={20} />
                {!collapsed && (
                  <div className="flex-1">
                    <div className="font-medium flex items-center gap-1">
                      {item.name}
                      <ExternalLink size={12} className="text-slate-500" />
                    </div>
                    <div className="text-xs text-slate-400">{item.description}</div>
                  </div>
                )}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Configurações */}
      <div className="p-2 border-t border-slate-700">
        <Link
          href="/configuracoes"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          title={collapsed ? 'Configurações' : undefined}
        >
          <Settings size={20} />
          {!collapsed && <span>Configurações</span>}
        </Link>
      </div>
    </aside>
  )
}
