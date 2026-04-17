# Arquitetura Geral

A arquitetura recomendada é composta por quatro camadas principais.

## 1. Camada de agente

Responsável por:

- captar objetivo do usuário
- decompor metas em planos
- gerar tarefas detalhadas
- sugerir prioridades, ordem, duração, dependências e checkpoints
- revisar execução com base no histórico

O agente não deve gravar diretamente no banco. Ele deve enviar dados estruturados para a API.

## 2. API central

Responsável por:

- receber dados do agente
- validar regras de negócio
- normalizar campos
- calcular métricas
- armazenar histórico
- servir a interface web
- expor endpoints para análise, agenda e execução

## 3. Interface web

Responsável por:

- apresentar o plano
- permitir edição manual
- mostrar execução real vs planejado
- exibir indicadores
- facilitar revisão diária e semanal

## 4. Banco de dados em nuvem

Responsável por:

- persistência centralizada
- suporte a histórico
- métricas e análises
- futura escalabilidade para produção
