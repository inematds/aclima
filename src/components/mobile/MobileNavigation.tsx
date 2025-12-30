'use client'

import { Home, Map, AlertTriangle, Radio, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  icon: typeof Home
  label: string
  href: string
}

const navItems: NavItem[] = [
  { icon: Home, label: 'Início', href: '/' },
  { icon: Map, label: 'Mapa', href: '/estacoes' },
  { icon: AlertTriangle, label: 'Alertas', href: '/alertas' },
  { icon: Radio, label: 'Radar', href: '/historico' },
]

export default function MobileNavigation() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[2000] safe-area-bottom">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive
                    ? 'text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
                <span className={`text-[10px] mt-1 ${isActive ? 'font-semibold' : ''}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}

          {/* More menu button */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 hover:text-gray-700"
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] mt-1">Mais</span>
          </button>
        </div>
      </nav>

      {/* Slide-up Menu */}
      {menuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-[2001]"
            onClick={() => setMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl z-[2002] animate-slide-up safe-area-bottom">
            <div className="p-4">
              {/* Handle */}
              <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4" />

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Menu</h3>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="space-y-2">
                <Link
                  href="/estado-painel1"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Map className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Painel Estado 1</div>
                    <div className="text-sm text-gray-500">Visão detalhada</div>
                  </div>
                </Link>

                <Link
                  href="/estado-painel2"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <Map className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Painel Estado 2</div>
                    <div className="text-sm text-gray-500">Layout alternativo</div>
                  </div>
                </Link>

                <Link
                  href="/estado-painel3"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <Map className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Painel Estado 3</div>
                    <div className="text-sm text-gray-500">Compacto</div>
                  </div>
                </Link>
              </div>

              {/* App Info */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="text-center text-sm text-gray-500">
                  ACLIMA v1.0
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* CSS for animation */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </>
  )
}
