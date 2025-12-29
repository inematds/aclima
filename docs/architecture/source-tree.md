# AClima - Estrutura de Diretórios

```
aclima/
├── .bmad-core/                 # BMad Method (não modificar)
│   ├── agents/                 # Definições de agentes
│   ├── tasks/                  # Templates de tarefas
│   ├── templates/              # Templates de documentos
│   └── core-config.yaml        # Configuração BMad
│
├── .claude/                    # Claude Code config
│   └── commands/               # Comandos customizados
│
├── docs/                       # Documentação do projeto
│   ├── prd.md                  # Product Requirements Document
│   ├── architecture.md         # Documento de arquitetura
│   ├── prd/                    # PRD shards (épicos)
│   ├── architecture/           # Architecture shards
│   │   ├── coding-standards.md # Padrões de código
│   │   ├── tech-stack.md       # Stack tecnológica
│   │   └── source-tree.md      # Este arquivo
│   └── stories/                # User stories
│
├── doc/                        # Documentação original
│   └── PROJETO_*.md            # Specs do projeto
│
├── ref/                        # Referências
│   └── PAINEL_*.md             # Especificações dos painéis
│
├── public/                     # Assets estáticos
│   └── (imagens, favicon, etc)
│
├── src/                        # Código fonte
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Layout raiz
│   │   ├── page.tsx            # Página inicial (Dashboard)
│   │   ├── globals.css         # Estilos globais
│   │   ├── alertas/            # Rota /alertas
│   │   │   └── page.tsx        # Painel de alertas
│   │   ├── estacoes/           # Rota /estacoes
│   │   │   └── page.tsx        # Painel de estações
│   │   └── api/                # API Routes (futuro)
│   │       └── weather/
│   │
│   ├── components/             # Componentes React
│   │   ├── Header.tsx          # Cabeçalho
│   │   ├── Sidebar.tsx         # Menu lateral
│   │   ├── StatusCard.tsx      # Card de status
│   │   ├── AlertsList.tsx      # Lista de alertas
│   │   ├── RainChart.tsx       # Gráfico de chuva
│   │   └── RegionsList.tsx     # Lista de regiões
│   │
│   ├── lib/                    # Utilitários
│   │   └── utils.ts            # Funções auxiliares
│   │
│   ├── types/                  # Definições TypeScript
│   │   └── index.ts            # Tipos do projeto
│   │
│   └── hooks/                  # Custom hooks
│       └── useWeather.ts       # Hook de dados (futuro)
│
├── .gitignore                  # Arquivos ignorados pelo Git
├── next.config.js              # Configuração Next.js
├── package.json                # Dependências
├── postcss.config.js           # Configuração PostCSS
├── tailwind.config.js          # Configuração Tailwind
└── tsconfig.json               # Configuração TypeScript
```

## Convenções

### Pastas
- `app/` - Rotas e páginas (Next.js App Router)
- `components/` - Componentes reutilizáveis
- `lib/` - Código utilitário não-React
- `types/` - Tipos TypeScript compartilhados
- `hooks/` - Custom React hooks

### Arquivos
- Componentes: `PascalCase.tsx`
- Utilitários: `camelCase.ts`
- Páginas: `page.tsx` (dentro de pasta da rota)
- Layouts: `layout.tsx`

### Rotas

| Rota | Arquivo | Descrição |
|------|---------|-----------|
| `/` | `app/page.tsx` | Dashboard principal |
| `/alertas` | `app/alertas/page.tsx` | Painel de alertas |
| `/estacoes` | `app/estacoes/page.tsx` | Painel de estações |
| `/historico` | `app/historico/page.tsx` | Histórico (futuro) |
| `/configuracoes` | `app/configuracoes/page.tsx` | Config (futuro) |
