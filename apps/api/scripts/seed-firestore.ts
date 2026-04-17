import { config as loadEnv } from "dotenv";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const envCandidates = [
  resolve(process.cwd(), ".env"),
  resolve(process.cwd(), "../../.env"),
  resolve(process.cwd(), "../.env"),
];

for (const envPath of envCandidates) {
  if (existsSync(envPath)) {
    loadEnv({ path: envPath });
    break;
  }
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  throw new Error("Firebase env vars are missing");
}

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    projectId,
  });
}

const db = getFirestore();
const userId = process.env.DEFAULT_FIREBASE_USER_ID ?? "user_001";
const now = new Date().toISOString();

async function seed() {
  const batch = db.batch();

  batch.set(db.collection("users").doc(userId), {
    id: userId,
    email: "student@horus.dev",
    name: "Horus Student",
    avatarLabel: "HS",
    createdAt: now,
    updatedAt: now,
  });

  batch.set(db.collection("profiles").doc("profile_001"), {
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
  });

  const goals = [
    {
      id: "goal_001",
      userId,
      title: "Organizar semestre com alto desempenho",
      description: "Equilibrar estudo, rotina, revisao e execucao diaria.",
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
      title: "Criar sistema de rotina sustentavel",
      description: "Transformar planejamento em execucao consistente.",
      category: "life_management",
      priority: "MEDIUM",
      status: "ACTIVE",
      progress: 61,
      targetDate: "2026-06-15",
      createdAt: now,
      updatedAt: now,
    },
  ];

  const plans = [
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

  const routines = [
    {
      id: "routine_001",
      userId,
      planId: "plan_001",
      name: "Deep study",
      description: "Sessoes de estudo com foco e revisao ativa.",
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
      description: "Entregas, tarefas e revisoes praticas.",
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

  const tasks = [
    {
      id: "task_001",
      userId,
      planId: "plan_001",
      routineId: "routine_001",
      title: "Essay Writing",
      description: "Refinar introducao e conclusao do ensaio principal.",
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
      description: "Pesquisar referencias para o capitulo de biologia.",
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
      description: "Revisar derivacao e resolver tres exercicios.",
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
      description: "Criar cartoes com repeticao espacada.",
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
  ];

  const executionLogs = [
    {
      id: "exec_001",
      userId,
      taskId: "task_002",
      status: "IN_PROGRESS",
      actualMinutes: 25,
      focusScore: 8,
      notes: "Boa concentracao, faltam as referencias finais.",
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
      notes: "Flashcards finalizados e prontos para revisao.",
      startedAt: "2026-04-17T15:00:00.000Z",
      endedAt: "2026-04-17T15:33:00.000Z",
      createdAt: now,
    },
  ];

  const reviews = [
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

  const recommendations = [
    {
      id: "rec_001",
      userId,
      planId: "plan_001",
      title: "Reduzir carga da noite",
      description: "Mover tarefas densas para manha e inicio da tarde.",
      status: "OPEN",
      createdAt: now,
    },
    {
      id: "rec_002",
      userId,
      planId: "plan_001",
      title: "Fragmentar blocos de estudo longos",
      description: "Dividir sessoes de 120 minutos em 2 blocos de 55 minutos.",
      status: "OPEN",
      createdAt: now,
    },
  ];

  const workspaceSnapshot = {
    id: "workspace_001",
    userId,
    updatedAt: now,
    data: {
      quickActions: ["Nova avaliacao", "Nova tarefa", "Novo journal entry", "Novo recurso", "Novo evento"],
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
      ],
      resourceItems: [
        { title: "Financial mistakes", tag: "Finance", source: "twitter.com", status: "Not Seen" },
        { title: "How to be more productive", tag: "Productivity", source: "youtube.com", status: "Not Seen" },
      ],
      notes: [
        {
          title: "Organic chemistry molecules",
          excerpt: "Organic chemistry studies the structure and reactions of carbon compounds.",
          category: "Organic chem",
          date: "August 31, 2026 4:24 PM",
        },
        {
          title: "Basics of descriptive algebra",
          excerpt: "Algebra uses symbols and letters to represent quantities and equations.",
          category: "Algebra notes",
          date: "August 31, 2026 8:17 PM",
        },
      ],
    },
  };

  for (const item of goals) batch.set(db.collection("goals").doc(item.id), item);
  for (const item of plans) batch.set(db.collection("plans").doc(item.id), item);
  for (const item of routines) batch.set(db.collection("routines").doc(item.id), item);
  for (const item of tasks) batch.set(db.collection("tasks").doc(item.id), item);
  for (const item of executionLogs) batch.set(db.collection("executionLogs").doc(item.id), item);
  for (const item of reviews) batch.set(db.collection("reviews").doc(item.id), item);
  for (const item of recommendations) batch.set(db.collection("recommendations").doc(item.id), item);
  batch.set(db.collection("workspaceSnapshots").doc(workspaceSnapshot.id), workspaceSnapshot);

  await batch.commit();
  console.log("Firestore seed concluido para", userId);
}

void seed();
