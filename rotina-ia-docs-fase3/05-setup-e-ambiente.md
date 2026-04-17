# Setup e ambiente

## Arquivo `.env.example`

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/rotina_ai"
JWT_SECRET="change_me"
JWT_EXPIRES_IN="1d"
PORT=3001
NEXT_PUBLIC_API_URL="http://localhost:3001"
```

## Ferramentas recomendadas

- Node.js LTS
- pnpm
- Docker opcional para banco local
- VS Code
- Prisma CLI

## Scripts sugeridos no root

```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

## Ordem de setup

1. criar monorepo
2. configurar `pnpm-workspace.yaml`
3. criar `apps/api` e `apps/web`
4. instalar Prisma
5. configurar `DATABASE_URL`
6. gerar primeira migration
7. subir backend
8. subir frontend
