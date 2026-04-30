import { defaultWorkspaceData, type WorkspaceData } from "../lib/workspace-data";
import { getClientAccessToken } from "../lib/auth-session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "DONE"
  | "CANCELED"
  | "ARCHIVED";

export type GoalStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarLabel?: string;
  createdAt?: string;
  updatedAt?: string;
  profile?: {
    id: string;
    timezone: string;
    language: string;
    energyPattern: string;
    workStyle: string;
    studyStyle?: string;
    sleepSchedule?: string;
    preferences?: {
      onboardingCompleted?: boolean;
    };
  } | null;
};

export type TaskRecord = {
  id: string;
  planId: string;
  routineId?: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  difficulty: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledDate: string;
  scheduledTime?: string;
  dueDate: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
};

export type PlanSummary = {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  version: number;
  planningHorizon?: string;
  source?: string;
  createdByAgent?: boolean;
  routinesCount: number;
  tasksCount: number;
};

export type RoutineRecord = {
  id: string;
  planId: string;
  name: string;
  description: string;
  frequencyType: string;
  timePreference: string;
  createdAt: string;
  updatedAt: string;
};

export type GoalRecord = {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: GoalStatus;
  progress: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewRecord = {
  id: string;
  planId?: string;
  reviewType: "DAILY" | "WEEKLY" | "MONTHLY";
  periodLabel: string;
  completionRate: number;
  adherenceRate: number;
  observations: string[];
  createdAt: string;
};

export type RecommendationRecord = {
  id: string;
  planId?: string;
  title: string;
  description: string;
  status: "OPEN" | "APPLIED" | "DISMISSED" | "ARCHIVED";
  createdAt: string;
};

export type ExecutionLog = {
  id: string;
  taskId: string;
  status: TaskStatus;
  actualMinutes: number;
  focusScore: number;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
};

export type CreateTaskInput = {
  planId: string;
  routineId?: string;
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  difficulty: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledDate: string;
  scheduledTime?: string;
  dueDate: string;
  subject: string;
};

export type UpdateTaskInput = Partial<CreateTaskInput>;

export type CreateGoalInput = {
  title: string;
  description: string;
  category: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: GoalStatus;
  progress?: number;
  targetDate: string;
};

export type UpdateGoalInput = Partial<CreateGoalInput>;

export type CreatePlanInput = {
  goalId?: string;
  title: string;
  description: string;
  status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
  planningHorizon: string;
  source: string;
  createdByAgent: boolean;
};

export type UpdatePlanInput = Partial<
  Pick<CreatePlanInput, "title" | "description" | "status" | "planningHorizon" | "source">
>;

export type CreateRoutineInput = {
  planId: string;
  name: string;
  description: string;
  frequencyType: string;
  timePreference: string;
};

export type UpdateRoutineInput = Partial<Omit<CreateRoutineInput, "planId">>;

export type AgentTaskInput = {
  title: string;
  description?: string;
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  difficulty?: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
  estimatedMinutes?: number;
  context?: string;
  scheduledDayOffset?: number;
  dueDayOffset?: number;
  scheduledTime?: string;
};

export type AgentRoutineInput = {
  name: string;
  frequencyType?: string;
  timePreference?: string;
  tasks?: AgentTaskInput[];
};

export type AgentPlanInput = {
  userId?: string;
  briefing?: string;
  goal?: {
    title?: string;
    description?: string;
    category?: string;
    priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  };
  constraints?: {
    availableHoursPerDay?: number;
    fixedCommitments?: string[];
    energyPattern?: string;
  };
  plan?: {
    title?: string;
    description?: string;
    planningHorizon?: string;
    routines?: AgentRoutineInput[];
  };
};

export type AgentMetrics = {
  tasksTotal: number;
  tasksDone: number;
  completionRate: number;
  estimatedVsActualRatio: number;
  consistencyScore: number;
};

export type AgentContext = {
  userId: string;
  user: AuthUser;
  goals: GoalRecord[];
  activePlan: (PlanSummary & { description?: string; planningHorizon?: string; source?: string }) | null;
  routines: Array<{
    id: string;
    planId: string;
    name: string;
    description: string;
    frequencyType: string;
    timePreference: string;
  }>;
  tasks: TaskRecord[];
  metrics: AgentMetrics;
  latestReview: {
    id: string;
    completionRate: number;
    adherenceRate: number;
    observations: string[];
    periodLabel: string;
  } | null;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
  }>;
  recentSessions?: Array<{
    id: string;
    inputSummary: string;
    outputSummary: string;
    createdAt: string;
  }>;
  assistant?: {
    enabled: boolean;
    provider: "openai" | "local";
    model: string;
  };
};

export type AgentPlanResult = {
  goal: GoalRecord;
  plan: PlanSummary;
  routines: Array<{
    id: string;
    planId: string;
    name: string;
    description: string;
    frequencyType: string;
    timePreference: string;
  }>;
  tasksCreated: number;
  generator: "openai" | "local";
  assistantNotes: string[];
  planningBlueprint: Required<Pick<AgentPlanInput, "goal" | "plan">> & {
    briefing?: string;
    constraints?: AgentPlanInput["constraints"];
  };
};

export type AgentChatInput = {
  message: string;
  hints?: {
    planningHorizon?: string;
    availableHoursPerDay?: number;
    fixedCommitments?: string[];
    energyPattern?: string;
    focusAreas?: string[];
  };
};

export type AgentChatResult = {
  assistantReply: string;
  actionType:
    | "create_plan"
    | "create_task"
    | "update_task"
    | "create_goal"
    | "update_goal"
    | "create_routine"
    | "replan"
    | "clarify"
    | "none";
  actionLabel: string;
  mutationSummary: string;
  planningBlueprint?: AgentPlanResult["planningBlueprint"];
  questions: string[];
  context: AgentContext;
};

export type AgentReplanResult = {
  message: string;
  reason: string;
  recommendedActions: string[];
  previousPlanId: string;
  previousVersion: number;
  planId: string;
  newVersion: number;
  tasksMigrated: number;
  routinesCloned: number;
  generator: "openai" | "local";
  assistantNotes: string[];
};

export type WeeklyReviewResult = {
  review: ReviewRecord;
  recommendations: RecommendationRecord[];
};

export type ApplyRecommendationResult = {
  recommendation: RecommendationRecord;
  replan: {
    message: string;
    reason: string;
    recommendedActions: string[];
    previousPlanId: string;
    previousVersion: number;
    planId: string;
    newVersion: number;
    tasksMigrated: number;
    routinesCloned: number;
  } | null;
  message: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
};

export type UpdateProfileInput = {
  timezone?: string;
  language?: string;
  energyPattern?: string;
  workStyle?: string;
  studyStyle?: string;
  sleepSchedule?: string;
  onboardingCompleted?: boolean;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
};

export type RegisterResponse =
  | {
      user: AuthUser;
      profile: AuthUser["profile"];
      message: string;
    }
  | (LoginResponse & {
      profile: AuthUser["profile"];
      message: string;
    });

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type ApiRequestOptions = RequestInit & {
  auth?: boolean;
  token?: string | null;
  timeoutMs?: number;
};

function resolveRequestTimeout(input?: ApiRequestOptions) {
  if (typeof input?.timeoutMs === "number" && input.timeoutMs > 0) {
    return input.timeoutMs;
  }

  const method = (input?.method ?? "GET").toUpperCase();
  return method === "GET" ? 8000 : 15000;
}

async function apiRequest<T>(path: string, init?: ApiRequestOptions): Promise<T> {
  const headers = new Headers(init?.headers);
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (init?.auth !== false) {
    const token = init?.token ?? getClientAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const controller = new AbortController();
  const timeoutMs = resolveRequestTimeout(init);
  const timeoutId =
    typeof timeoutMs === "number"
      ? setTimeout(() => controller.abort(new Error(`TIMEOUT_ERROR: ${path}`)), timeoutMs)
      : null;

  const externalSignal = init?.signal;
  const abortFromExternalSignal = () => {
    controller.abort(
      externalSignal?.reason instanceof Error
        ? externalSignal.reason
        : new Error(`REQUEST_ABORTED: ${path}`),
    );
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      abortFromExternalSignal();
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      ...init,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    const baseMessage = error instanceof Error && error.message ? error.message : "NETWORK_ERROR";
    const message = baseMessage.startsWith("TIMEOUT_ERROR:")
      ? baseMessage
      : `NETWORK_ERROR: ${baseMessage}`;
    throw new ApiError(message);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (externalSignal) {
      externalSignal.removeEventListener("abort", abortFromExternalSignal);
    }
  }

  if (!response.ok) {
    let message = `Request failed for ${path}`;

    try {
      const payload = (await response.json()) as { message?: string | string[]; error?: string };
      if (Array.isArray(payload.message)) {
        message = payload.message.join(", ");
      } else if (typeof payload.message === "string") {
        message = payload.message;
      } else if (typeof payload.error === "string") {
        message = payload.error;
      }
    } catch {
      // ignore JSON parsing errors and keep fallback message
    }

    throw new ApiError(message, response.status);
  }

  return (await response.json()) as T;
}

export async function fetchDashboardToday() {
  return apiRequest("/api/dashboard/today");
}

export async function fetchWorkspaceData(input?: {
  token?: string | null;
  allowDemoFallback?: boolean;
}): Promise<WorkspaceData> {
  try {
    return await apiRequest<WorkspaceData>("/api/dashboard/workspace", {
      token: input?.token,
      auth: true,
      timeoutMs: 4000,
    });
  } catch (error) {
    if (input?.allowDemoFallback) {
      return defaultWorkspaceData;
    }

    throw error;
  }
}

export function loginWithPassword(payload: LoginInput) {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export function loginWithGoogleCredential(credential: string) {
  return apiRequest<LoginResponse>("/api/auth/google", {
    method: "POST",
    body: JSON.stringify({ credential }),
    auth: false,
  });
}

export function registerAccount(payload: RegisterInput) {
  return apiRequest<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
    auth: false,
  });
}

export function fetchCurrentUser() {
  return apiRequest<AuthUser>("/api/auth/me");
}

export function updateCurrentProfile(payload: UpdateProfileInput) {
  return apiRequest<AuthUser>("/api/auth/profile", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function fetchTasks() {
  return apiRequest<TaskRecord[]>("/api/tasks");
}

export function fetchGoals() {
  return apiRequest<GoalRecord[]>("/api/goals");
}

export function fetchPlans() {
  return apiRequest<PlanSummary[]>("/api/plans");
}

export function fetchRoutines() {
  return apiRequest<RoutineRecord[]>("/api/routines");
}

export function fetchExecutionsToday() {
  return apiRequest<ExecutionLog[]>("/api/executions/today");
}

export function createTask(payload: CreateTaskInput) {
  return apiRequest<TaskRecord>("/api/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateTask(id: string, payload: UpdateTaskInput) {
  return apiRequest<TaskRecord>(`/api/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteTask(id: string) {
  return apiRequest<{ success: true }>(`/api/tasks/${id}`, {
    method: "DELETE",
  });
}

export function createGoal(payload: CreateGoalInput) {
  return apiRequest<GoalRecord>("/api/goals", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateGoal(id: string, payload: UpdateGoalInput) {
  return apiRequest<GoalRecord>(`/api/goals/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteGoal(id: string) {
  return apiRequest<{ success: true }>(`/api/goals/${id}`, {
    method: "DELETE",
  });
}

export function createPlan(payload: CreatePlanInput) {
  return apiRequest<PlanSummary>("/api/plans", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updatePlan(id: string, payload: UpdatePlanInput) {
  return apiRequest<PlanSummary>(`/api/plans/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function createRoutine(payload: CreateRoutineInput) {
  return apiRequest<RoutineRecord>("/api/routines", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateRoutine(id: string, payload: UpdateRoutineInput) {
  return apiRequest<RoutineRecord>(`/api/routines/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteRoutine(id: string) {
  return apiRequest<{ success: true }>(`/api/routines/${id}`, {
    method: "DELETE",
  });
}

export function activatePlan(id: string) {
  return apiRequest<PlanSummary>(`/api/plans/${id}/activate`, {
    method: "POST",
  });
}

export function archivePlan(id: string) {
  return apiRequest<PlanSummary>(`/api/plans/${id}/archive`, {
    method: "POST",
  });
}

export function updateTaskStatus(id: string, status: TaskStatus) {
  return apiRequest<TaskRecord>(`/api/tasks/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function startExecution(taskId: string, notes?: string) {
  return apiRequest<ExecutionLog>("/api/executions/start", {
    method: "POST",
    body: JSON.stringify({ taskId, notes }),
  });
}

export function stopExecution(taskId: string, actualMinutes?: number, notes?: string) {
  return apiRequest<ExecutionLog>("/api/executions/stop", {
    method: "POST",
    body: JSON.stringify({ taskId, actualMinutes, notes }),
  });
}

export function fetchAgentContext() {
  return apiRequest<AgentContext>("/api/agent/context");
}

export function createAgentPlan(payload: AgentPlanInput) {
  return apiRequest<AgentPlanResult>("/api/agent/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function sendAgentChatMessage(payload: AgentChatInput) {
  return apiRequest<AgentChatResult>("/api/agent/chat", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function requestAgentReplan(payload: { reason: string; planId?: string }) {
  return apiRequest<AgentReplanResult>("/api/agent/replan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function fetchReviews() {
  return apiRequest<ReviewRecord[]>("/api/reviews");
}

export function generateWeeklyReview(payload?: { planId?: string; periodLabel?: string }) {
  return apiRequest<WeeklyReviewResult>("/api/reviews/weekly", {
    method: "POST",
    body: JSON.stringify(payload ?? {}),
  });
}

export function fetchRecommendations() {
  return apiRequest<RecommendationRecord[]>("/api/recommendations");
}

export function updateRecommendationStatus(
  id: string,
  status: RecommendationRecord["status"],
) {
  return apiRequest<RecommendationRecord>(`/api/recommendations/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function applyRecommendation(id: string) {
  return apiRequest<ApplyRecommendationResult>(`/api/recommendations/${id}/apply`, {
    method: "POST",
  });
}
