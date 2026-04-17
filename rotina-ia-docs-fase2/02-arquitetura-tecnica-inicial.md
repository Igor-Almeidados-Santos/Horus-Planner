# Arquitetura Técnica Inicial

## Stack base

### Frontend
- Next.js
- TypeScript
- Tailwind

### Backend
- NestJS
- TypeScript
- Prisma

### Banco
- PostgreSQL

### Infra
- Google Cloud SQL
- Secret Manager
- Cloud Storage opcional

## Arquitetura lógica

### Camada 1 — Interface Web
Responsável por:
- exibir dados
- permitir edição
- mostrar métricas
- facilitar execução diária

### Camada 2 — API
Responsável por:
- validação
- padronização
- regras de negócio
- persistência
- cálculos e métricas
- comunicação com o agente

### Camada 3 — Banco
Responsável por:
- armazenar estrutura do domínio
- histórico
- logs
- métricas

### Camada 4 — Agente GPT
Responsável por:
- interpretar objetivos
- criar planos
- decompor ações
- revisar histórico
- sugerir ajustes
