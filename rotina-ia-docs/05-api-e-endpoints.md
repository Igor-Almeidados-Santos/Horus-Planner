# API e Endpoints

A API deve ser mais do que um CRUD. Ela precisa incorporar inteligência de domínio.

## Módulos funcionais

### Planejamento
- criar plano
- decompor objetivo em marcos
- gerar cronograma
- reorganizar prioridades
- recalcular carga diária e semanal

### Organização
- padronizar nomenclaturas
- categorizar tarefas
- agrupar por contexto
- consolidar tarefas duplicadas
- validar dependências
- detectar conflitos de agenda

### Execução
- iniciar tarefa
- pausar
- concluir
- registrar impedimento
- registrar tempo real gasto
- registrar dificuldade percebida

### Mensuração
- taxa de conclusão
- aderência ao plano
- eficiência por tipo de atividade
- tempo estimado vs real
- consistência diária
- gargalos recorrentes

### Análise
- identificar excesso de carga
- detectar tarefas mal definidas
- sugerir redistribuição
- detectar metas irreais
- apontar atrasos estruturais

## Endpoints sugeridos

```http
POST   /agent/plan
POST   /agent/replan
GET    /agent/context/:userId

POST   /goals
GET    /goals/:id

POST   /plans
GET    /plans/:id
PATCH  /plans/:id

POST   /tasks
PATCH  /tasks/:id/status
POST   /tasks/:id/log

GET    /dashboard/:userId
GET    /metrics/:userId
GET    /review/:userId/weekly
```
