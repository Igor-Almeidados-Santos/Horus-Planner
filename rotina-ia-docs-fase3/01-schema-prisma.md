# Schema inicial do Prisma

Abaixo está um schema inicial orientado ao MVP.

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum GoalStatus {
  DRAFT
  ACTIVE
  PAUSED
  COMPLETED
  ARCHIVED
}

enum PlanStatus {
  DRAFT
  ACTIVE
  PAUSED
  ARCHIVED
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  PAUSED
  BLOCKED
  DONE
  CANCELED
  ARCHIVED
}

enum PriorityLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DifficultyLevel {
  VERY_LOW
  LOW
  MEDIUM
  HIGH
  VERY_HIGH
}

enum RecommendationStatus {
  OPEN
  APPLIED
  DISMISSED
  ARCHIVED
}

enum ReviewType {
  DAILY
  WEEKLY
  MONTHLY
}

model User {
  id              String           @id @default(cuid())
  name            String
  email           String           @unique
  passwordHash    String
  createdAt       DateTime         @default(now())
  updatedAt       DateTime         @updatedAt

  profile         Profile?
  goals           Goal[]
  plans           Plan[]
  executionLogs   ExecutionLog[]
  reviews         Review[]
  recommendations Recommendation[]
  agentSessions   AgentSession[]
}

model Profile {
  id              String   @id @default(cuid())
  userId          String   @unique
  timezone        String?
  language        String?
  energyPattern   String?
  workStyle       String?
  studyStyle      String?
  sleepSchedule   String?
  preferencesJson Json?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Goal {
  id            String       @id @default(cuid())
  userId        String
  title         String
  description   String?
  category      String?
  priority      PriorityLevel @default(MEDIUM)
  status        GoalStatus   @default(DRAFT)
  startDate     DateTime?
  targetDate    DateTime?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  plans         Plan[]
}

model Plan {
  id              String      @id @default(cuid())
  userId          String
  goalId          String?
  title           String
  description     String?
  version         Int         @default(1)
  status          PlanStatus  @default(DRAFT)
  planningHorizon String?
  source          String?
  createdByAgent  Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  user            User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  goal            Goal?       @relation(fields: [goalId], references: [id], onDelete: SetNull)
  routines        Routine[]
  tasks           Task[]
  reviews         Review[]
  recommendations Recommendation[]
}

model Routine {
  id              String   @id @default(cuid())
  planId          String
  name            String
  description     String?
  frequencyType   String?
  frequencyRule   String?
  timePreference  String?
  context         String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  plan            Plan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  tasks           Task[]
}

model Task {
  id                String          @id @default(cuid())
  planId            String
  routineId         String?
  parentTaskId      String?
  title             String
  description       String?
  category          String?
  priority          PriorityLevel   @default(MEDIUM)
  difficulty        DifficultyLevel @default(MEDIUM)
  status            TaskStatus      @default(TODO)
  estimatedMinutes  Int?
  dueDate           DateTime?
  scheduledDate     DateTime?
  context           String?
  energyRequired    String?
  orderIndex        Int?
  isArchived        Boolean         @default(false)
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  plan              Plan            @relation(fields: [planId], references: [id], onDelete: Cascade)
  routine           Routine?        @relation(fields: [routineId], references: [id], onDelete: SetNull)
  parentTask        Task?           @relation("TaskToSubtasks", fields: [parentTaskId], references: [id], onDelete: SetNull)
  subtasks          Task[]          @relation("TaskToSubtasks")
  executionLogs     ExecutionLog[]
  dependencies      TaskDependency[] @relation("TaskDependencies")
  dependentOn       TaskDependency[] @relation("TaskDependents")
}

model TaskDependency {
  id              String   @id @default(cuid())
  taskId          String
  dependsOnTaskId String
  createdAt       DateTime @default(now())

  task            Task     @relation("TaskDependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnTask   Task     @relation("TaskDependents", fields: [dependsOnTaskId], references: [id], onDelete: Cascade)

  @@unique([taskId, dependsOnTaskId])
}

model ExecutionLog {
  id                 String    @id @default(cuid())
  userId             String
  taskId             String
  startedAt          DateTime?
  endedAt            DateTime?
  actualMinutes      Int?
  status             TaskStatus?
  difficultyReported DifficultyLevel?
  focusScore         Int?
  notes              String?
  createdAt          DateTime  @default(now())

  user               User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  task               Task      @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model Review {
  id              String     @id @default(cuid())
  userId          String
  planId          String?
  reviewType      ReviewType
  periodStart     DateTime
  periodEnd       DateTime
  completionRate  Float?
  adherenceRate   Float?
  observations    String?
  createdAt       DateTime   @default(now())

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan            Plan?      @relation(fields: [planId], references: [id], onDelete: SetNull)
}

model Recommendation {
  id                  String               @id @default(cuid())
  userId              String
  planId              String?
  source              String?
  title               String
  description         String?
  recommendationType  String?
  status              RecommendationStatus @default(OPEN)
  createdAt           DateTime             @default(now())

  user                User                 @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan                Plan?                @relation(fields: [planId], references: [id], onDelete: SetNull)
}

model AgentSession {
  id              String   @id @default(cuid())
  userId          String
  inputSummary    String?
  outputSummary   String?
  contextSnapshot Json?
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

## Observações de implementação

- O campo `version` em `Plan` deve ser incrementado sempre que houver mudança estrutural relevante.
- `Task.isArchived` preserva histórico sem perda de dados.
- `ExecutionLog` é a base da mensuração real do sistema.
- Dependências entre tarefas estão isoladas em `TaskDependency` para dar flexibilidade.
