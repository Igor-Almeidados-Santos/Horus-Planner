# Backlog de implementacao atual

Backlog objetivo do estado real do projeto em `2026-04-30`, baseado no codigo que ja existe em `apps/api` e `apps/web`.

## Como ler

- `P0`: bloqueia seguranca, confiabilidade ou operacao real
- `P1`: fecha lacunas importantes de produto
- `P2`: melhora maturidade, manutencao e qualidade

## P0 — Critico

### 1. Implementar autorizacao por recurso

**Problema**
- Hoje varias rotas acessam e alteram registros apenas por `id`, sem validar se o recurso pertence ao usuario autenticado.

**Impacto**
- Risco real de leitura e alteracao de dados de outro usuario.

**Arquivos principais**
- `apps/api/src/firebase/firebase-data.service.ts`
- `apps/api/src/modules/goals/goals.module.ts`
- `apps/api/src/modules/plans/plans.module.ts`
- `apps/api/src/modules/routines/routines.module.ts`
- `apps/api/src/modules/tasks/tasks.module.ts`
- `apps/api/src/modules/executions/executions.module.ts`
- `apps/api/src/modules/recommendations/recommendations.module.ts`

**O que implementar**
- Criar helpers no service para buscar recurso por `id` + `userId`.
- Exigir `authorization` nas rotas de leitura, update e delete por `:id`.
- Bloquear operacoes quando o recurso nao pertencer ao usuario autenticado.
- Revisar `activatePlan`, `archivePlan`, `updateTaskStatus`, `stopExecution`, `applyRecommendation` e endpoints equivalentes.

**Criterio de pronto**
- Nenhuma operacao por `id` altera ou retorna recurso de outro usuario.

### 2. Corrigir fluxo de execucao para ficar consistente

**Problema**
- `POST /api/executions/stop` nao resolve usuario autenticado e hoje fecha execucao apenas por `taskId`.

**Impacto**
- Fluxo de execucao fica inconsistente e mais fragil que o restante da API.

**Arquivos principais**
- `apps/api/src/modules/executions/executions.module.ts`
- `apps/api/src/firebase/firebase-data.service.ts`
- `apps/web/src/components/task-operations-panel.tsx`
- `apps/web/src/services/horus-api.ts`

**O que implementar**
- Exigir autenticacao no `stop`.
- Validar que a execucao em aberto pertence ao usuario.
- Garantir que iniciar, pausar, bloquear e concluir mantem task e execution log sincronizados.
- Revisar se concluir tarefa deve sempre usar `estimatedMinutes` no frontend ou se precisa de input real.

**Criterio de pronto**
- O ciclo `start -> stop/done` funciona por usuario, sem efeitos colaterais em tarefas de terceiros.

### 3. Remover fallback silencioso de dashboard em modo real

**Problema**
- Quando `fetchWorkspaceData` falha, o frontend retorna `defaultWorkspaceData` sem avisar.

**Impacto**
- Backend indisponivel parece sistema funcional; dificulta suporte, debugging e confianca.

**Arquivos principais**
- `apps/web/src/services/horus-api.ts`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/goals/page.tsx`
- `apps/web/src/app/plans/page.tsx`
- `apps/web/src/app/execution/page.tsx`
- `apps/web/src/app/review/page.tsx`
- `apps/web/src/components/workspace-shell.tsx`
- `apps/web/src/lib/auth-session.ts`

**O que implementar**
- Diferenciar explicitamente `modo demo` de `modo real`.
- Manter fallback mock apenas quando o usuario entrar em demonstracao.
- Exibir estado de erro real quando a API falhar em sessao autenticada.
- Exibir aviso visual quando os dados forem demo.

**Criterio de pronto**
- Usuario autenticado nunca recebe dados demo silenciosamente.

## P1 — Importante

### 4. Adicionar testes automatizados minimos

**Problema**
- API e web ainda nao possuem testes; os scripts `test` sao placeholders.

**Impacto**
- Regressao facil em seguranca, GPT Actions e fluxos principais.

**Arquivos principais**
- `apps/api/package.json`
- `apps/web/package.json`
- `apps/api/src/modules/gpt-actions/gpt-actions.module.ts`
- `apps/api/src/modules/executions/executions.module.ts`
- `apps/api/src/modules/agent/agent.module.ts`
- `apps/web/src/services/horus-api.ts`

**O que implementar**
- Configurar runner de testes para API e web.
- Cobrir ao menos:
  - autorizacao por recurso
  - `gpt-actions/plans`
  - `executions/start` e `executions/stop`
  - fallback e erro em `fetchWorkspaceData`
- Adicionar smoke test de build ou integracao basica.

**Criterio de pronto**
- `pnpm test` executa testes uteis e falha quando ha regressao relevante.

### 5. Completar CRUD no frontend

**Problema**
- A API oferece mais operacoes do que a interface usa hoje.

**Impacto**
- Produto parece incompleto mesmo com backend pronto.

**Arquivos principais**
- `apps/web/src/components/task-operations-panel.tsx`
- `apps/web/src/components/goals-operations-panel.tsx`
- `apps/web/src/components/plans-operations-panel.tsx`
- `apps/web/src/components/routines-operations-panel.tsx`
- `apps/web/src/services/horus-api.ts`

**O que implementar**
- Tasks: editar e remover.
- Goals: remover e, se fizer sentido, editar campos alem de status.
- Plans: editar metadados e, se fizer sentido, visualizar detalhe.
- Garantir feedback de loading, erro e sucesso em todas as operacoes.

**Criterio de pronto**
- Operacoes principais disponiveis na API possuem equivalente funcional na interface.

### 6. Fechar fluxo real de autenticacao e onboarding

**Problema**
- O projeto funciona bem em modo demo, mas ainda mistura esse caminho com o fluxo real.

**Impacto**
- Ambiguidade de comportamento entre usuario autenticado e demonstracao.

**Arquivos principais**
- `apps/web/src/components/auth-form-panel.tsx`
- `apps/web/src/components/onboarding-form-panel.tsx`
- `apps/web/src/lib/auth-session.ts`
- `apps/web/middleware.ts`
- `apps/api/src/modules/auth/auth.module.ts`
- `apps/api/src/firebase/firebase-data.service.ts`

**O que implementar**
- Revisar redirecionamentos entre login, demo, onboarding e dashboard.
- Garantir persistencia correta de onboarding por usuario real.
- Separar claramente sessao demo de sessao autenticada.

**Criterio de pronto**
- O fluxo real funciona sem depender do modo demonstracao para navegar.

## P2 — Maturidade

### 7. Refinar observabilidade e erros da API

**Problema**
- Falhas de integracao e validacao ainda nao tem padrao forte de mensagens e diagnostico.

**Arquivos principais**
- `apps/api/src/main.ts`
- `apps/api/src/modules/agent/openai-planner.service.ts`
- `apps/api/src/modules/gpt-actions/gpt-actions.module.ts`

**O que implementar**
- Padronizar erros HTTP de validacao e autorizacao.
- Melhorar logs de falha em OpenAI, GPT Actions e Firebase.
- Opcionalmente criar filtros globais de excecao.

### 8. Documentar backlog tecnico e status operacional

**Problema**
- O backlog antigo reflete a fase inicial do projeto, nao o estado atual do codigo.

**Arquivos principais**
- `rotina-ia-docs-fase3/03-backlog-tecnico-por-sprint.md`
- `rotina-ia-docs-fase3/07-checklist-de-execucao.md`
- `docs/backlog-implementacao-atual.md`

**O que implementar**
- Sincronizar os docs de sprint com o backlog atual.
- Marcar itens ja concluidos e itens ainda pendentes.
- Definir ordem da proxima sprint com base em risco real.

## Ordem recomendada de execucao

1. Autorizacao por recurso
2. Fluxo de execucao
3. Remocao do fallback silencioso de dados demo
4. Testes automatizados minimos
5. CRUD faltante no frontend
6. Refinos de autenticacao/onboarding

## Itens ja implementados que nao precisam entrar nesta sprint

- CRUD base de goals, plans, routines e tasks
- dashboard e workspace base
- reviews e recommendations
- chat do agente
- GPT Actions com schema OpenAPI e endpoint de publicacao
- build e tipagem passando em `api` e `web`
