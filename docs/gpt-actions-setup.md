# Horus Planner GPT Actions Setup

## Estado local

- API local: `http://localhost:3001`
- Frontend local: `http://localhost:3000`
- OpenAPI schema local: `http://localhost:3001/api/gpt-actions/openapi.json`
- Endpoint da Action: `POST /api/gpt-actions/plans`
- Autenticacao: API key no header `x-horus-action-key`

## Variaveis necessarias

No `.env`:

```env
HORUS_GPT_ACTION_KEY="sua-chave-secreta"
GPT_ACTIONS_PUBLIC_URL="https://sua-api-publica"
```

`HORUS_GPT_ACTION_KEY` deve ser o mesmo valor configurado no GPT Builder.

`GPT_ACTIONS_PUBLIC_URL` deve ser uma URL HTTPS publica que a interface do ChatGPT consiga acessar. `localhost` nao funciona para GPT Actions.

## Como obter a URL publica

Opcoes comuns:

1. Deploy da API em um provedor com HTTPS.
2. Tunnel temporario com ngrok:

```bash
ngrok http 3001
```

3. Tunnel temporario com Cloudflare:

```bash
cloudflared tunnel --url http://localhost:3001
```

Depois de obter uma URL publica, atualize:

```env
GPT_ACTIONS_PUBLIC_URL="https://sua-url-publica"
```

Reinicie a API e confira:

```txt
https://sua-url-publica/api/gpt-actions/openapi.json
```

## Configuracao no GPT Builder

1. Crie um GPT.
2. Abra `Configure`.
3. Em `Instructions`, cole o prompt abaixo.
4. Em `Actions`, crie uma nova action.
5. Configure autenticacao como API key.
6. Configure a API key no header customizado `x-horus-action-key`.
7. Cole o valor de `HORUS_GPT_ACTION_KEY`.
8. Importe o schema pela URL:

```txt
https://sua-url-publica/api/gpt-actions/openapi.json
```

## Prompt recomendado para o GPT

```txt
Voce e o Mestre Horus, um agente de planejamento pessoal, estudos, rotina e execucao.

Seu papel e conversar comigo para entender:
- objetivo principal
- prazos
- compromissos fixos
- disponibilidade diaria
- energia ao longo do dia
- materias, projetos ou areas de foco
- restricoes reais
- nivel de urgencia

Depois de entender o contexto, crie um planejamento pratico e realista com:
- um objetivo principal
- um plano
- rotinas
- tarefas executaveis
- estimativas de tempo
- prioridade
- dificuldade
- datas relativas usando scheduledDayOffset e dueDayOffset
- horario sugerido em scheduledTime no formato HH:MM

Antes de salvar qualquer coisa, confirme comigo se quero publicar no Horus Planner.

Quando eu confirmar, use a action publishPlanningToHorus para enviar os dados estruturados ao Horus Planner.

Formato esperado:
- goal.title deve ser claro e curto
- goal.description deve resumir o objetivo
- goal.category deve classificar a area
- goal.priority deve ser LOW, MEDIUM, HIGH ou CRITICAL
- plan.title deve nomear o plano
- plan.description deve explicar a estrategia
- plan.planningHorizon deve ser daily, weekly, biweekly ou monthly
- plan.routines deve conter rotinas com name, frequencyType, timePreference e tasks
- cada task deve conter title, description, priority, difficulty, estimatedMinutes, context, scheduledDayOffset, dueDayOffset e scheduledTime

Use poucas tarefas boas em vez de muitas tarefas irreais.
Se faltar informacao critica, pergunte antes de publicar.
Depois de publicar, informe de forma resumida o que foi salvo.
```

## Exemplo de pedido para testar

```txt
Monte um plano semanal para estudar matematica e biologia.
Tenho 3 horas por dia, energia melhor de manha e prova em 20 dias.
Depois de montar, me mostre o plano antes de salvar no Horus Planner.
```

Depois:

```txt
Pode salvar no Horus Planner.
```

## Regras de payload validadas pela API

- `plan.routines` e `routine.tasks` sao obrigatorios no payload publicado.
- `plan.planningHorizon` aceita apenas `daily`, `weekly`, `biweekly` ou `monthly`.
- `routine.frequencyType` aceita apenas `daily`, `weekly` ou `flexible`.
- `routine.timePreference` aceita apenas `morning`, `afternoon`, `night` ou `flexible`.
- `task.estimatedMinutes` deve ser inteiro e no minimo `5`.
- `task.dueDayOffset` deve ser inteiro e maior ou igual a `0`.
- `task.scheduledTime`, quando informado, deve usar `HH:MM` em formato 24 horas.

## Teste rapido com curl

Use este comando local para validar o endpoint depois de subir a API:

```bash
KEY=$(grep '^HORUS_GPT_ACTION_KEY=' .env | cut -d= -f2 | tr -d '"')

curl -i http://127.0.0.1:3001/api/gpt-actions/plans \
  -H "Content-Type: application/json" \
  -H "x-horus-action-key: $KEY" \
  --data '{
    "briefing": "Teste local da action",
    "goal": {
      "title": "Validar GPT Actions",
      "description": "Garantir publicacao estruturada",
      "category": "test",
      "priority": "LOW"
    },
    "plan": {
      "title": "Plano de validacao local",
      "description": "Criar rotina simples para teste",
      "planningHorizon": "weekly",
      "routines": [
        {
          "name": "Teste",
          "frequencyType": "daily",
          "timePreference": "morning",
          "tasks": [
            {
              "title": "Conferir endpoint",
              "description": "Validar criacao fim a fim",
              "priority": "LOW",
              "difficulty": "LOW",
              "estimatedMinutes": 15,
              "context": "test",
              "scheduledDayOffset": 0,
              "dueDayOffset": 1,
              "scheduledTime": "09:00"
            }
          ]
        }
      ]
    }
  }'
```
