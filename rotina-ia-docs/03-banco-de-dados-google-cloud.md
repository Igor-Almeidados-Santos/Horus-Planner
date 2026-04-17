# Banco de Dados no Google Cloud

## Escolha principal

Para este projeto, a recomendação inicial é:

- **Cloud SQL com PostgreSQL** como banco principal
- **Firestore** apenas como complemento opcional para dados flexíveis

## Quando usar Cloud SQL

Ideal para dados relacionais, como:

- usuários
- planos
- rotinas
- tarefas
- subtarefas
- dependências
- recorrências
- métricas
- histórico de execução

## Quando usar Firestore

Útil para:

- memória contextual do agente
- logs de interações
- snapshots de contexto
- respostas intermediárias
- preferências dinâmicas sem esquema rígido

## Estratégia recomendada

Começar com PostgreSQL no Cloud SQL para manter consistência estrutural e previsibilidade analítica.
