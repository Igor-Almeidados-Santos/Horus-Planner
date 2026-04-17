export type GoalStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
export type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "DONE"
  | "CANCELED"
  | "ARCHIVED";
export type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type DifficultyLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarLabel: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  status: GoalStatus;
  progress: number;
  targetDate?: string;
}

export interface Plan {
  id: string;
  title: string;
  description: string;
  version: number;
  status: PlanStatus;
  planningHorizon: string;
  source: string;
  createdByAgent: boolean;
}

export interface Routine {
  id: string;
  planId: string;
  name: string;
  description: string;
  frequencyType: string;
  timePreference: string;
}

export interface Task {
  id: string;
  planId: string;
  routineId?: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledDate?: string;
  dueDate?: string;
  subject?: string;
}

export interface ExecutionLog {
  id: string;
  taskId: string;
  status: TaskStatus;
  actualMinutes: number;
  focusScore: number;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
}

export interface ReviewSummary {
  id: string;
  reviewType: "DAILY" | "WEEKLY" | "MONTHLY";
  periodLabel: string;
  completionRate: number;
  adherenceRate: number;
  observations: string[];
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  status: "OPEN" | "APPLIED" | "DISMISSED" | "ARCHIVED";
}

