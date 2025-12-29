# AClima - Product Requirements Document (PRD)

## 1. Visão Geral do Produto

### 1.1 Nome do Produto
**AClima** - Plataforma Realtime de Monitoramento de Chuvas e Alertas

### 1.2 Declaração do Problema
Gestores de crise, defesa civil e autoridades operacionais precisam de informações meteorológicas em tempo real para tomar decisões rápidas sobre riscos de alagamento e eventos climáticos extremos. Atualmente, essas informações são fragmentadas, atrasadas ou de difícil interpretação.

### 1.3 Proposta de Valor
Dashboard centralizado que fornece visão integrada e em tempo real das condições meteorológicas, com alertas automáticos e notificações multicanal, permitindo tomada de decisão rápida e coordenada.

### 1.4 Público-Alvo

| Tipo | Descrição | Necessidades Principais |
|------|-----------|------------------------|
| **Operadores/Defesa Civil** | Profissionais de monitoramento 24/7 | Visualização clara, alertas instantâneos |
| **Gestores de Crise** | Tomadores de decisão em emergências | Visão agregada, histórico, tendências |
| **Técnicos de Manutenção** | Responsáveis pela rede de sensores | Status dos equipamentos, detecção de falhas |
| **Público Geral** | Cidadãos interessados | Consulta simples da situação atual |

## 2. Objetivos do Produto

### 2.1 Objetivos de Negócio
1. Reduzir tempo de resposta a eventos meteorológicos críticos
2. Centralizar informações de múltiplas fontes de dados
3. Automatizar geração e distribuição de alertas
4. Fornecer base de dados para análises históricas

### 2.2 Métricas de Sucesso
| Métrica | Meta |
|---------|------|
| Latência de atualização | < 5 minutos |
| Tempo para compreensão da situação | < 10 segundos |
| Uptime do sistema | > 99.5% |
| Taxa de alertas falsos | < 5% |

## 3. Princípios Fundamentais

1. **Dashboard é o produto central** - alertas e notificações existem para apoiá-lo
2. **Clareza > Estética** - informação legível é prioridade
3. **Dados atrasados devem ser sinalizados** - transparência sobre qualidade
4. **Dashboard não consome APIs externas diretamente** - camada de normalização intermediária
5. **Atualização via WebSocket/SSE** - tempo real sem refresh manual

## 4. Funcionalidades

### 4.1 Dashboard Principal - Situação Meteorológica Atual (Painel 1)

**Objetivo:** Visão integrada e comparativa das condições em tempo real.

**Componentes:**
- **Mapa Interativo**
  - Heatmap de precipitação
  - Marcadores de estações
  - Áreas em alerta destacadas

- **Cards de Status**
  - Chuva atual (mm/h)
  - Acumulado 1h
  - Acumulado 24h
  - Quantidade de alertas ativos

- **Lista de Regiões**
  - Comparação entre cidades/bairros
  - Indicadores: chuva atual, acumulados, nível de risco, última atualização

- **Gráfico Temporal**
  - Precipitação nas últimas 24 horas
  - Tendência visual

### 4.2 Painel de Alertas Hidrológicos (Painel 2)

**Objetivo:** Monitorar níveis de risco e coordenar resposta.

**Componentes:**
- **Contadores por Nível**
  - Severo (vermelho)
  - Alerta (laranja)
  - Atenção (amarelo)

- **Lista de Alertas Ativos**
  - Região afetada
  - Tipo de alerta
  - Horário e duração
  - Dados de precipitação

- **Mapa de Status**
  - Pontos coloridos por nível de risco

### 4.3 Painel de Estações Climáticas (Painel 3)

**Objetivo:** Dados brutos e status da rede de sensores.

**Componentes:**
- **Status da Rede**
  - Estações online/offline/atrasadas

- **Cards por Estação**
  - Identificação e localização
  - Chuva instantânea e acumulados
  - Temperatura e umidade
  - Última atualização

- **Detecção de Falhas**
  - Sensores offline destacados
  - Alertas de manutenção

## 5. Regras de Negócio

### 5.1 Classificação de Alertas

| Nível | Condição | Cor | Ação |
|-------|----------|-----|------|
| **Normal** | Abaixo dos limiares | Verde | Monitoramento padrão |
| **Atenção** | ≥ 10mm em 30min | Amarelo | Alerta interno |
| **Alerta** | ≥ 30mm em 60min | Laranja | Notificação multicanal |
| **Severo** | ≥ 50mm em 24h | Vermelho | Acionamento de protocolos |

### 5.2 Regras de Dados

- Dados com mais de 5 minutos devem ser marcados como "atrasados"
- Dados com mais de 15 minutos devem mostrar aviso visual
- Estações sem atualização por 1 hora são marcadas como "offline"

## 6. Notificações

### 6.1 Canais Suportados
- WhatsApp (via API oficial ou Evolution API)
- Telegram (Bot API)
- Email (SMTP)

### 6.2 Configuração
- Opt-in obrigatório
- Seleção de regiões de interesse
- Seleção de níveis de alerta (mínimo para receber)
- Opt-out disponível

## 7. Personalização por Região

### 7.1 Métodos de Seleção
- Estado / Cidade (dropdown)
- Seleção por mapa (clique + raio)
- Localização do navegador (opcional, com permissão)

### 7.2 Persistência
- Preferências salvas no perfil do usuário
- Fallback para região padrão se não logado

## 8. Requisitos Não-Funcionais

### 8.1 Performance
- Tempo de carregamento inicial: < 3 segundos
- Atualização de dados: tempo real via WebSocket/SSE
- Suporte a 1000+ usuários simultâneos

### 8.2 Disponibilidade
- Uptime: 99.5%
- Fallback para dados em cache se backend indisponível

### 8.3 Segurança
- HTTPS obrigatório
- Autenticação para áreas administrativas
- LGPD compliance (consentimento, exclusão de dados)

### 8.4 Acessibilidade
- Contraste adequado para daltonismo
- Suporte a leitores de tela
- Responsivo (desktop, tablet, mobile)

## 9. Roadmap

### MVP (v1.0)
- [x] Dashboard de Situação Atual
- [x] Painel de Alertas
- [x] Painel de Estações
- [ ] Deploy no Vercel
- [ ] Dados mockados funcionais

### v1.1
- [ ] Integração com API de dados reais
- [ ] WebSocket para atualizações em tempo real
- [ ] Mapa interativo com Leaflet/MapBox

### v1.2
- [ ] Sistema de notificações
- [ ] Autenticação de usuários
- [ ] Personalização por região

### v2.0
- [ ] Histórico e relatórios
- [ ] Previsão de curto prazo
- [ ] API pública

## 10. Premissas e Dependências

### Premissas
- Haverá fonte de dados meteorológicos disponível (API externa ou sensores próprios)
- Usuários terão navegadores modernos (Chrome, Firefox, Safari, Edge)

### Dependências
- Fonte de dados de precipitação (a definir)
- Serviço de mapas (Leaflet/OpenStreetMap ou MapBox)
- Provedor de notificações (WhatsApp Business API, Telegram Bot)

---

*Documento criado em: 2024-12-28*
*Versão: 1.0*
