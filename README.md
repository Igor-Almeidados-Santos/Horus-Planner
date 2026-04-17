# Horus Planner

Base inicial completa do projeto descrito nos documentos `rotina-ia-docs*`, adaptada para persistencia principal em Firebase.

## O que foi estruturado

- monorepo com `apps/web`, `apps/api`, `packages/types` e `prisma`
- persistencia central em `Firebase Auth + Cloud Firestore`
- frontend Next.js com dashboard editorial inspirado na imagem de referência
- API NestJS com endpoints centrais do MVP
- dados demo inicializados automaticamente no Firestore para permitir navegação e validação visual do produto

## Estrutura

```text
apps/
  api/
  web/
packages/
  config/
  types/
```

## Setup esperado

1. Ative um gerenciador compatível com o `packageManager` do projeto.
2. Execute `corepack pnpm install`.
3. Copie `.env.example` para `.env`.
4. Preencha as credenciais do Firebase Admin e a `FIREBASE_WEB_API_KEY`.
5. Rode `corepack pnpm dev`.

## Firebase

A API usa:

- `Firebase Auth` para criacao de usuario e resolucao de identidade
- `Cloud Firestore` para goals, plans, routines, tasks, execution logs, reviews, recommendations e sessoes do agente
- `Firebase Storage` reservado para arquivos futuros

Colecoes atuais no Firestore:

- `users`
- `profiles`
- `goals`
- `plans`
- `routines`
- `tasks`
- `executionLogs`
- `reviews`
- `recommendations`
- `agentSessions`

## Observação

Se nenhuma credencial autenticada for fornecida nos headers, a API usa `DEFAULT_FIREBASE_USER_ID` e inicializa um workspace demo no Firestore para facilitar desenvolvimento e validação visual.
