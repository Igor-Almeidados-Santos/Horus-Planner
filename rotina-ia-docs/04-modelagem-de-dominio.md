# Modelagem de Domínio

## Entidades principais

- User
- Profile
- Goal
- Plan
- Routine
- Task
- Subtask
- ScheduleBlock
- ExecutionLog
- Metric
- Review
- Recommendation
- AgentSession
- Constraint
- Preference

## Relações conceituais

- Um usuário tem vários objetivos.
- Um objetivo pode gerar vários planos.
- Um plano contém rotinas, tarefas e regras.
- Cada tarefa pode ter prioridade, contexto, duração estimada, prazo, energia exigida, dificuldade, categoria, dependências e status.
- Cada execução gera logs.
- Os logs alimentam métricas.
- As métricas alimentam recomendações do agente.

## Princípio de modelagem

O sistema deve preservar histórico e permitir versionamento dos planos, evitando sobrescrita destrutiva.
