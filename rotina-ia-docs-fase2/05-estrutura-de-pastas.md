# Estrutura de Pastas

## Monorepo recomendado
```bash
rotina-ai/
  apps/
    web/
    api/
  packages/
    ui/
    types/
    config/
  docs/
  scripts/
  prisma/
  .env.example
  package.json
  turbo.json
```

## Estrutura da API
```bash
apps/api/src/
  main.ts
  app.module.ts
  common/
    decorators/
    filters/
    guards/
    interceptors/
    pipes/
  config/
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
```

## Estrutura do frontend
```bash
apps/web/src/
  app/
  components/
  features/
    auth/
    dashboard/
    goals/
    plans/
    routines/
    tasks/
    reviews/
  hooks/
  lib/
  services/
  store/
  types/
```
