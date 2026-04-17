# Payloads e Contratos

## Exemplo de payload entre agente e API

```json
{
  "userId": "123",
  "goal": {
    "title": "Organizar rotina completa semanal",
    "description": "Planejar estudos, trabalho, treino e vida pessoal"
  },
  "constraints": {
    "availableHoursPerDay": 8,
    "fixedCommitments": ["faculdade", "trabalho"],
    "energyPattern": "alta pela manhã"
  },
  "plan": {
    "horizon": "weekly",
    "routines": [
      {
        "name": "Estudo",
        "frequency": "daily",
        "tasks": [
          {
            "title": "Revisar JavaScript",
            "estimatedMinutes": 90,
            "priority": "high",
            "difficulty": "medium"
          }
        ]
      }
    ]
  }
}
```

## Regra arquitetural

O texto bruto do agente não deve ser o dado principal persistido. Tudo precisa ser convertido em contratos estruturados.
