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

// Capitais brasileiras com suas estações INMET
export interface CapitalInfo {
  name: string
  state: string
  stateCode: string
  region: string
  stations: string[] // Códigos das estações INMET na capital
}

export const BRAZILIAN_CAPITALS: Record<string, CapitalInfo> = {
  'rio-branco': { name: 'Rio Branco', state: 'Acre', stateCode: 'AC', region: 'Norte', stations: ['A104'] },
  'maceio': { name: 'Maceió', state: 'Alagoas', stateCode: 'AL', region: 'Nordeste', stations: ['A303'] },
  'macapa': { name: 'Macapá', state: 'Amapá', stateCode: 'AP', region: 'Norte', stations: ['A202'] },
  'manaus': { name: 'Manaus', state: 'Amazonas', stateCode: 'AM', region: 'Norte', stations: ['A101'] },
  'salvador': { name: 'Salvador', state: 'Bahia', stateCode: 'BA', region: 'Nordeste', stations: ['A401'] },
  'fortaleza': { name: 'Fortaleza', state: 'Ceará', stateCode: 'CE', region: 'Nordeste', stations: ['A305'] },
  'brasilia': { name: 'Brasília', state: 'Distrito Federal', stateCode: 'DF', region: 'Centro-Oeste', stations: ['A001'] },
  'vitoria': { name: 'Vitória', state: 'Espírito Santo', stateCode: 'ES', region: 'Sudeste', stations: ['A612'] },
  'goiania': { name: 'Goiânia', state: 'Goiás', stateCode: 'GO', region: 'Centro-Oeste', stations: ['A002'] },
  'sao-luis': { name: 'São Luís', state: 'Maranhão', stateCode: 'MA', region: 'Nordeste', stations: ['A203'] },
  'cuiaba': { name: 'Cuiabá', state: 'Mato Grosso', stateCode: 'MT', region: 'Centro-Oeste', stations: ['A901'] },
  'campo-grande': { name: 'Campo Grande', state: 'Mato Grosso do Sul', stateCode: 'MS', region: 'Centro-Oeste', stations: ['A702'] },
  'belo-horizonte': { name: 'Belo Horizonte', state: 'Minas Gerais', stateCode: 'MG', region: 'Sudeste', stations: ['A521'] },
  'belem': { name: 'Belém', state: 'Pará', stateCode: 'PA', region: 'Norte', stations: ['A201'] },
  'joao-pessoa': { name: 'João Pessoa', state: 'Paraíba', stateCode: 'PB', region: 'Nordeste', stations: ['A320'] },
  'curitiba': { name: 'Curitiba', state: 'Paraná', stateCode: 'PR', region: 'Sul', stations: ['A807'] },
  'recife': { name: 'Recife', state: 'Pernambuco', stateCode: 'PE', region: 'Nordeste', stations: ['A301'] },
  'teresina': { name: 'Teresina', state: 'Piauí', stateCode: 'PI', region: 'Nordeste', stations: ['A312'] },
  'rio-de-janeiro': { name: 'Rio de Janeiro', state: 'Rio de Janeiro', stateCode: 'RJ', region: 'Sudeste', stations: ['A652', 'A621'] },
  'natal': { name: 'Natal', state: 'Rio Grande do Norte', stateCode: 'RN', region: 'Nordeste', stations: ['A304'] },
  'porto-alegre': { name: 'Porto Alegre', state: 'Rio Grande do Sul', stateCode: 'RS', region: 'Sul', stations: ['A801'] },
  'porto-velho': { name: 'Porto Velho', state: 'Rondônia', stateCode: 'RO', region: 'Norte', stations: ['A103'] },
  'boa-vista': { name: 'Boa Vista', state: 'Roraima', stateCode: 'RR', region: 'Norte', stations: ['A135'] },
  'florianopolis': { name: 'Florianópolis', state: 'Santa Catarina', stateCode: 'SC', region: 'Sul', stations: ['A806'] },
  'sao-paulo': { name: 'São Paulo', state: 'São Paulo', stateCode: 'SP', region: 'Sudeste', stations: ['A701', 'A713'] },
  'aracaju': { name: 'Aracaju', state: 'Sergipe', stateCode: 'SE', region: 'Nordeste', stations: ['A409'] },
  'palmas': { name: 'Palmas', state: 'Tocantins', stateCode: 'TO', region: 'Norte', stations: ['A009'] },
}

// Mapeamento de código de estação para informações
export const STATION_INFO: Record<string, { name: string; city: string; state: string }> = {
  // Norte
  'A104': { name: 'Rio Branco', city: 'Rio Branco', state: 'AC' },
  'A101': { name: 'Manaus', city: 'Manaus', state: 'AM' },
  'A202': { name: 'Macapá', city: 'Macapá', state: 'AP' },
  'A201': { name: 'Belém', city: 'Belém', state: 'PA' },
  'A103': { name: 'Porto Velho', city: 'Porto Velho', state: 'RO' },
  'A135': { name: 'Boa Vista', city: 'Boa Vista', state: 'RR' },
  'A009': { name: 'Palmas', city: 'Palmas', state: 'TO' },

  // Nordeste
  'A303': { name: 'Maceió', city: 'Maceió', state: 'AL' },
  'A401': { name: 'Salvador', city: 'Salvador', state: 'BA' },
  'A305': { name: 'Fortaleza', city: 'Fortaleza', state: 'CE' },
  'A203': { name: 'São Luís', city: 'São Luís', state: 'MA' },
  'A320': { name: 'João Pessoa', city: 'João Pessoa', state: 'PB' },
  'A301': { name: 'Recife', city: 'Recife', state: 'PE' },
  'A312': { name: 'Teresina', city: 'Teresina', state: 'PI' },
  'A304': { name: 'Natal', city: 'Natal', state: 'RN' },
  'A409': { name: 'Aracaju', city: 'Aracaju', state: 'SE' },

  // Centro-Oeste
  'A001': { name: 'Brasília', city: 'Brasília', state: 'DF' },
  'A002': { name: 'Goiânia', city: 'Goiânia', state: 'GO' },
  'A901': { name: 'Cuiabá', city: 'Cuiabá', state: 'MT' },
  'A702': { name: 'Campo Grande', city: 'Campo Grande', state: 'MS' },

  // Sudeste
  'A612': { name: 'Vitória', city: 'Vitória', state: 'ES' },
  'A521': { name: 'Belo Horizonte - Pampulha', city: 'Belo Horizonte', state: 'MG' },
  'A652': { name: 'Rio de Janeiro - Forte de Copacabana', city: 'Rio de Janeiro', state: 'RJ' },
  'A621': { name: 'Rio de Janeiro - Vila Militar', city: 'Rio de Janeiro', state: 'RJ' },
  'A701': { name: 'São Paulo - Mirante de Santana', city: 'São Paulo', state: 'SP' },
  'A713': { name: 'São Paulo - Interlagos', city: 'São Paulo', state: 'SP' },

  // Sul
  'A807': { name: 'Curitiba', city: 'Curitiba', state: 'PR' },
  'A801': { name: 'Porto Alegre', city: 'Porto Alegre', state: 'RS' },
  'A806': { name: 'Florianópolis', city: 'Florianópolis', state: 'SC' },
}

// Estações para monitoramento (mantido para compatibilidade)
export const MONITORED_STATIONS = STATION_INFO

export type StationCode = keyof typeof STATION_INFO
export type CapitalSlug = keyof typeof BRAZILIAN_CAPITALS
