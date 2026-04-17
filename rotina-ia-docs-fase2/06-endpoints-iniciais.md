# Endpoints Iniciais da API

## Auth
```http
POST /auth/register
POST /auth/login
GET  /auth/me
```

## Goals
```http
POST /goals
GET  /goals
GET  /goals/:id
PATCH /goals/:id
DELETE /goals/:id
```

## Plans
```http
POST /plans
GET  /plans
GET  /plans/:id
PATCH /plans/:id
POST /plans/:id/activate
POST /plans/:id/archive
```

## Routines
```http
POST /routines
GET  /routines
GET  /routines/:id
PATCH /routines/:id
DELETE /routines/:id
```

## Tasks
```http
POST /tasks
GET  /tasks
GET  /tasks/:id
PATCH /tasks/:id
PATCH /tasks/:id/status
DELETE /tasks/:id
```

## Executions
```http
POST /executions/start
POST /executions/stop
POST /executions/log
GET  /executions/today
GET  /executions/week
```

## Dashboard
```http
GET /dashboard/today
GET /dashboard/week
GET /dashboard/metrics
```

## Agent
```http
POST /agent/plan
POST /agent/replan
GET  /agent/context/:userId
```
