# Backlog técnico por sprint

## Sprint 1 — Base do projeto

### Objetivo
Subir fundação técnica do sistema.

### Entregáveis
- monorepo configurado
- NestJS inicial
- Next.js inicial
- Prisma configurado
- PostgreSQL conectado
- lint, format e env padrão
- autenticação básica

### Tarefas
- inicializar workspace com pnpm e turbo
- criar apps `api` e `web`
- configurar Prisma e conexão com banco
- criar módulo `auth`
- criar registro e login
- criar middleware/guard de autenticação
- criar página de login e registro

## Sprint 2 — Domínio principal

### Objetivo
Implementar entidades centrais do MVP.

### Entregáveis
- goals CRUD
- plans CRUD
- routines CRUD
- tasks CRUD

### Tarefas
- modelar DTOs
- criar controllers, services e repositories
- aplicar validação
- criar páginas de listagem e detalhe
- conectar frontend com API

## Sprint 3 — Execução

### Objetivo
Capturar a execução real do usuário.

### Entregáveis
- iniciar tarefa
- pausar tarefa
- concluir tarefa
- registrar log de execução
- visão de tarefas de hoje

### Tarefas
- criar módulo `executions`
- criar endpoints start/stop/log
- atualizar status da tarefa
- calcular `actualMinutes`
- montar tela de execução diária

## Sprint 4 — Dashboard e métricas

### Objetivo
Entregar visão operacional mínima.

### Entregáveis
- dashboard diário
- dashboard semanal
- métricas básicas

### Tarefas
- completion rate
- adherence rate
- tempo estimado vs real
- tarefas bloqueadas
- tarefas adiadas
- componentes visuais da dashboard

## Sprint 5 — Integração com agente

### Objetivo
Conectar o fluxo de planejamento automático.

### Entregáveis
- endpoint `/agent/plan`
- endpoint `/agent/replan`
- endpoint `/agent/context/:userId`

### Tarefas
- definir DTO do plano estruturado
- validar payload do agente
- salvar plano e rotinas automaticamente
- consolidar contexto histórico
- devolver resumo operacional

## Sprint 6 — Revisão e refinamento

### Objetivo
Fechar o ciclo de aprendizado operacional.

### Entregáveis
- revisão semanal
- recomendações
- nova versão de plano

### Tarefas
- criar módulo `reviews`
- criar módulo `recommendations`
- gerar resumo semanal
- habilitar replanejamento versionado
