# Monorepo e estrutura real do projeto

## Estrutura recomendada

```bash
rotina-ai/
  apps/
    api/
    web/
  packages/
    ui/
    types/
    config/
  prisma/
  docs/
  scripts/
  .env.example
  package.json
  turbo.json
  pnpm-workspace.yaml
```

## Detalhamento da API

```bash
apps/api/
  src/
    main.ts
    app.module.ts
    config/
    common/
      decorators/
      filters/
      guards/
      interceptors/
      pipes/
    database/
    modules/
      auth/
      users/
      profiles/
      goals/
      plans/
      routines/
      tasks/
      executions/
      reviews/
      recommendations/
      dashboard/
      agent/
  test/
  package.json
  tsconfig.json
```

## Detalhamento do frontend

```bash
apps/web/
  src/
    app/
      dashboard/
      goals/
      plans/
      routine/
      review/
      login/
      register/
    components/
    features/
      auth/
      dashboard/
      goals/
      plans/
      tasks/
      reviews/
    hooks/
    lib/
    services/
    store/
    types/
  public/
  package.json
  tsconfig.json
```

## Packages compartilhados

### `packages/ui`
Componentes reutilizáveis:
- cards
- tabelas
- badges
- botões
- modais
- inputs
- componentes de layout

### `packages/types`
Contratos compartilhados:
- DTOs
- enums
- tipos de payload do agente
- tipos de resposta da API

### `packages/config`
Padronização de:
- eslint
- tsconfig base
- prettier
- env contracts

## Decisão operacional

Use monorepo desde o início para evitar divergência entre frontend, backend e contratos compartilhados.
