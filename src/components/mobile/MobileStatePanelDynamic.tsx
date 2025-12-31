'use client'

import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

const MobileStatePanel = dynamic(() => import('./MobileStatePanel'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Carregando painel...</p>
      </div>
    </div>
  )
})

export default function MobileStatePanelDynamic() {
  return <MobileStatePanel />
}
