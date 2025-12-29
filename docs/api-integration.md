# AClima - Integração com APIs

## Visão Geral

Este documento descreve a integração do AClima com as APIs de dados meteorológicos do INMET (Instituto Nacional de Meteorologia).

**Data:** 2024-12-28
**Status:** Implementado e em produção
**URL:** https://aclima.vercel.app

---

## APIs Configuradas

| Endpoint | Fonte | Atualização | Descrição |
|----------|-------|-------------|-----------|
| `/api/weather` | INMET | 5 min | Dados das estações automáticas |
| `/api/alerts` | INMET + Calculado | 10 min | Alertas meteorológicos |
| `/api/stations` | INMET | 1 hora | Lista de estações disponíveis |

### API de Dados Meteorológicos (`/api/weather`)

**Endpoint INMET utilizado:**
```
https://apitempo.inmet.gov.br/estacao/{data_inicio}/{data_fim}/{codigo_estacao}
```

**Dados retornados:**
- Precipitação (atual, 30min, 1h, 24h)
- Temperatura (atual, mín, máx)
- Umidade (atual, mín, máx)
- Vento (velocidade, direção, rajada)
- Pressão atmosférica
- Status da estação (online, delayed, offline)
- Nível de alerta calculado

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "stationId": "A701",
      "stationName": "São Paulo - Mirante de Santana",
      "state": "SP",
      "coordinates": { "lat": -23.5, "lng": -46.6 },
      "timestamp": "2024-12-28T15:00:00Z",
      "rain": {
        "current": 2.4,
        "last30min": 4.5,
        "last1h": 8.2,
        "last24h": 32.5
      },
      "temperature": { "current": 24.5, "min": 19.2, "max": 28.4 },
      "humidity": { "current": 85, "min": 62, "max": 92 },
      "wind": { "speed": 12.5, "direction": 180, "gust": 25.8 },
      "pressure": 1013.2,
      "status": "online",
      "alertLevel": "attention"
    }
  ],
  "timestamp": "2024-12-28T15:30:00Z"
}
```

### API de Alertas (`/api/alerts`)

**Fontes de dados:**
1. Endpoint de avisos do INMET (quando disponível)
2. Cálculo automático baseado nos limiares de precipitação

**Exemplo de resposta:**
```json
{
  "success": true,
  "data": [
    {
      "id": "gen-A701",
      "region": "São Paulo - Mirante de Santana",
      "level": "attention",
      "type": "rain",
      "message": "Chuva moderada: 12mm na última hora. Monitorando.",
      "startTime": "2024-12-28T14:00:00Z",
      "source": "AClima (calculado)",
      "rain1h": 12.0,
      "rain24h": 35.5
    }
  ],
  "summary": {
    "severe": 0,
    "alert": 1,
    "attention": 2
  }
}
```

### API de Estações (`/api/stations`)

Lista todas as estações automáticas do INMET nos estados monitorados (SP, RJ, MG, PR, SC, RS).

---

## Estações Monitoradas

### Configuração Atual

| Código | Estação | Cidade | Zona |
|--------|---------|--------|------|
| A701 | Mirante de Santana | São Paulo | Centro |
| A713 | Interlagos | São Paulo | Zona Sul |
| A728 | Santo André | Santo André | ABC |
| A736 | Guarulhos | Guarulhos | Norte |
| A755 | Osasco | Osasco | Oeste |
| A711 | Campinas | Campinas | Interior |
| A714 | Santos | Santos | Litoral |
| A652 | Forte de Copacabana | Rio de Janeiro | RJ Zona Sul |
| A621 | Vila Militar | Rio de Janeiro | RJ Zona Oeste |

### Como Adicionar Novas Estações

Edite o arquivo `src/types/weather.ts`:

```typescript
export const MONITORED_STATIONS = {
  'A701': { name: 'São Paulo - Mirante de Santana', city: 'São Paulo', zone: 'Centro' },
  'A713': { name: 'São Paulo - Interlagos', city: 'São Paulo', zone: 'Zona Sul' },
  // Adicione novas estações aqui:
  'XXXX': { name: 'Nome da Estação', city: 'Cidade', zone: 'Região' },
}
```

Para encontrar códigos de estações, consulte:
- https://portal.inmet.gov.br/paginas/catalogoaut

---

## Regras de Alertas

### Limiares de Precipitação

| Condição | Nível | Cor | Ação |
|----------|-------|-----|------|
| < 10mm/1h | Normal | Verde | Monitoramento padrão |
| ≥ 10mm/1h | Atenção | Amarelo | Alerta interno |
| ≥ 20mm/1h | Alerta | Laranja | Notificação |
| ≥ 30mm/1h ou ≥ 50mm/24h | Severo | Vermelho | Ação imediata |

### Implementação

```typescript
function calculateAlertLevel(rain1h: number, rain24h: number) {
  if (rain24h >= 50 || rain1h >= 30) return 'severe'
  if (rain1h >= 20) return 'alert'
  if (rain1h >= 10) return 'attention'
  return 'normal'
}
```

---

## Arquivos do Sistema

### Estrutura de Arquivos

```
src/
├── app/api/
│   ├── weather/route.ts   # API de dados meteorológicos
│   ├── alerts/route.ts    # API de alertas
│   └── stations/route.ts  # API de estações
├── components/
│   └── WeatherDashboard.tsx  # Dashboard com dados reais
├── hooks/
│   └── useWeather.ts      # Hooks com auto-refresh
└── types/
    └── weather.ts         # Tipos TypeScript e configuração de estações
```

### Hooks Disponíveis

```typescript
// Buscar dados meteorológicos (atualiza a cada 5 min)
const { data, loading, error, refetch } = useWeather()

// Buscar alertas (atualiza a cada 10 min)
const { data, summary, refetch } = useAlerts()

// Listar estações disponíveis
const { data, loading } = useStations()
```

---

## Cache e Performance

### Estratégia de Cache

| Endpoint | Cache TTL | Tipo |
|----------|-----------|------|
| `/api/weather` | 5 minutos | Em memória |
| `/api/alerts` | 10 minutos | Em memória |
| `/api/stations` | 1 hora | Em memória |

### Fallback

- Se a API do INMET falhar, o sistema retorna dados do cache (mesmo que antigos)
- Dados em cache antigo são marcados como `stale: true`
- O frontend mostra indicador de "dados atrasados" quando necessário

---

## Fontes de Dados

### INMET (Instituto Nacional de Meteorologia)

- **Site:** https://portal.inmet.gov.br
- **API Tempo:** https://apitempo.inmet.gov.br
- **API Previsão:** https://apiprevmet3.inmet.gov.br
- **Catálogo de Estações:** https://portal.inmet.gov.br/paginas/catalogoaut

### CEMADEN (Centro Nacional de Monitoramento e Alertas de Desastres Naturais)

- **Site:** https://www.gov.br/cemaden/pt-br
- **Mapa Interativo:** https://mapainterativo.cemaden.gov.br
- **Observação:** CEMADEN não possui API pública documentada. Dados disponíveis via download manual no Mapa Interativo.

---

## Limitações Conhecidas

1. **API INMET:**
   - Limite de consulta: máximo 6 meses por requisição
   - Dados em UTC (necessário converter para horário de Brasília: -3h)
   - Valores "9999", "Null" ou vazios indicam falha no sensor

2. **CEMADEN:**
   - Sem API pública disponível
   - Dados disponíveis apenas via download manual

3. **Alertas:**
   - Endpoint de avisos ativos do INMET pode não estar sempre disponível
   - Sistema gera alertas calculados como fallback

---

## Próximos Passos

- [ ] Integrar com mais fontes de dados (radares, satélite)
- [ ] Implementar WebSocket para atualizações em tempo real
- [ ] Adicionar persistência em banco de dados (histórico)
- [ ] Implementar sistema de notificações (WhatsApp, Telegram)
- [ ] Adicionar mapa interativo com Leaflet

---

*Documento gerado em: 2024-12-28*
*Versão: 1.0*
