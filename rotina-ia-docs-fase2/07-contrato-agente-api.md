# Contrato Inicial entre Agente e API

O agente não deve mandar texto solto. Deve mandar estrutura previsível.

## Exemplo de payload
```json
{
  "userId": "user_001",
  "goal": {
    "title": "Organizar rotina semanal completa",
    "description": "Planejar estudos, trabalho, saúde e organização pessoal",
    "category": "life_management",
    "priority": "high"
  },
  "constraints": {
    "availableHoursPerDay": 8,
    "fixedCommitments": [
      "faculdade",
      "trabalho"
    ],
    "energyPattern": "morning_peak"
  },
  "plan": {
    "title": "Plano Semanal Base",
    "description": "Rotina organizada para alta execução",
    "planningHorizon": "weekly",
    "routines": [
      {
        "name": "Estudo",
        "frequencyType": "daily",
        "timePreference": "morning",
        "tasks": [
          {
            "title": "Revisar JavaScript",
            "description": "Estudo focado de fundamentos",
            "priority": "high",
            "difficulty": "medium",
            "estimatedMinutes": 90,
            "context": "deep_work"
          }
        ]
      }
    ]
  }
}
```
