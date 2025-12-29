# 📡 Projeto: Plataforma Realtime de Monitoramento de Chuvas e Alertas

## 1. Visão Geral
Criar uma **plataforma digital com foco principal em DASHBOARD REALTIME**, dedicada ao monitoramento de chuva (volume observado e previsão de curto prazo), geração de alertas automáticos e personalização por região, com distribuição de notificações via **WhatsApp, Telegram e Email**.

O dashboard é o **produto central do sistema**.  
Alertas, notificações e relatórios existem para apoiar o dashboard.

## 2. Objetivos do Projeto
- Exibir informações meteorológicas **em tempo quase real**
- Permitir **personalização por região**
- Gerar **alertas automáticos**
- Enviar notificações multicanal
- Garantir **confiabilidade e clareza**
- Ser escalável e LGPD-friendly

## 3. Princípios Fundamentais
- Dashboard não consome APIs externas diretamente
- Dados atrasados devem ser exibidos como atrasados
- Localização automática é opcional
- Clareza > estética
- Atualização via WebSocket/SSE

## 4. Tipos de Usuários
- Público geral
- Usuário cadastrado
- Operador/Admin

## 5. Personalização por Região
- Estado / Cidade
- Seleção por mapa (raio)
- Localização do navegador (opcional)

## 6. Dashboards
### 6.1 Situação Atual (Principal)
- Mapa realtime
- Cards de status
- Alertas ativos
- Linha do tempo

### 6.2 Alertas
- Alertas por região
- Nível e duração

### 6.3 Saúde dos Dados
- Status das fontes
- Latência
- Erros

### 6.4 Histórico
- Tendências
- Efetividade dos alertas

## 7. Arquitetura
Fontes → Ingestão → Normalização → Redis → API → WebSocket → Dashboard

## 8. Regras de Alerta
- 10 mm / 30 min → Atenção
- 30 mm / 60 min → Alerta
- 50 mm / 24h → Severo

## 9. Notificações
- WhatsApp
- Telegram
- Email

## 10. Privacidade
- Opt-in
- Opt-out
- Exclusão de conta

## 11. Stack
- Backend: FastAPI ou NestJS
- Cache: Redis
- Banco: Postgres
- Frontend: React / Next.js

## 12. MVP
- Dashboard realtime
- Personalização por região
- Alertas básicos

## 13. Critério de Sucesso
- Atualização automática
- Clareza em menos de 10 segundos
- Alertas confiáveis
