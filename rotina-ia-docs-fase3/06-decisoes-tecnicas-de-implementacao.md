# Decisões técnicas de implementação

## 1. API orientada a domínio
A API deve refletir o comportamento do negócio, não apenas tabelas.

## 2. Versionamento de plano
Mudanças estruturais geram nova versão em `Plan.version`.

## 3. Soft archive em tarefas
Evitar exclusão física para preservar histórico operacional.

## 4. DTOs separados por camada
- input DTOs
- response DTOs
- internal domain mappers

## 5. Validação forte na borda
Use `class-validator` e `class-transformer` na API.

## 6. Métricas calculadas no backend
O frontend deve exibir; o backend deve consolidar e calcular.

## 7. Integração com agente via payload estruturado
Nada de persistir instrução solta como principal unidade de domínio.
