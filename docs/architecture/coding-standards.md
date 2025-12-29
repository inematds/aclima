# AClima - Padrões de Código

## 1. Geral

### 1.1 Linguagem
- **TypeScript** obrigatório para todo código
- Strict mode habilitado
- Sem uso de `any` (usar `unknown` se necessário)

### 1.2 Formatação
- Indentação: 2 espaços
- Aspas simples para strings
- Ponto e vírgula opcional (consistente no projeto)
- Linha máxima: 100 caracteres

## 2. React/Next.js

### 2.1 Componentes

```tsx
// ✅ Correto - Function component com TypeScript
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
}

export default function Button({ label, onClick, variant = 'primary' }: ButtonProps) {
  return (
    <button onClick={onClick} className={styles[variant]}>
      {label}
    </button>
  )
}

// ❌ Evitar - Class components
class Button extends React.Component { ... }
```

### 2.2 Hooks

```tsx
// ✅ Correto - Hooks no topo do componente
function Component() {
  const [state, setState] = useState()
  const data = useSWR('/api/data')

  useEffect(() => {
    // efeito
  }, [dependency])

  return <div>...</div>
}

// ❌ Evitar - Hooks condicionais
function Component({ show }) {
  if (show) {
    const [state, setState] = useState() // ERRO!
  }
}
```

### 2.3 Nomenclatura de Arquivos

| Tipo | Padrão | Exemplo |
|------|--------|---------|
| Componentes | PascalCase | `StatusCard.tsx` |
| Páginas | kebab-case (pasta) | `app/alertas/page.tsx` |
| Hooks | camelCase | `useWeatherData.ts` |
| Utilitários | camelCase | `formatDate.ts` |
| Tipos | camelCase | `types/weather.ts` |

## 3. Tailwind CSS

### 3.1 Ordem das Classes

```tsx
// ✅ Correto - Ordem lógica
<div className="
  flex items-center justify-between    // Layout
  w-full h-16                          // Dimensões
  p-4 mx-2                             // Espaçamento
  bg-white border border-gray-200      // Visual
  rounded-lg shadow-sm                 // Decoração
  hover:bg-gray-50                     // Estados
  transition-colors                    // Animação
">

// ❌ Evitar - Classes desorganizadas
<div className="hover:bg-gray-50 p-4 flex shadow-sm w-full border">
```

### 3.2 Cores de Status

Usar sempre as variáveis definidas no projeto:

```tsx
// ✅ Correto
const statusColors = {
  normal: 'bg-green-100 text-green-700 border-green-500',
  attention: 'bg-yellow-100 text-yellow-700 border-yellow-500',
  alert: 'bg-orange-100 text-orange-700 border-orange-500',
  severe: 'bg-red-100 text-red-700 border-red-500',
}

// ❌ Evitar - Cores hardcoded inconsistentes
<div className="bg-[#22c55e]">
```

## 4. TypeScript

### 4.1 Tipos vs Interfaces

```tsx
// ✅ Interface para objetos extensíveis
interface User {
  id: string
  name: string
}

interface Admin extends User {
  role: 'admin'
}

// ✅ Type para unions e tipos complexos
type Status = 'normal' | 'attention' | 'alert' | 'severe'
type Handler = (event: MouseEvent) => void
```

### 4.2 Evitar

```tsx
// ❌ Evitar `any`
function processData(data: any) { ... }

// ✅ Preferir tipos específicos ou `unknown`
function processData(data: unknown) {
  if (isValidData(data)) {
    // usar data tipado
  }
}
```

## 5. Imports

### 5.1 Ordem

```tsx
// 1. React e Next.js
import { useState, useEffect } from 'react'
import Link from 'next/link'

// 2. Bibliotecas externas
import { AlertTriangle } from 'lucide-react'

// 3. Componentes internos
import StatusCard from '@/components/StatusCard'

// 4. Utilitários e tipos
import { formatDate } from '@/lib/utils'
import type { Alert } from '@/types'

// 5. Estilos (se não usar Tailwind)
import styles from './Component.module.css'
```

## 6. Commits

### 6.1 Formato

```
tipo(escopo): descrição curta

Corpo opcional com mais detalhes.

Refs: #issue
```

### 6.2 Tipos

| Tipo | Uso |
|------|-----|
| `feat` | Nova funcionalidade |
| `fix` | Correção de bug |
| `docs` | Documentação |
| `style` | Formatação (sem mudança de lógica) |
| `refactor` | Refatoração |
| `test` | Testes |
| `chore` | Manutenção |

### 6.3 Exemplos

```
feat(dashboard): adiciona cards de status meteorológico
fix(alertas): corrige ordenação por data
docs(readme): atualiza instruções de instalação
```

## 7. Testes (Futuro)

### 7.1 Nomenclatura

```tsx
// arquivo: StatusCard.test.tsx

describe('StatusCard', () => {
  it('should render the title', () => { ... })
  it('should show correct status color', () => { ... })
  it('should display trend icon when provided', () => { ... })
})
```

### 7.2 Estrutura

```
src/
├── components/
│   ├── StatusCard.tsx
│   └── StatusCard.test.tsx  // teste junto do componente
```
