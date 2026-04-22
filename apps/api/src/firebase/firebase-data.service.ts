import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { FirebaseAdminService } from "./firebase-admin.service";

type GoalStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
type PlanStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "DONE"
  | "CANCELED"
  | "ARCHIVED";
type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type DifficultyLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

interface UserRecord {
  id: string;
  email: string;
  name: string;
  avatarLabel: string;
  createdAt: string;
  updatedAt: string;
}

interface ProfileRecord {
  id: string;
  userId: string;
  timezone: string;
  language: string;
  energyPattern: string;
  workStyle: string;
  studyStyle?: string;
  sleepSchedule?: string;
  preferences?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

interface GoalRecord {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  status: GoalStatus;
  progress: number;
  targetDate: string;
  createdAt: string;
  updatedAt: string;
}

interface PlanRecord {
  id: string;
  userId: string;
  goalId?: string;
  title: string;
  description: string;
  version: number;
  status: PlanStatus;
  planningHorizon: string;
  source: string;
  createdByAgent: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RoutineRecord {
  id: string;
  userId: string;
  planId: string;
  name: string;
  description: string;
  frequencyType: string;
  timePreference: string;
  createdAt: string;
  updatedAt: string;
}

interface TaskRecord {
  id: string;
  userId: string;
  planId: string;
  routineId?: string;
  title: string;
  description: string;
  category: string;
  priority: PriorityLevel;
  difficulty: DifficultyLevel;
  status: TaskStatus;
  estimatedMinutes: number;
  scheduledDate: string;
  scheduledTime?: string;
  dueDate: string;
  subject: string;
  createdAt: string;
  updatedAt: string;
}

interface ExecutionRecord {
  id: string;
  userId: string;
  taskId: string;
  status: TaskStatus;
  actualMinutes: number;
  focusScore: number;
  notes?: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

interface ReviewRecord {
  id: string;
  userId: string;
  planId?: string;
  reviewType: "DAILY" | "WEEKLY" | "MONTHLY";
  periodLabel: string;
  completionRate: number;
  adherenceRate: number;
  observations: string[];
  createdAt: string;
}

interface RecommendationRecord {
  id: string;
  userId: string;
  planId?: string;
  title: string;
  description: string;
  status: "OPEN" | "APPLIED" | "DISMISSED" | "ARCHIVED";
  createdAt: string;
}

interface AgentSessionRecord {
  id: string;
  userId: string;
  inputSummary?: string;
  outputSummary?: string;
  contextSnapshot?: Record<string, unknown>;
  createdAt: string;
}

interface WorkspaceSnapshotRecord {
  id: string;
  userId: string;
  data: {
    quickActions: string[];
    managementLinks: string[];
    directoryLinks: string[];
    trackerLinks: string[];
    agendaEvents: Array<{ name: string; date: string; status: string }>;
    habits: string[];
    readingList: Array<{ title: string; progress: string; percent: number }>;
    classStats: Array<{ name: string; assignments: number; progress: number; tasksLeft: number }>;
    timetable: Array<{
      time: string;
      mon: string;
      tue: string;
      wed: string;
      thu: string;
      fri: string;
      sat: string;
    }>;
    assessments: Array<{ title: string; subject: string; dueDate: string; daysLeft: string }>;
    assignmentsTable: Array<{
      overdue: string;
      name: string;
      type: string;
      status: string;
      course: string;
      dueDate: string;
    }>;
    resourceItems: Array<{ title: string; tag: string; source: string; status: string }>;
    notes: Array<{ title: string; excerpt: string; category: string; date: string }>;
  };
  updatedAt: string;
}

interface AgentPlanPayload {
  briefing?: string;
  goal: {
    title: string;
    description?: string;
    category?: string;
    priority?: PriorityLevel;
  };
  plan: {
    title: string;
    description?: string;
    planningHorizon?: string;
    routines?: Array<{
      name: string;
      frequencyType?: string;
      timePreference?: string;
      tasks?: Array<{
        title: string;
        description?: string;
        priority?: PriorityLevel;
        difficulty?: DifficultyLevel;
        estimatedMinutes?: number;
        context?: string;
        scheduledDayOffset?: number;
        dueDayOffset?: number;
        scheduledTime?: string;
      }>;
    }>;
  };
}

@Injectable()
export class FirebaseDataService {
  constructor(private readonly firebaseAdmin: FirebaseAdminService) {}

  private now() {
    return new Date().toISOString();
  }

  private db() {
    return this.firebaseAdmin.getFirestore();
  }

  private auth() {
    return this.firebaseAdmin.getAuth();
  }

  private collection<T>(name: string) {
    return this.db().collection(name);
  }

  private async getDoc<T>(collectionName: string, id: string): Promise<T> {
    const snapshot = await this.collection<T>(collectionName).doc(id).get();
    if (!snapshot.exists) {
      throw new NotFoundException(`${collectionName} ${id} not found`);
    }

    return snapshot.data() as T;
  }

  private async listByUser<T extends { userId: string }>(collectionName: string, userId: string): Promise<T[]> {
    const snapshot = await this.collection<T>(collectionName).where("userId", "==", userId).get();
    return snapshot.docs.map((doc) => doc.data() as T);
  }

  private async listByField<T>(collectionName: string, field: string, value: string): Promise<T[]> {
    const snapshot = await this.collection<T>(collectionName).where(field, "==", value).get();
    return snapshot.docs.map((doc) => doc.data() as T);
  }

  private async setDoc<T extends { id: string }>(collectionName: string, value: T) {
    await this.collection<T>(collectionName).doc(value.id).set(value);
    return value;
  }

  private async ensureUserProfileExists(payload: {
    userId: string;
    email: string;
    name: string;
  }) {
    const now = this.now();
    const userRef = this.collection<UserRecord>("users").doc(payload.userId);
    const currentUser = await userRef.get();

    if (!currentUser.exists) {
      const user: UserRecord = {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        avatarLabel: this.buildAvatarLabel(payload.name),
        createdAt: now,
        updatedAt: now,
      };

      await userRef.set(user);
    }

    const profiles = await this.listByField<ProfileRecord>("profiles", "userId", payload.userId);
    if (!profiles.length) {
      const profile: ProfileRecord = {
        id: randomUUID(),
        userId: payload.userId,
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        energyPattern: "morning_peak",
        workStyle: "deep_work",
        studyStyle: "active_recall",
        sleepSchedule: "23:00-07:00",
        preferences: { onboardingCompleted: false },
        createdAt: now,
        updatedAt: now,
      };

      await this.setDoc("profiles", profile);
    }
  }

  private async updateDoc<T extends { id: string }>(
    collectionName: string,
    id: string,
    payload: Partial<T>,
  ) {
    const reference = this.collection<T>(collectionName).doc(id);
    const current = await reference.get();
    if (!current.exists) {
      throw new NotFoundException(`${collectionName} ${id} not found`);
    }

    const nextValue = {
      ...(current.data() as T),
      ...payload,
    };
    await reference.set(nextValue);
    return nextValue;
  }

  private getDefaultUserId() {
    return process.env.DEFAULT_FIREBASE_USER_ID ?? "user_001";
  }

  private buildAvatarLabel(name: string) {
    return name
      .split(" ")
      .map((part) => part[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  private formatWeekLabel(date: Date) {
    const start = new Date(date);
    const day = start.getUTCDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + diffToMonday);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    const formatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
    return `${formatter.format(start)} - ${formatter.format(end)}`;
  }

  private sortByCreatedAtDesc<T extends { createdAt: string }>(items: T[]) {
    return [...items].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  }

  private getTimePreferenceRank(timePreference?: string) {
    switch (timePreference) {
      case "morning":
        return 0;
      case "afternoon":
        return 1;
      case "night":
        return 2;
      default:
        return 3;
    }
  }

  private buildTaskTimeLabel(input: {
    timePreference?: string;
    estimatedMinutes: number;
    priority: PriorityLevel;
  }) {
    const preference = input.timePreference ?? "morning";
    const isLong = input.estimatedMinutes >= 90;
    const isHighPriority = input.priority === "HIGH" || input.priority === "CRITICAL";

    if (preference === "morning") {
      return isHighPriority ? "08:00" : isLong ? "09:30" : "10:30";
    }

    if (preference === "afternoon") {
      return isHighPriority ? "13:30" : isLong ? "15:00" : "16:30";
    }

    if (preference === "night") {
      return isHighPriority ? "18:30" : isLong ? "19:30" : "20:30";
    }

    return isHighPriority ? "14:00" : "18:00";
  }

  private buildTaskWindowLabel(timePreference?: string) {
    switch (timePreference) {
      case "morning":
        return "Manha";
      case "afternoon":
        return "Tarde";
      case "night":
        return "Noite";
      default:
        return "Flexivel";
    }
  }

  private buildDefaultScheduledTime(input: {
    timePreference?: string;
    estimatedMinutes: number;
    priority: PriorityLevel;
  }) {
    return this.buildTaskTimeLabel(input);
  }

  private normalizeFirebaseAuthError(error: unknown) {
    const code =
      typeof error === "object" && error !== null && "code" in error ? String(error.code) : "";
    const message =
      typeof error === "object" && error !== null && "message" in error ? String(error.message) : "";

    if (code.includes("email-already-exists")) {
      return new ConflictException("EMAIL_EXISTS");
    }

    if (code.includes("invalid-password")) {
      return new BadRequestException("INVALID_PASSWORD");
    }

    if (code.includes("invalid-email")) {
      return new BadRequestException("INVALID_EMAIL");
    }

    if (code.includes("missing-password")) {
      return new BadRequestException("MISSING_PASSWORD");
    }

    return new BadRequestException(message || "FIREBASE_AUTH_ERROR");
  }

  private async ensureDemoWorkspace(userId: string) {
    const userDoc = await this.collection<UserRecord>("users").doc(userId).get();
    if (userDoc.exists) {
      return;
    }

    const now = this.now();
    const user: UserRecord = {
      id: userId,
      email: "student@horus.dev",
      name: "Horus Student",
      avatarLabel: "HS",
      createdAt: now,
      updatedAt: now,
    };

    const profile: ProfileRecord = {
      id: "profile_001",
      userId,
      timezone: "America/Sao_Paulo",
      language: "pt-BR",
      energyPattern: "morning_peak",
      workStyle: "deep_work",
      studyStyle: "active_recall",
      sleepSchedule: "23:00-07:00",
      preferences: {
        theme: "brown_editorial",
      },
      createdAt: now,
      updatedAt: now,
    };

    const goals: GoalRecord[] = [
      {
        id: "goal_001",
        userId,
        title: "Organizar semestre com alto desempenho",
        description: "Equilibrar estudo, rotina, revisão e execução diária.",
        category: "academic",
        priority: "HIGH",
        status: "ACTIVE",
        progress: 72,
        targetDate: "2026-07-30",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "goal_002",
        userId,
        title: "Criar sistema de rotina sustentável",
        description: "Transformar planejamento em execução consistente.",
        category: "life_management",
        priority: "MEDIUM",
        status: "ACTIVE",
        progress: 61,
        targetDate: "2026-06-15",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const plans: PlanRecord[] = [
      {
        id: "plan_001",
        userId,
        goalId: "goal_001",
        title: "Plano Semanal Base",
        description: "Rotina organizada para estudos, entregas e energia pessoal.",
        version: 3,
        status: "ACTIVE",
        planningHorizon: "weekly",
        source: "agent",
        createdByAgent: true,
        createdAt: now,
        updatedAt: now,
      },
    ];

    const routines: RoutineRecord[] = [
      {
        id: "routine_001",
        userId,
        planId: "plan_001",
        name: "Deep study",
        description: "Sessões de estudo com foco e revisão ativa.",
        frequencyType: "daily",
        timePreference: "morning",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "routine_002",
        userId,
        planId: "plan_001",
        name: "Assignments",
        description: "Entregas, tarefas e revisões práticas.",
        frequencyType: "daily",
        timePreference: "afternoon",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "routine_003",
        userId,
        planId: "plan_001",
        name: "Review and reflection",
        description: "Flashcards, journal e fechamento do dia.",
        frequencyType: "daily",
        timePreference: "night",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const tasks: TaskRecord[] = [
      {
        id: "task_001",
        userId,
        planId: "plan_001",
        routineId: "routine_001",
        title: "Essay Writing",
        description: "Refinar introdução e conclusão do ensaio principal.",
        category: "assignment",
        priority: "HIGH",
        difficulty: "HIGH",
        status: "TODO",
        estimatedMinutes: 90,
        scheduledDate: "2026-04-17",
        dueDate: "2026-04-21",
        subject: "Chemistry",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_002",
        userId,
        planId: "plan_001",
        routineId: "routine_002",
        title: "Research",
        description: "Pesquisar referências para o capítulo de biologia.",
        category: "assignment",
        priority: "MEDIUM",
        difficulty: "MEDIUM",
        status: "IN_PROGRESS",
        estimatedMinutes: 60,
        scheduledDate: "2026-04-17",
        dueDate: "2026-04-19",
        subject: "Biology",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_003",
        userId,
        planId: "plan_001",
        routineId: "routine_001",
        title: "Formula Derivation",
        description: "Revisar derivação e resolver três exercícios.",
        category: "deep_work",
        priority: "HIGH",
        difficulty: "VERY_HIGH",
        status: "BLOCKED",
        estimatedMinutes: 120,
        scheduledDate: "2026-04-18",
        dueDate: "2026-04-20",
        subject: "Math",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_004",
        userId,
        planId: "plan_001",
        routineId: "routine_003",
        title: "Biology Chapter 1 Flashcards",
        description: "Criar cartões com repetição espaçada.",
        category: "review",
        priority: "MEDIUM",
        difficulty: "LOW",
        status: "DONE",
        estimatedMinutes: 35,
        scheduledDate: "2026-04-17",
        dueDate: "2026-04-17",
        subject: "Biology",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: "task_005",
        userId,
        planId: "plan_001",
        routineId: "routine_003",
        title: "Weekly Review Draft",
        description: "Consolidar progresso e gargalos da semana.",
        category: "review",
        priority: "MEDIUM",
        difficulty: "LOW",
        status: "TODO",
        estimatedMinutes: 40,
        scheduledDate: "2026-04-19",
        dueDate: "2026-04-19",
        subject: "System",
        createdAt: now,
        updatedAt: now,
      },
    ];

    const executionLogs: ExecutionRecord[] = [
      {
        id: "exec_001",
        userId,
        taskId: "task_002",
        status: "IN_PROGRESS",
        actualMinutes: 25,
        focusScore: 8,
        notes: "Boa concentração, faltam as referências finais.",
        startedAt: "2026-04-17T18:10:00.000Z",
        createdAt: now,
      },
      {
        id: "exec_002",
        userId,
        taskId: "task_004",
        status: "DONE",
        actualMinutes: 33,
        focusScore: 9,
        notes: "Flashcards finalizados e prontos para revisão.",
        startedAt: "2026-04-17T15:00:00.000Z",
        endedAt: "2026-04-17T15:33:00.000Z",
        createdAt: now,
      },
    ];

    const reviews: ReviewRecord[] = [
      {
        id: "review_001",
        userId,
        planId: "plan_001",
        reviewType: "WEEKLY",
        periodLabel: "Semana 15",
        completionRate: 74,
        adherenceRate: 69,
        observations: [
          "Carga noturna segue acima do ideal.",
          "Tarefas extensas precisam ser quebradas em subtarefas menores.",
        ],
        createdAt: now,
      },
    ];

    const recommendations: RecommendationRecord[] = [
      {
        id: "rec_001",
        userId,
        planId: "plan_001",
        title: "Reduzir carga da noite",
        description: "Mover tarefas densas para manhã e início da tarde.",
        status: "OPEN",
        createdAt: now,
      },
      {
        id: "rec_002",
        userId,
        planId: "plan_001",
        title: "Fragmentar blocos de estudo longos",
        description: "Dividir sessões de 120 minutos em 2 blocos de 55 minutos.",
        status: "OPEN",
        createdAt: now,
      },
    ];

    const workspaceSnapshot: WorkspaceSnapshotRecord = {
      id: "workspace_001",
      userId,
      updatedAt: now,
      data: {
        quickActions: [
          "Nova avaliacao",
          "Nova tarefa",
          "Novo journal entry",
          "Novo recurso",
          "Novo evento",
        ],
        managementLinks: [
          "Courses",
          "Semesters",
          "Assessments",
          "Tasks Manager",
          "Class Content Notes",
          "Agenda Events",
          "Focus Zone",
        ],
        directoryLinks: ["Resources", "Time Table", "Flashcards"],
        trackerLinks: [
          "Book Tracker",
          "Internships & Job",
          "Admission Tracker",
          "Habit Journal",
          "Finance Tracker",
        ],
        agendaEvents: [
          { name: "Grand Dinner", date: "September 1, 2026", status: "Event Today" },
          { name: "University Fest", date: "September 7, 2026", status: "Upcoming" },
        ],
        habits: [
          "Morning affirmations",
          "3 things I am grateful for",
          "Daily habits",
          "Wake up early",
          "Jog",
          "Cold shower",
          "Pray",
          "Read 10 pages",
        ],
        readingList: [
          { title: "4-Hour Work Week", progress: "On page 50 of 250", percent: 12 },
          { title: "Rich Dad Poor Dad", progress: "On page 90 of 200", percent: 25 },
        ],
        classStats: [
          { name: "English", assignments: 2, progress: 50, tasksLeft: 1 },
          { name: "Biology", assignments: 2, progress: 0, tasksLeft: 1 },
          { name: "Chemistry", assignments: 2, progress: 0, tasksLeft: 1 },
          { name: "Math", assignments: 3, progress: 33, tasksLeft: 0 },
        ],
        timetable: [
          { time: "9:00-10:00", mon: "English", tue: "", wed: "", thu: "Biology", fri: "English", sat: "" },
          { time: "10:00-11:00", mon: "", tue: "Math", wed: "Biology", thu: "", fri: "", sat: "" },
          { time: "11:00-12:00", mon: "Chemistry", tue: "", wed: "", thu: "Math", fri: "Biology", sat: "" },
        ],
        assessments: [
          { title: "Midterm Exam", subject: "Biology", dueDate: "September 8, 2026", daysLeft: "Due in 5 days" },
          { title: "Midterm Exam", subject: "English", dueDate: "September 9, 2026", daysLeft: "Due in 6 days" },
          { title: "Mid Term Exam", subject: "Math", dueDate: "September 8, 2026", daysLeft: "Due in 8 days" },
          { title: "Mid Term Exam", subject: "Chemistry", dueDate: "September 10, 2026", daysLeft: "Due in 9 days" },
        ],
        assignmentsTable: [
          {
            overdue: "2 Days Past Due",
            name: "Essay Writing",
            type: "Assignment",
            status: "Not started",
            course: "Biology",
            dueDate: "September 1, 2026",
          },
          {
            overdue: "2 Days Past Due",
            name: "Research",
            type: "Assignment",
            status: "In progress",
            course: "Chemistry",
            dueDate: "August 29, 2026",
          },
          {
            overdue: "9 Days Past Due",
            name: "Formula Derivation",
            type: "Assignment",
            status: "Not started",
            course: "Math",
            dueDate: "August 22, 2026",
          },
        ],
        resourceItems: [
          { title: "Financial mistakes", tag: "Finance", source: "twitter.com", status: "Not Seen" },
          { title: "How to be more productive", tag: "Productivity", source: "twitter.com", status: "Not Seen" },
          { title: "How to manage time", tag: "Productivity", source: "youtube.com", status: "Not Seen" },
          { title: "Perfect job", tag: "Job", source: "indeed.com", status: "Not Seen" },
        ],
        notes: [
          {
            title: "Organic chemistry molecules",
            excerpt:
              "Organic chemistry studies the structure, properties, composition, reactions and preparation of carbon-containing compounds.",
            category: "Organic chem",
            date: "August 31, 2026 4:24 PM",
          },
          {
            title: "The cells involved in the body",
            excerpt:
              "Cell biology examines the structure and function of the basic unit of life, including membranes, nuclei and regulation.",
            category: "Science of Human Mind",
            date: "August 31, 2026 4:24 PM",
          },
          {
            title: "Basics of descriptive algebra",
            excerpt:
              "Algebra is a branch of mathematics that uses symbols and letters to represent numbers in formulas and equations.",
            category: "Algebra notes",
            date: "August 31, 2026 8:17 PM",
          },
        ],
      },
    };

    const batch = this.db().batch();
    batch.set(this.collection<UserRecord>("users").doc(user.id), user);
    batch.set(this.collection<ProfileRecord>("profiles").doc(profile.id), profile);
    goals.forEach((item) => batch.set(this.collection<GoalRecord>("goals").doc(item.id), item));
    plans.forEach((item) => batch.set(this.collection<PlanRecord>("plans").doc(item.id), item));
    routines.forEach((item) => batch.set(this.collection<RoutineRecord>("routines").doc(item.id), item));
    tasks.forEach((item) => batch.set(this.collection<TaskRecord>("tasks").doc(item.id), item));
    executionLogs.forEach((item) =>
      batch.set(this.collection<ExecutionRecord>("executionLogs").doc(item.id), item),
    );
    reviews.forEach((item) => batch.set(this.collection<ReviewRecord>("reviews").doc(item.id), item));
    recommendations.forEach((item) =>
      batch.set(this.collection<RecommendationRecord>("recommendations").doc(item.id), item),
    );
    batch.set(
      this.collection<WorkspaceSnapshotRecord>("workspaceSnapshots").doc(workspaceSnapshot.id),
      workspaceSnapshot,
    );
    await batch.commit();
  }

  async resolveUserId(authorization?: string, explicitUserId?: string) {
    if (explicitUserId) {
      await this.ensureDemoWorkspace(explicitUserId);
      return explicitUserId;
    }

    if (authorization?.startsWith("Bearer ")) {
      const token = authorization.replace("Bearer ", "").trim();
      if (!token) {
        throw new UnauthorizedException("Empty bearer token");
      }

      const decoded = await this.auth().verifyIdToken(token);
      await this.ensureDemoWorkspace(decoded.uid);
      return decoded.uid;
    }

    const userId = this.getDefaultUserId();
    await this.ensureDemoWorkspace(userId);
    return userId;
  }

  async register(payload: { name: string; email: string; password: string }) {
    try {
      const now = this.now();
      const authUser = await this.auth().createUser({
        email: payload.email,
        password: payload.password,
        displayName: payload.name,
      });

      const user: UserRecord = {
        id: authUser.uid,
        email: payload.email,
        name: payload.name,
        avatarLabel: this.buildAvatarLabel(payload.name),
        createdAt: now,
        updatedAt: now,
      };

      const profile: ProfileRecord = {
        id: randomUUID(),
        userId: authUser.uid,
        timezone: "America/Sao_Paulo",
        language: "pt-BR",
        energyPattern: "morning_peak",
        workStyle: "deep_work",
        studyStyle: "active_recall",
        sleepSchedule: "23:00-07:00",
        preferences: { onboardingCompleted: false },
        createdAt: now,
        updatedAt: now,
      };

      await this.setDoc("users", user);
      await this.setDoc("profiles", profile);

      const result = {
        user,
        profile,
        message:
          "Usuario criado no Firebase Auth e perfil salvo no Firestore. Use o token do Firebase no frontend para sessoes autenticadas.",
      };

      try {
        const session = await this.login({
          email: payload.email,
          password: payload.password,
        });

        return {
          ...result,
          accessToken: session.accessToken,
          refreshToken: session.refreshToken,
          expiresIn: session.expiresIn,
        };
      } catch {
        return result;
      }
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw this.normalizeFirebaseAuthError(error);
    }
  }

  async login(payload: { email: string; password: string }) {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      throw new UnauthorizedException(
        "FIREBASE_WEB_API_KEY nao configurada. Login por senha exige a Web API Key do Firebase Auth.",
      );
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: payload.email,
          password: payload.password,
          returnSecureToken: true,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as { error?: { message?: string } };
      throw new UnauthorizedException(error.error?.message ?? "Falha no login Firebase");
    }

    const data = (await response.json()) as {
      localId: string;
      email: string;
      idToken: string;
      refreshToken: string;
      expiresIn: string;
    };

    const authUser = await this.auth().getUser(data.localId);
    const profileName = authUser.displayName?.trim() || data.email.split("@")[0] || "Usuario";
    await this.ensureUserProfileExists({
      userId: data.localId,
      email: data.email,
      name: profileName,
    });

    const user = await this.getCurrentUser(data.localId);

    return {
      user,
      accessToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  }

  async loginWithGoogle(credential: string) {
    const apiKey = process.env.FIREBASE_WEB_API_KEY;
    if (!apiKey) {
      throw new UnauthorizedException(
        "FIREBASE_WEB_API_KEY nao configurada. Login com Google exige a Web API Key do Firebase Auth.",
      );
    }

    const response = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          postBody: `id_token=${encodeURIComponent(credential)}&providerId=google.com`,
          requestUri: "http://localhost",
          returnSecureToken: true,
          returnIdpCredential: true,
        }),
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as { error?: { message?: string } };
      throw new UnauthorizedException(error.error?.message ?? "Falha no login Google");
    }

    const data = (await response.json()) as {
      localId: string;
      email: string;
      displayName?: string;
      idToken: string;
      refreshToken: string;
      expiresIn: string;
    };

    const displayName = data.displayName?.trim() || data.email.split("@")[0] || "Usuario";
    await this.ensureUserProfileExists({
      userId: data.localId,
      email: data.email,
      name: displayName,
    });

    const user = await this.getCurrentUser(data.localId);

    return {
      user,
      accessToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.getDoc<UserRecord>("users", userId);
    const profiles = await this.listByField<ProfileRecord>("profiles", "userId", userId);
    return {
      ...user,
      profile: profiles[0] ?? null,
    };
  }

  async updateCurrentProfile(
    userId: string,
    payload: Partial<
      Pick<
        ProfileRecord,
        "timezone" | "language" | "energyPattern" | "workStyle" | "studyStyle" | "sleepSchedule"
      >
    > & { onboardingCompleted?: boolean },
  ) {
    const profiles = await this.listByField<ProfileRecord>("profiles", "userId", userId);
    const profile = profiles[0];

    if (!profile) {
      throw new NotFoundException(`profile for user ${userId} not found`);
    }

    const preferences = {
      ...(profile.preferences ?? {}),
      ...(payload.onboardingCompleted !== undefined
        ? { onboardingCompleted: payload.onboardingCompleted }
        : {}),
    };

    await this.updateDoc<ProfileRecord>("profiles", profile.id, {
      timezone: payload.timezone ?? profile.timezone,
      language: payload.language ?? profile.language,
      energyPattern: payload.energyPattern ?? profile.energyPattern,
      workStyle: payload.workStyle ?? profile.workStyle,
      studyStyle: payload.studyStyle ?? profile.studyStyle,
      sleepSchedule: payload.sleepSchedule ?? profile.sleepSchedule,
      preferences,
      updatedAt: this.now(),
    });

    return this.getCurrentUser(userId);
  }

  async getGoals(userId: string) {
    return this.listByUser<GoalRecord>("goals", userId);
  }

  async getGoal(id: string) {
    return this.getDoc<GoalRecord>("goals", id);
  }

  async createGoal(
    userId: string,
    payload: Omit<GoalRecord, "id" | "userId" | "progress" | "createdAt" | "updatedAt"> & { progress?: number },
  ) {
    const now = this.now();
    const goal: GoalRecord = {
      id: randomUUID(),
      userId,
      progress: payload.progress ?? 0,
      createdAt: now,
      updatedAt: now,
      ...payload,
    };
    return this.setDoc("goals", goal);
  }

  async updateGoal(id: string, payload: Partial<Omit<GoalRecord, "id" | "userId" | "createdAt">>) {
    return this.updateDoc<GoalRecord>("goals", id, {
      ...payload,
      updatedAt: this.now(),
    });
  }

  async deleteGoal(id: string) {
    await this.collection<GoalRecord>("goals").doc(id).delete();
    return { success: true };
  }

  async getPlans(userId: string) {
    const plans = await this.listByUser<PlanRecord>("plans", userId);
    const routines = await this.listByUser<RoutineRecord>("routines", userId);
    const tasks = await this.listByUser<TaskRecord>("tasks", userId);

    return plans.map((plan) => ({
      ...plan,
      routinesCount: routines.filter((routine) => routine.planId === plan.id).length,
      tasksCount: tasks.filter((task) => task.planId === plan.id).length,
    }));
  }

  async getPlan(id: string) {
    const plan = await this.getDoc<PlanRecord>("plans", id);
    const routines = await this.listByField<RoutineRecord>("routines", "planId", id);
    const tasks = await this.listByField<TaskRecord>("tasks", "planId", id);
    return {
      ...plan,
      routines,
      tasks,
    };
  }

  async createPlan(
    userId: string,
    payload: Omit<PlanRecord, "id" | "userId" | "version" | "createdAt" | "updatedAt"> & {
      version?: number;
    },
  ) {
    const now = this.now();
    const plan: PlanRecord = {
      id: randomUUID(),
      userId,
      version: payload.version ?? 1,
      createdAt: now,
      updatedAt: now,
      ...payload,
    };
    return this.setDoc("plans", plan);
  }

  async updatePlan(id: string, payload: Partial<Omit<PlanRecord, "id" | "userId" | "createdAt">>) {
    const current = await this.getDoc<PlanRecord>("plans", id);
    const structuralFields: Array<keyof typeof payload> = ["title", "description", "planningHorizon", "source"];
    const versionIncrement = structuralFields.some((field) => payload[field] !== undefined) ? 1 : 0;

    return this.updateDoc<PlanRecord>("plans", id, {
      ...payload,
      version: current.version + versionIncrement,
      updatedAt: this.now(),
    });
  }

  async activatePlan(id: string) {
    const plan = await this.getDoc<PlanRecord>("plans", id);
    const plans = await this.listByUser<PlanRecord>("plans", plan.userId);
    await Promise.all(
      plans.map((item) =>
        this.updateDoc<PlanRecord>("plans", item.id, {
          status: item.id === id ? "ACTIVE" : item.status === "ACTIVE" ? "PAUSED" : item.status,
          updatedAt: this.now(),
        }),
      ),
    );
    return this.getPlan(id);
  }

  async archivePlan(id: string) {
    return this.updatePlan(id, { status: "ARCHIVED" });
  }

  async getRoutines(userId: string) {
    return this.listByUser<RoutineRecord>("routines", userId);
  }

  async getRoutine(id: string) {
    const routine = await this.getDoc<RoutineRecord>("routines", id);
    const tasks = await this.listByField<TaskRecord>("tasks", "routineId", id);
    return {
      ...routine,
      tasks,
    };
  }

  async createRoutine(
    userId: string,
    payload: Omit<RoutineRecord, "id" | "userId" | "createdAt" | "updatedAt">,
  ) {
    const now = this.now();
    const routine: RoutineRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
      ...payload,
    };
    return this.setDoc("routines", routine);
  }

  async updateRoutine(id: string, payload: Partial<Omit<RoutineRecord, "id" | "userId" | "createdAt">>) {
    return this.updateDoc<RoutineRecord>("routines", id, {
      ...payload,
      updatedAt: this.now(),
    });
  }

  async deleteRoutine(id: string) {
    await this.collection<RoutineRecord>("routines").doc(id).delete();
    return { success: true };
  }

  async getTasks(userId: string) {
    return this.listByUser<TaskRecord>("tasks", userId);
  }

  async getTask(id: string) {
    const task = await this.getDoc<TaskRecord>("tasks", id);
    const executionLogs = await this.listByField<ExecutionRecord>("executionLogs", "taskId", id);
    return {
      ...task,
      executionLogs,
    };
  }

  async createTask(
    userId: string,
    payload: Omit<TaskRecord, "id" | "userId" | "createdAt" | "updatedAt">,
  ) {
    const now = this.now();
    const task: TaskRecord = {
      id: randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now,
      ...payload,
    };
    return this.setDoc("tasks", task);
  }

  async updateTask(id: string, payload: Partial<Omit<TaskRecord, "id" | "userId" | "createdAt">>) {
    return this.updateDoc<TaskRecord>("tasks", id, {
      ...payload,
      updatedAt: this.now(),
    });
  }

  async updateTaskStatus(id: string, status: TaskStatus) {
    return this.updateTask(id, { status });
  }

  async deleteTask(id: string) {
    await this.collection<TaskRecord>("tasks").doc(id).delete();
    return { success: true };
  }

  async startExecution(userId: string, taskId: string, notes?: string) {
    await this.updateTaskStatus(taskId, "IN_PROGRESS");

    const execution: ExecutionRecord = {
      id: randomUUID(),
      userId,
      taskId,
      status: "IN_PROGRESS",
      actualMinutes: 0,
      focusScore: 0,
      notes,
      startedAt: this.now(),
      createdAt: this.now(),
    };

    return this.setDoc("executionLogs", execution);
  }

  async stopExecution(taskId: string, actualMinutes: number, notes?: string) {
    const entries = await this.listByField<ExecutionRecord>("executionLogs", "taskId", taskId);
    const active = entries.find((item) => !item.endedAt);
    if (!active) {
      throw new NotFoundException(`No active execution for task ${taskId}`);
    }

    const updated = await this.updateDoc<ExecutionRecord>("executionLogs", active.id, {
      endedAt: this.now(),
      actualMinutes,
      status: "DONE",
      notes: notes ?? active.notes,
    });

    await this.updateTaskStatus(taskId, "DONE");
    return updated;
  }

  async logExecution(
    userId: string,
    payload: Omit<ExecutionRecord, "id" | "userId" | "createdAt">,
  ) {
    const execution: ExecutionRecord = {
      id: randomUUID(),
      userId,
      createdAt: this.now(),
      ...payload,
    };
    return this.setDoc("executionLogs", execution);
  }

  async getExecutionsToday(userId: string) {
    const executions = await this.listByUser<ExecutionRecord>("executionLogs", userId);
    return executions.slice(0, 5);
  }

  async getExecutionsWeek(userId: string) {
    return this.listByUser<ExecutionRecord>("executionLogs", userId);
  }

  async getDashboardToday(userId: string) {
    const tasks = await this.listByUser<TaskRecord>("tasks", userId);
    const executionLogs = await this.listByUser<ExecutionRecord>("executionLogs", userId);
    const todayTasks = tasks.filter((task) => task.scheduledDate === "2026-04-17");
    const plannedMinutes = todayTasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const realizedMinutes = executionLogs.reduce((sum, log) => sum + log.actualMinutes, 0);
    const completed = todayTasks.filter((task) => task.status === "DONE").length;
    const inProgress = todayTasks.filter((task) => task.status === "IN_PROGRESS").length;

    return {
      date: "2026-04-17",
      tasksToday: todayTasks,
      stats: {
        total: todayTasks.length,
        completed,
        inProgress,
        adherence: 68,
        plannedMinutes,
        realizedMinutes,
      },
      highPriority: todayTasks.filter((task) => task.priority === "HIGH" || task.priority === "CRITICAL"),
    };
  }

  async getDashboardWeek(userId: string) {
    const tasks = await this.listByUser<TaskRecord>("tasks", userId);
    const recommendations = await this.listByUser<RecommendationRecord>("recommendations", userId);
    const reviews = await this.listByUser<ReviewRecord>("reviews", userId);
    const latestReview = this.sortByCreatedAtDesc(reviews)[0] ?? null;

    return {
      completionRate: 74,
      adherenceRate: 69,
      delayedTasks: 5,
      blockedTasks: tasks.filter((task) => task.status === "BLOCKED").length,
      weeklyReview: latestReview,
      recommendations: this.sortByCreatedAtDesc(recommendations),
    };
  }

  async getMetrics(userId: string) {
    const tasks = await this.listByUser<TaskRecord>("tasks", userId);
    const executionLogs = await this.listByUser<ExecutionRecord>("executionLogs", userId);
    const totalEstimated = tasks.reduce((sum, task) => sum + task.estimatedMinutes, 0);
    const totalActual = executionLogs.reduce((sum, log) => sum + log.actualMinutes, 0);

    return {
      completionRate: 74,
      adherenceRate: 69,
      focusAverage: executionLogs.length
        ? Number(
            (
              executionLogs.reduce((sum, execution) => sum + execution.focusScore, 0) / executionLogs.length
            ).toFixed(1),
          )
        : 0,
      estimatedVsActualRatio: totalEstimated ? Number((totalActual / totalEstimated).toFixed(2)) : 0,
      consistencyScore: 81,
    };
  }

  async getReviews(userId: string) {
    const reviews = await this.listByUser<ReviewRecord>("reviews", userId);
    return this.sortByCreatedAtDesc(reviews);
  }

  async generateWeeklyReview(userId: string, payload?: { planId?: string; periodLabel?: string }) {
    const [tasks, executionLogs, plans] = await Promise.all([
      this.listByUser<TaskRecord>("tasks", userId),
      this.listByUser<ExecutionRecord>("executionLogs", userId),
      this.listByUser<PlanRecord>("plans", userId),
    ]);

    const metrics = await this.getMetrics(userId);
    const now = new Date(`${this.now().slice(0, 10)}T12:00:00.000Z`);
    const activePlan = plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null;
    const planId = payload?.planId ?? activePlan?.id;
    const blockedTasks = tasks.filter((task) => task.status === "BLOCKED");
    const delayedTasks = tasks.filter((task) => task.status !== "DONE" && task.dueDate < this.now().slice(0, 10));
    const inProgressTasks = tasks.filter((task) => task.status === "IN_PROGRESS");
    const averageFocus =
      executionLogs.length > 0
        ? executionLogs.reduce((sum, execution) => sum + execution.focusScore, 0) / executionLogs.length
        : 0;

    const observations: string[] = [];
    if (blockedTasks.length > 0) {
      observations.push(`${blockedTasks.length} tarefas seguem bloqueadas e precisam de destravamento rapido.`);
    }

    if (delayedTasks.length > 0) {
      observations.push(`${delayedTasks.length} tarefas ficaram atrasadas e precisam ser redistribuidas.`);
    }

    if (metrics.estimatedVsActualRatio > 1.15) {
      observations.push("O tempo real gasto ficou acima do planejado em boa parte da semana.");
    } else if (metrics.estimatedVsActualRatio > 0 && metrics.estimatedVsActualRatio < 0.65) {
      observations.push("O planejamento parece superdimensionado para a execucao real atual.");
    }

    if (averageFocus > 0 && averageFocus < 6) {
      observations.push("O foco medio ficou baixo, sugerindo friccao ou contexto pouco favoravel.");
    }

    if (!observations.length) {
      observations.push("A semana ficou relativamente estavel, com espaco para pequenos ajustes de carga.");
    }

    const review: ReviewRecord = {
      id: randomUUID(),
      userId,
      planId,
      reviewType: "WEEKLY",
      periodLabel: payload?.periodLabel?.trim() || this.formatWeekLabel(now),
      completionRate: metrics.completionRate,
      adherenceRate: metrics.adherenceRate,
      observations,
      createdAt: this.now(),
    };

    await this.setDoc("reviews", review);

    const recommendationsToCreate: Array<Pick<RecommendationRecord, "title" | "description" | "status">> = [];

    if (blockedTasks.length > 0) {
      recommendationsToCreate.push({
        title: "Destravar tarefas bloqueadas",
        description: "Mapear impedimentos e mover os itens bloqueados para blocos menores ou dependencias claras.",
        status: "OPEN",
      });
    }

    if (delayedTasks.length > 0) {
      recommendationsToCreate.push({
        title: "Redistribuir tarefas atrasadas",
        description: "Levar tarefas vencidas para os primeiros blocos do dia e reduzir a carga noturna.",
        status: "OPEN",
      });
    }

    if (metrics.estimatedVsActualRatio > 1.15 || metrics.estimatedVsActualRatio < 0.65) {
      recommendationsToCreate.push({
        title: "Recalibrar estimativas",
        description: "Ajustar duracao estimada das tarefas para reduzir desvio entre planejamento e execucao.",
        status: "OPEN",
      });
    }

    if (averageFocus > 0 && averageFocus < 6) {
      recommendationsToCreate.push({
        title: "Proteger blocos de foco",
        description: "Agrupar tarefas de alta energia em janelas com menos interrupcoes e contexto mais limpo.",
        status: "OPEN",
      });
    }

    if (!recommendationsToCreate.length) {
      recommendationsToCreate.push({
        title: "Consolidar o ritmo atual",
        description: "Manter a estrutura da semana e fazer apenas pequenos ajustes finos nas tarefas restantes.",
        status: "OPEN",
      });
    }

    const recommendations = await Promise.all(
      recommendationsToCreate.map((item) =>
        this.setDoc("recommendations", {
          id: randomUUID(),
          userId,
          planId,
          title: item.title,
          description: item.description,
          status: item.status,
          createdAt: this.now(),
        } satisfies RecommendationRecord),
      ),
    );

    return {
      review,
      recommendations,
    };
  }

  async getRecommendations(userId: string) {
    const recommendations = await this.listByUser<RecommendationRecord>("recommendations", userId);
    return this.sortByCreatedAtDesc(recommendations);
  }

  async updateRecommendationStatus(
    id: string,
    status: RecommendationRecord["status"],
  ) {
    return this.updateDoc<RecommendationRecord>("recommendations", id, {
      status,
    });
  }

  async getWorkspaceData(userId: string) {
    const [
      snapshotList,
      goals,
      plans,
      routines,
      tasks,
      executionLogs,
      reviews,
      recommendations,
    ] = await Promise.all([
      this.listByField<WorkspaceSnapshotRecord>("workspaceSnapshots", "userId", userId),
      this.listByUser<GoalRecord>("goals", userId),
      this.listByUser<PlanRecord>("plans", userId),
      this.listByUser<RoutineRecord>("routines", userId),
      this.listByUser<TaskRecord>("tasks", userId),
      this.listByUser<ExecutionRecord>("executionLogs", userId),
      this.listByUser<ReviewRecord>("reviews", userId),
      this.listByUser<RecommendationRecord>("recommendations", userId),
    ]);

    const snapshot = snapshotList[0];
    const activePlan = plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null;
    const routinesById = new Map(routines.map((routine) => [routine.id, routine]));
    const activePlanTasks = activePlan ? tasks.filter((task) => task.planId === activePlan.id) : tasks;
    const currentExecution =
      executionLogs.find((execution) => execution.status === "IN_PROGRESS") ?? executionLogs[0] ?? null;
    const currentTask = currentExecution
      ? tasks.find((task) => task.id === currentExecution.taskId)
      : tasks.find((task) => task.status === "IN_PROGRESS") ?? tasks[0] ?? null;
    const orderedReviews = this.sortByCreatedAtDesc(reviews);
    const orderedRecommendations = this.sortByCreatedAtDesc(recommendations);
    const latestReview = orderedReviews[0] ?? null;
    const todayIso = this.now().slice(0, 10);
    const delayedTasks = activePlanTasks.filter(
      (task) => task.status !== "DONE" && task.status !== "ARCHIVED" && task.dueDate < todayIso,
    );
    const relevantTaskDates = activePlanTasks
      .flatMap((task) => [task.scheduledDate, task.dueDate])
      .filter((value): value is string => Boolean(value))
      .sort();
    const baseDateIso =
      relevantTaskDates.find((date) => date >= todayIso) ?? relevantTaskDates[0] ?? todayIso;
    const baseDate = new Date(`${baseDateIso}T12:00:00.000Z`);
    const weekdayFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short" });
    const dayFormatter = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });
    const tasksByDate = activePlanTasks.reduce<Record<string, TaskRecord[]>>((accumulator, task) => {
      const key = task.scheduledDate || task.dueDate;
      if (!accumulator[key]) {
        accumulator[key] = [];
      }
      accumulator[key].push(task);
      return accumulator;
    }, {});

    const calendarDays = Array.from({ length: 7 }, (_, index) => {
      const currentDate = new Date(baseDate);
      currentDate.setUTCDate(baseDate.getUTCDate() + index);
      const isoDate = currentDate.toISOString().slice(0, 10);
      const dayTasks = (tasksByDate[isoDate] ?? [])
        .sort((left, right) => {
          const leftTime = left.scheduledTime ?? "";
          const rightTime = right.scheduledTime ?? "";
          if (leftTime && rightTime && leftTime !== rightTime) {
            return leftTime.localeCompare(rightTime);
          }

          if (leftTime && !rightTime) {
            return -1;
          }

          if (!leftTime && rightTime) {
            return 1;
          }

          const leftRoutine = left.routineId ? routinesById.get(left.routineId) : undefined;
          const rightRoutine = right.routineId ? routinesById.get(right.routineId) : undefined;
          const timePreferenceOrder =
            this.getTimePreferenceRank(leftRoutine?.timePreference) -
            this.getTimePreferenceRank(rightRoutine?.timePreference);

          if (timePreferenceOrder !== 0) {
            return timePreferenceOrder;
          }

          const priorityOrder: Record<PriorityLevel, number> = {
            CRITICAL: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
          };

          return priorityOrder[right.priority] - priorityOrder[left.priority];
        })
        .slice(0, 4);
      const planFocus =
        dayTasks[0]?.subject ??
        (index === 0 ? "Deep work" : index === 1 ? "Formulas" : index === 2 ? "Revisao" : "Rotina");

      return {
        label: weekdayFormatter.format(currentDate).replace(".", ""),
        date: dayFormatter.format(currentDate),
        focus: planFocus,
        items: dayTasks.map((task) => {
          const routine = task.routineId ? routinesById.get(task.routineId) : undefined;
          const timePreference = routine?.timePreference;

          return {
            id: task.id,
            title: task.title,
            time:
              task.scheduledTime ??
              this.buildTaskTimeLabel({
                timePreference,
                estimatedMinutes: task.estimatedMinutes,
                priority: task.priority,
              }),
            track: `${task.subject} · ${this.buildTaskWindowLabel(timePreference)}`,
            status:
              task.status === "IN_PROGRESS"
                ? "Em progresso"
                : task.status === "DONE"
                  ? "Concluida"
                  : task.status === "BLOCKED"
                    ? "Bloqueada"
                    : "Planejada",
            tone:
              task.priority === "CRITICAL" || task.priority === "HIGH"
                ? "high"
                : task.priority === "MEDIUM"
                  ? "medium"
                  : "soft",
          };
        }),
      };
    });

    const calendarInbox = orderedRecommendations.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      detail: item.description,
      source: item.planId ? "Agente GPT" : "Workspace",
    }));

    return {
      quickActions: snapshot?.data.quickActions ?? [],
      managementLinks: snapshot?.data.managementLinks ?? [],
      directoryLinks: snapshot?.data.directoryLinks ?? [],
      trackerLinks: snapshot?.data.trackerLinks ?? [],
      agendaEvents: snapshot?.data.agendaEvents ?? [],
      habits: snapshot?.data.habits ?? [],
      readingList: snapshot?.data.readingList ?? [],
      classStats: snapshot?.data.classStats ?? [],
      timetable: snapshot?.data.timetable ?? [],
      assessments: snapshot?.data.assessments ?? [],
      assignmentsTable: snapshot?.data.assignmentsTable ?? [],
      resourceItems: snapshot?.data.resourceItems ?? [],
      notes: snapshot?.data.notes ?? [],
      goalCards: goals.map((goal) => ({
        title: goal.title,
        status: goal.status === "ACTIVE" ? "Ativo" : goal.status,
        priority:
          goal.priority === "HIGH"
            ? "Alta"
            : goal.priority === "MEDIUM"
              ? "Media"
              : goal.priority === "CRITICAL"
                ? "Critica"
                : "Baixa",
        progress: goal.progress,
        detail: goal.description,
      })),
      planOverview: activePlan
        ? [
            {
              title: activePlan.title,
              meta: `Versao ${activePlan.version} · ${activePlan.planningHorizon} · origem ${activePlan.source}`,
              items: routines
                .filter((routine) => routine.planId === activePlan.id)
                .map((routine) => routine.name),
            },
            {
              title: "Blocos principais",
              meta: "Distribuicao do plano no dia",
              items: routines
                .filter((routine) => routine.planId === activePlan.id)
                .sort(
                  (left, right) =>
                    this.getTimePreferenceRank(left.timePreference) -
                    this.getTimePreferenceRank(right.timePreference),
                )
                .slice(0, 4)
                .map((routine) => `${this.buildTaskWindowLabel(routine.timePreference)} · ${routine.name}`),
            },
          ]
        : [],
      executionSteps: [
        { label: "Tarefa atual", value: currentTask?.title ?? "Sem tarefa ativa" },
        {
          label: "Status",
          value:
            currentTask?.status === "IN_PROGRESS"
              ? "Em progresso"
              : currentTask?.status === "DONE"
                ? "Concluida"
                : currentTask?.status ?? "Aguardando",
        },
        {
          label: "Tempo corrido",
          value: currentExecution ? `00:${String(currentExecution.actualMinutes).padStart(2, "0")}` : "00:00",
        },
        {
          label: "Proxima acao",
          value: currentTask?.description ?? "Definir proxima acao operacional",
        },
      ],
      reviewMetrics: [
        { label: "Conclusao", value: `${latestReview?.completionRate ?? 0}%` },
        { label: "Aderencia", value: `${latestReview?.adherenceRate ?? 0}%` },
        { label: "Tarefas adiadas", value: String(delayedTasks.length) },
        { label: "Bloqueadas", value: String(activePlanTasks.filter((task) => task.status === "BLOCKED").length) },
      ],
      weeklyBottlenecks: latestReview?.observations ?? [],
      recommendations: orderedRecommendations.map((item) => item.title),
      calendarDays,
      calendarInbox,
      taskTable: [...activePlanTasks]
        .sort((left, right) => left.scheduledDate.localeCompare(right.scheduledDate))
        .slice(0, 5)
        .map((task) => ({
          name: task.title,
          date: task.dueDate,
          effort:
            task.difficulty === "VERY_HIGH"
              ? "High"
              : task.difficulty === "HIGH"
                ? "High"
                : task.difficulty === "MEDIUM"
                  ? "Medium"
                  : "Low",
          impact:
            task.priority === "CRITICAL"
              ? "High"
              : task.priority === "HIGH"
                ? "High"
                : task.priority === "MEDIUM"
                  ? "Medium"
                  : "Low",
          priority:
            task.priority === "CRITICAL" ? 5 : task.priority === "HIGH" ? 4 : task.priority === "MEDIUM" ? 3 : 1,
          course: task.subject,
        })),
    };
  }

  async getAgentContext(userId: string) {
    const [user, goals, plans, routines, tasks, metrics, reviews, recommendations, sessions] = await Promise.all([
      this.getCurrentUser(userId),
      this.listByUser<GoalRecord>("goals", userId),
      this.listByUser<PlanRecord>("plans", userId),
      this.listByUser<RoutineRecord>("routines", userId),
      this.listByUser<TaskRecord>("tasks", userId),
      this.getMetrics(userId),
      this.listByUser<ReviewRecord>("reviews", userId),
      this.listByUser<RecommendationRecord>("recommendations", userId),
      this.listByUser<AgentSessionRecord>("agentSessions", userId),
    ]);

    const orderedReviews = this.sortByCreatedAtDesc(reviews);
    const orderedRecommendations = this.sortByCreatedAtDesc(recommendations);
    const orderedSessions = this.sortByCreatedAtDesc(sessions).slice(0, 8);

    return {
      userId,
      user,
      goals,
      activePlan: plans.find((plan) => plan.status === "ACTIVE") ?? null,
      routines,
      tasks,
      metrics,
      latestReview: orderedReviews[0] ?? null,
      recommendations: orderedRecommendations,
      recentSessions: orderedSessions.map((session) => ({
        id: session.id,
        inputSummary: session.inputSummary ?? "",
        outputSummary: session.outputSummary ?? "",
        createdAt: session.createdAt,
      })),
    };
  }

  async ingestAgentPlan(userId: string, payload: AgentPlanPayload) {
    const today = new Date(`${this.now().slice(0, 10)}T12:00:00.000Z`);
    const goalTargetDate = new Date(today);
    goalTargetDate.setUTCDate(today.getUTCDate() + 30);
    const goal = await this.createGoal(userId, {
      title: payload.goal.title,
      description: payload.goal.description ?? "Criado via payload estruturado do agente.",
      category: payload.goal.category ?? "agent_generated",
      priority: payload.goal.priority ?? "HIGH",
      status: "ACTIVE",
      targetDate: goalTargetDate.toISOString().slice(0, 10),
    });

    const plan = await this.createPlan(userId, {
      goalId: goal.id,
      title: payload.plan.title,
      description: payload.plan.description ?? "Plano estruturado automaticamente pelo agente.",
      status: "ACTIVE",
      planningHorizon: payload.plan.planningHorizon ?? "weekly",
      source: "agent",
      createdByAgent: true,
    });

    const routines = await Promise.all(
      (payload.plan.routines ?? []).map(async (routine, routineIndex) => {
        const createdRoutine = await this.createRoutine(userId, {
          planId: plan.id,
          name: routine.name,
          description: `Rotina criada pelo agente para ${routine.name}.`,
          frequencyType: routine.frequencyType ?? "daily",
          timePreference: routine.timePreference ?? "morning",
        });

        await Promise.all(
          (routine.tasks ?? []).map((task, taskIndex) => {
            const timePreference = routine.timePreference ?? "morning";
            const scheduledDate = new Date(today);
            scheduledDate.setUTCDate(
              today.getUTCDate() + (task.scheduledDayOffset ?? routineIndex + taskIndex),
            );
            const dueDate = new Date(scheduledDate);
            dueDate.setUTCDate(
              scheduledDate.getUTCDate() + Math.max(1, task.dueDayOffset ?? 2),
            );

            return this.createTask(userId, {
              planId: plan.id,
              routineId: createdRoutine.id,
              title: task.title,
              description: task.description ?? "Tarefa importada do agente.",
              category: task.context ?? "agent_generated",
              priority: task.priority ?? "MEDIUM",
              difficulty: task.difficulty ?? "MEDIUM",
              status: "TODO",
              estimatedMinutes: task.estimatedMinutes ?? 60,
              scheduledDate: scheduledDate.toISOString().slice(0, 10),
              scheduledTime:
                task.scheduledTime ??
                this.buildDefaultScheduledTime({
                  timePreference,
                  estimatedMinutes: task.estimatedMinutes ?? 60,
                  priority: task.priority ?? "MEDIUM",
                }),
              dueDate: dueDate.toISOString().slice(0, 10),
              subject: routine.name,
            });
          }),
        );

        return createdRoutine;
      }),
    );

    const session: AgentSessionRecord = {
      id: randomUUID(),
      userId,
      inputSummary: payload.briefing?.trim() || payload.goal.title,
      outputSummary: plan.title,
      contextSnapshot: {
        goalId: goal.id,
        planId: plan.id,
      },
      createdAt: this.now(),
    };
    await this.setDoc("agentSessions", session);

    const tasksCreated = (await this.listByField<TaskRecord>("tasks", "planId", plan.id)).length;

    return {
      goal,
      plan,
      routines,
      tasksCreated,
    };
  }

  async replan(userId: string, payload: { reason: string; planId?: string }) {
    const plans = await this.listByUser<PlanRecord>("plans", userId);
    const sourcePlan =
      (payload.planId ? plans.find((plan) => plan.id === payload.planId) : null) ??
      plans.find((plan) => plan.status === "ACTIVE") ??
      plans[0];

    if (!sourcePlan) {
      throw new NotFoundException(`No plan available for user ${userId}`);
    }

    const [sourceRoutines, sourceTasks] = await Promise.all([
      this.listByField<RoutineRecord>("routines", "planId", sourcePlan.id),
      this.listByField<TaskRecord>("tasks", "planId", sourcePlan.id),
    ]);

    const pendingTasks = sourceTasks
      .filter((task) => !["DONE", "ARCHIVED", "CANCELED"].includes(task.status))
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt));

    const nextVersion = sourcePlan.version + 1;
    const now = this.now();
    const newPlan = await this.createPlan(userId, {
      goalId: sourcePlan.goalId,
      title: `${sourcePlan.title} · Ajuste ${nextVersion}`,
      description: `${sourcePlan.description ?? "Plano reestruturado"} | Replanejado por motivo: ${payload.reason}`,
      status: "ACTIVE",
      planningHorizon: sourcePlan.planningHorizon,
      source: "agent_replan",
      createdByAgent: true,
      version: nextVersion,
    });

    const routineIdMap = new Map<string, string>();
    const clonedRoutines = await Promise.all(
      sourceRoutines.map(async (routine) => {
        const cloned = await this.createRoutine(userId, {
          planId: newPlan.id,
          name: routine.name,
          description: routine.description,
          frequencyType: routine.frequencyType,
          timePreference: routine.timePreference,
        });
        routineIdMap.set(routine.id, cloned.id);
        return cloned;
      }),
    );

    const baseDate = new Date(`${now.slice(0, 10)}T12:00:00.000Z`);
    const migratedTasks = await Promise.all(
      pendingTasks.map((task, index) => {
        const scheduledDate = new Date(baseDate);
        scheduledDate.setUTCDate(baseDate.getUTCDate() + index);
        const dueDate = new Date(scheduledDate);
        dueDate.setUTCDate(scheduledDate.getUTCDate() + 2);

        return this.createTask(userId, {
          planId: newPlan.id,
          routineId: task.routineId ? routineIdMap.get(task.routineId) : undefined,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.status === "BLOCKED" ? "HIGH" : task.priority,
          difficulty: task.difficulty,
          status: "TODO",
          estimatedMinutes: task.estimatedMinutes,
          scheduledDate: scheduledDate.toISOString().slice(0, 10),
          dueDate: dueDate.toISOString().slice(0, 10),
          subject: task.subject,
        });
      }),
    );

    await Promise.all(
      plans
        .filter((plan) => plan.status === "ACTIVE")
        .map((plan) =>
          this.updateDoc<PlanRecord>("plans", plan.id, {
            status: "PAUSED",
            updatedAt: now,
          }),
        ),
    );

    const recommendedActions: string[] = [
      `Nova versao ${nextVersion} criada a partir de "${sourcePlan.title}".`,
      pendingTasks.length
        ? `${pendingTasks.length} tarefas pendentes foram redistribuidas na nova versao.`
        : "Nao havia tarefas pendentes para migrar.",
      "A versao anterior foi preservada para historico e comparacao.",
    ];

    if (pendingTasks.some((task) => task.status === "BLOCKED")) {
      recommendedActions.push("Tarefas bloqueadas foram recolocadas como TODO com prioridade elevada.");
    }

    const session: AgentSessionRecord = {
      id: randomUUID(),
      userId,
      inputSummary: payload.reason,
      outputSummary: `Nova versao de plano criada: ${newPlan.title}`,
      contextSnapshot: {
        previousPlanId: sourcePlan.id,
        newPlanId: newPlan.id,
        previousVersion: sourcePlan.version,
        newVersion: nextVersion,
      },
      createdAt: now,
    };

    await this.setDoc("agentSessions", session);

    return {
      message: "Plano reavaliado e versionado com sucesso.",
      reason: payload.reason,
      recommendedActions,
      previousPlanId: sourcePlan.id,
      previousVersion: sourcePlan.version,
      planId: newPlan.id,
      newVersion: nextVersion,
      tasksMigrated: migratedTasks.length,
      routinesCloned: clonedRoutines.length,
    };
  }
}
