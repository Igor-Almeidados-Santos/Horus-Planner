# Módulos da Aplicação

Estrutura sugerida:

```text
src/
  modules/
    auth/
    users/
    profiles/
    goals/
    plans/
    routines/
    tasks/
    schedules/
    executions/
    metrics/
    reviews/
    recommendations/
    agent/
  common/
  infra/
```

## Objetivo dos módulos

- `auth`: autenticação e autorização
- `users`: gestão de usuários
- `profiles`: preferências e perfil operacional
- `goals`: objetivos estratégicos
- `plans`: planos e versionamento
- `routines`: rotinas recorrentes
- `tasks`: tarefas e subtarefas
- `schedules`: blocos de agenda
- `executions`: logs e execução real
- `metrics`: indicadores e cálculos
- `reviews`: revisões periódicas
- `recommendations`: recomendações do sistema
- `agent`: integração entre GPT e API
