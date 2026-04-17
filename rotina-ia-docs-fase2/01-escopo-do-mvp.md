# Escopo do MVP

O primeiro objetivo não deve ser fazer tudo. Deve provar que o sistema consegue:

- receber um plano vindo do agente
- salvar de forma estruturada
- exibir na interface
- permitir execução diária
- medir progresso
- devolver contexto para o agente reajustar o plano

## MVP funcional

### Autenticação
- cadastro
- login
- sessão
- perfil básico do usuário

### Objetivos
- criar objetivo
- listar objetivos
- detalhar objetivo
- alterar status

### Planos
- criar plano manualmente ou via agente
- associar plano a um objetivo
- versionar plano
- ativar/desativar plano

### Rotinas e tarefas
- criar rotina
- criar tarefas
- subtarefas
- prioridade
- dificuldade
- duração estimada
- recorrência
- contexto

### Execução
- marcar tarefa como iniciada
- pausada
- concluída
- adiada
- bloqueada
- registrar tempo real gasto
- registrar observação

### Dashboard
- tarefas de hoje
- progresso semanal
- aderência
- tempo planejado vs realizado

### Integração com agente
- endpoint para receber plano estruturado
- endpoint para devolver contexto consolidado
- endpoint para replanejamento
