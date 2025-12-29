'use client'

import { Bell, MapPin, User } from 'lucide-react'

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      {/* Localização */}
      <div className="flex items-center gap-2 text-gray-600">
        <MapPin size={18} />
        <span className="font-medium">Região Metropolitana</span>
        <button className="text-blue-600 text-sm hover:underline">
          Alterar
        </button>
      </div>

      {/* Ações */}
      <div className="flex items-center gap-4">
        {/* Notificações */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <Bell size={20} />
          <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Usuário */}
        <button className="flex items-center gap-2 p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
          <User size={20} />
          <span className="font-medium">Operador</span>
        </button>
      </div>
    </header>
  )
}
