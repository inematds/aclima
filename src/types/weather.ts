// Tipos para dados do INMET

export interface INMETStation {
  CD_ESTACAO: string      // Código da estação (ex: "A701")
  DC_NOME: string         // Nome da estação
  SG_ESTADO: string       // Estado (ex: "SP")
  VL_LATITUDE: number     // Latitude
  VL_LONGITUDE: number    // Longitude
  VL_ALTITUDE: number     // Altitude
  DT_INICIO_OPERACAO: string // Data início operação
  TP_ESTACAO: string      // Tipo (Automática/Convencional)
}

export interface INMETObservation {
  CD_ESTACAO: string      // Código da estação
  DT_MEDICAO: string      // Data da medição (YYYY-MM-DD)
  HR_MEDICAO: string      // Hora da medição (HH:MM UTC)
  DC_NOME: string         // Nome da estação
  UF: string              // Estado

  // Temperatura
  TEM_INS: number | null  // Temperatura instantânea (°C)
  TEM_MAX: number | null  // Temperatura máxima (°C)
  TEM_MIN: number | null  // Temperatura mínima (°C)

  // Umidade
  UMD_INS: number | null  // Umidade instantânea (%)
  UMD_MAX: number | null  // Umidade máxima (%)
  UMD_MIN: number | null  // Umidade mínima (%)

  // Precipitação
  CHUVA: number | null    // Precipitação (mm)

  // Vento
  VEN_DIR: number | null  // Direção do vento (graus)
  VEN_VEL: number | null  // Velocidade do vento (m/s)
  VEN_RAJ: number | null  // Rajada máxima (m/s)

  // Pressão
  PRE_INS: number | null  // Pressão instantânea (hPa)
  PRE_MAX: number | null  // Pressão máxima (hPa)
  PRE_MIN: number | null  // Pressão mínima (hPa)

  // Radiação
  RAD_GLO: number | null  // Radiação global (Kj/m²)

  // Ponto de orvalho
  PTO_INS: number | null  // Ponto de orvalho instantâneo (°C)
  PTO_MAX: number | null  // Ponto de orvalho máximo (°C)
  PTO_MIN: number | null  // Ponto de orvalho mínimo (°C)
}

// Alertas do INMET (RSS)
export interface INMETAlert {
  id: string
  title: string
  description: string
  severity: 'baixo' | 'medio' | 'alto' | 'muito_alto'
  startDate: string
  endDate: string
  municipalities: string[]
  risks: string[]
}

// Dados normalizados para o dashboard
export interface WeatherData {
  stationId: string
  stationName: string
  state: string
  coordinates: {
    lat: number
    lng: number
  }
  timestamp: string

  rain: {
    current: number      // mm/h (calculado)
    last30min: number    // mm acumulado
    last1h: number       // mm acumulado
    last24h: number      // mm acumulado
  }

  temperature: {
    current: number
    min: number
    max: number
  }

  humidity: {
    current: number
    min: number
    max: number
  }

  wind: {
    speed: number        // km/h
    direction: number    // graus
    gust: number         // km/h (rajada)
  }

  pressure: number       // hPa

  status: 'online' | 'delayed' | 'offline'
  alertLevel: 'normal' | 'attention' | 'alert' | 'severe'
}

export interface AlertData {
  id: string
  region: string
  level: 'attention' | 'alert' | 'severe'
  type: 'rain' | 'flood' | 'storm' | 'wind'
  message: string
  startTime: string
  endTime?: string
  source: string
  rain1h?: number
  rain24h?: number
}

// Estações para monitoramento
export const MONITORED_STATIONS = {
  // São Paulo Capital e Região Metropolitana
  'A701': { name: 'São Paulo - Mirante de Santana', city: 'São Paulo', zone: 'Centro' },
  'A713': { name: 'São Paulo - Interlagos', city: 'São Paulo', zone: 'Zona Sul' },
  'A728': { name: 'Santo André', city: 'Santo André', zone: 'ABC' },
  'A736': { name: 'Guarulhos', city: 'Guarulhos', zone: 'Norte' },
  'A755': { name: 'Osasco', city: 'Osasco', zone: 'Oeste' },

  // Interior de SP (exemplos)
  'A711': { name: 'Campinas', city: 'Campinas', zone: 'Interior' },
  'A714': { name: 'Santos', city: 'Santos', zone: 'Litoral' },

  // Rio de Janeiro
  'A652': { name: 'Rio de Janeiro - Forte de Copacabana', city: 'Rio de Janeiro', zone: 'Zona Sul' },
  'A621': { name: 'Rio de Janeiro - Vila Militar', city: 'Rio de Janeiro', zone: 'Zona Oeste' },
}

export type StationCode = keyof typeof MONITORED_STATIONS
