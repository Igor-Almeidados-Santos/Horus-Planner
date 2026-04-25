# Mestre Horus GPT Builder Checklist

## Campos principais

- Name: `Mestre Horus Planner`
- Description: usar `docs/mestre-horus-gpt-description.txt`
- Instructions: usar `docs/mestre-horus-gpt-instructions.txt`
- Conversation starters: usar `docs/mestre-horus-gpt-conversation-starters.txt`

## Action

- Authentication: `API Key`
- API key location: `Custom header`
- Header name: `x-horus-action-key`
- API key value: mesmo valor de `HORUS_GPT_ACTION_KEY` no `.env`
- Schema URL: mesma URL de `GPT_ACTIONS_PUBLIC_URL` + `/api/gpt-actions/openapi.json`
- Operation esperada: `publishPlanningToHorus`

## URL atual do projeto

- `GPT_ACTIONS_PUBLIC_URL`: `https://tintless-debasedly-tina.ngrok-free.dev`
- Schema URL atual: `https://tintless-debasedly-tina.ngrok-free.dev/api/gpt-actions/openapi.json`

## Validacao final

- Confirmar que a API local esta rodando
- Confirmar que a schema URL abre no navegador
- Confirmar que a chave da action no GPT Builder bate com o `.env`
- Testar com `docs/mestre-horus-gpt-test-message.txt`
- Confirmar que o GPT so publica apos aprovacao explicita

## Manutencao

- Se o ngrok mudar, atualizar `GPT_ACTIONS_PUBLIC_URL` no `.env`
- Reiniciar a API
- Atualizar a Schema URL dentro do GPT Builder
