# AClima - Documento de Arquitetura

## 1. Visão Geral da Arquitetura

### 1.1 Diagrama de Alto Nível

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FONTES DE DADOS                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │  INMET   │  │  CEMADEN │  │ Sensores │  │  Outros  │                │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘                │
└───────┼─────────────┼─────────────┼─────────────┼───────────────────────┘
        │             │             │             │
        └─────────────┴──────┬──────┴─────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE INGESTÃO                              │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                    Data Ingestion Service                       │    │
│  │  • Coleta periódica de APIs                                     │    │
│  │  • Normalização de formatos                                     │    │
│  │  • Validação de dados                                           │    │
│  └─────────────────────────────┬──────────────────────────────────┘    │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE DADOS                                 │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  PostgreSQL  │    │    Redis     │    │   Storage    │              │
│  │  (histórico) │    │   (cache)    │    │  (arquivos)  │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
└─────────────────────────────┬───────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE API                                   │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                     API Server (Next.js)                        │    │
│  │  • REST endpoints                                               │    │
│  │  • WebSocket/SSE para tempo real                               │    │
│  │  • Autenticação                                                 │    │
│  └─────────────────────────────┬──────────────────────────────────┘    │
└────────────────────────────────┼────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAMADA DE APRESENTAÇÃO                          │
│  ┌────────────────────────────────────────────────────────────────┐    │
│  │                   Next.js Frontend (Vercel)                     │    │
│  │  • Dashboard de Situação                                        │    │
│  │  • Painel de Alertas                                            │    │
│  │  • Painel de Estações                                           │    │
│  └────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Stack Tecnológica

### 2.1 Frontend

| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **Next.js** | 14.x | Framework React com SSR, API routes, otimizado para Vercel |
| **React** | 18.x | Biblioteca UI com hooks e concurrent features |
| **TypeScript** | 5.x | Tipagem estática para segurança e DX |
| **Tailwind CSS** | 3.x | Utility-first CSS, rápido desenvolvimento |
| **Lucide React** | 0.x | Ícones consistentes e leves |

### 2.2 Backend (Fase 2)

| Tecnologia | Versão | Justificativa |
|------------|--------|---------------|
| **Next.js API Routes** | 14.x | Serverless functions integradas |
| **PostgreSQL** | 15.x | Banco relacional robusto para dados históricos |
| **Redis** | 7.x | Cache de dados em tempo real |

### 2.3 Infraestrutura

| Serviço | Uso |
|---------|-----|
| **Vercel** | Hosting frontend + API routes |
| **GitHub** | Versionamento de código |
| **Supabase/Neon** (futuro) | PostgreSQL gerenciado |
| **Upstash** (futuro) | Redis serverless |

## 3. Estrutura do Projeto

```
aclima/
├── .bmad-core/              # BMad Method core files
├── .claude/                 # Claude Code configuration
├── docs/                    # Documentação do projeto
│   ├── prd.md              # Product Requirements Document
│   ├── architecture.md     # Este documento
│   ├── prd/                # PRD shards (se necessário)
│   ├── architecture/       # Architecture shards
│   └── stories/            # User stories
├── public/                  # Assets estáticos
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── layout.tsx      # Layout principal
│   │   ├── page.tsx        # Dashboard principal
│   │   ├── alertas/        # Painel de alertas
│   │   ├── estacoes/       # Painel de estações
│   │   └── api/            # API routes (futuro)
│   ├── components/         # Componentes React
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   ├── StatusCard.tsx
│   │   ├── AlertsList.tsx
│   │   ├── RainChart.tsx
│   │   └── RegionsList.tsx
│   ├── lib/                # Utilitários e helpers
│   ├── types/              # Definições TypeScript
│   └── hooks/              # Custom React hooks
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── next.config.js
```

## 4. Padrões de Código

### 4.1 Nomenclatura

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `StatusCard.tsx` |
| Hooks | camelCase com "use" | `useWeatherData.ts` |
| Utilitários | camelCase | `formatDate.ts` |
| Tipos | PascalCase | `type AlertLevel` |
| Constantes | SCREAMING_SNAKE | `MAX_ALERTS` |

### 4.2 Estrutura de Componentes

```tsx
// Imports
import { useState } from 'react'
import { Icon } from 'lucide-react'

// Types
interface ComponentProps {
  prop: string
}

// Component
export default function Component({ prop }: ComponentProps) {
  // Hooks
  const [state, setState] = useState()

  // Handlers
  const handleClick = () => {}

  // Render
  return (
    <div>...</div>
  )
}
```

### 4.3 Cores de Status

```ts
const STATUS_COLORS = {
  normal: {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-700'
  },
  attention: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700'
  },
  alert: {
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    text: 'text-orange-700'
  },
  severe: {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-700'
  }
}
```

## 5. Fluxo de Dados

### 5.1 MVP (Dados Mockados)

```
Componente → Dados hardcoded → Renderização
```

### 5.2 Produção (Futuro)

```
Fontes Externas → Ingestion Service → Redis (cache) → API Route → Frontend
                                   ↓
                              PostgreSQL (histórico)
```

### 5.3 Tempo Real

```
Backend → WebSocket/SSE → React State → UI Update
```

## 6. APIs (Fase 2)

### 6.1 Endpoints Planejados

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/weather/current` | Dados atuais de todas regiões |
| GET | `/api/weather/region/:id` | Dados de região específica |
| GET | `/api/alerts` | Lista de alertas ativos |
| GET | `/api/stations` | Status das estações |
| GET | `/api/history/:region` | Histórico de precipitação |

### 6.2 Formato de Resposta

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2024-12-28T12:00:00Z",
    "source": "inmet",
    "cached": true
  }
}
```

## 7. Modelo de Dados

### 7.1 Região

```typescript
interface Region {
  id: string
  name: string
  coordinates: {
    lat: number
    lng: number
  }
  currentRain: number    // mm/h
  rain1h: number         // mm acumulado última hora
  rain24h: number        // mm acumulado 24h
  status: 'normal' | 'attention' | 'alert' | 'severe'
  lastUpdate: Date
}
```

### 7.2 Alerta

```typescript
interface Alert {
  id: string
  regionId: string
  level: 'attention' | 'alert' | 'severe'
  type: string
  message: string
  startTime: Date
  endTime?: Date
  active: boolean
}
```

### 7.3 Estação

```typescript
interface Station {
  id: string
  name: string
  location: string
  coordinates: {
    lat: number
    lng: number
  }
  status: 'online' | 'offline' | 'delayed'
  sensors: {
    rain: number
    temperature: number
    humidity: number
  }
  lastUpdate: Date
}
```

## 8. Segurança

### 8.1 Frontend
- CSP headers configurados
- Sanitização de inputs
- HTTPS obrigatório

### 8.2 API (Fase 2)
- Rate limiting
- Autenticação JWT para rotas protegidas
- Validação de entrada com Zod

### 8.3 Dados
- Sem dados pessoais no MVP
- LGPD compliance planejado para sistema de notificações

## 9. Deploy

### 9.1 Vercel

1. Conectar repositório GitHub
2. Build automático em push para `main`
3. Preview deploys para branches

### 9.2 Variáveis de Ambiente

```env
# Futuro
DATABASE_URL=
REDIS_URL=
NEXT_PUBLIC_MAP_API_KEY=
```

## 10. Monitoramento (Futuro)

- Vercel Analytics (performance)
- Sentry (erros)
- Uptime Robot (disponibilidade)

---

*Documento criado em: 2024-12-28*
*Versão: 1.0*
