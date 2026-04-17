export const primaryNavigation = [
  { href: "/", label: "Dashboard" },
  { href: "/goals", label: "Objetivos" },
  { href: "/plans", label: "Planos" },
  { href: "/execution", label: "Execucao" },
  { href: "/review", label: "Revisao" },
];

export interface WorkspaceData {
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
  taskTable: Array<{
    name: string;
    date: string;
    effort: string;
    impact: string;
    priority: number;
    course: string;
  }>;
  resourceItems: Array<{ title: string; tag: string; source: string; status: string }>;
  notes: Array<{ title: string; excerpt: string; category: string; date: string }>;
  goalCards: Array<{
    title: string;
    status: string;
    priority: string;
    progress: number;
    detail: string;
  }>;
  planOverview: Array<{
    title: string;
    meta: string;
    items: string[];
  }>;
  executionSteps: Array<{ label: string; value: string }>;
  reviewMetrics: Array<{ label: string; value: string }>;
  weeklyBottlenecks: string[];
  recommendations: string[];
  calendarDays: Array<{
    label: string;
    date: string;
    focus: string;
    items: Array<{
      id: string;
      title: string;
      time: string;
      track: string;
      status: string;
      tone: "high" | "medium" | "soft";
    }>;
  }>;
  calendarInbox: Array<{
    id: string;
    title: string;
    detail: string;
    source: string;
  }>;
}

export const defaultWorkspaceData: WorkspaceData = {
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
  taskTable: [
    { name: "Sample Task", date: "September 1, 2026", effort: "High", impact: "Low", priority: 1, course: "Chemistry" },
    { name: "Sample Task", date: "September 1, 2026", effort: "Medium", impact: "High", priority: 4, course: "Biology" },
    { name: "Sample Task", date: "September 1, 2026", effort: "Low", impact: "Medium", priority: 4, course: "English" },
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
  goalCards: [
    {
      title: "Organizar semestre com alto desempenho",
      status: "Ativo",
      priority: "Alta",
      progress: 72,
      detail: "Estudos, entregas, revisao semanal e energia pessoal em equilibrio.",
    },
    {
      title: "Consolidar rotina sustentavel",
      status: "Ativo",
      priority: "Media",
      progress: 61,
      detail: "Transformar planejamento em execucao consistente com baixa friccao.",
    },
  ],
  planOverview: [
    {
      title: "Plano Semanal Base",
      meta: "Versao 3 · semanal · origem agente",
      items: ["Deep study", "Assignments", "Review and reflection"],
    },
    {
      title: "Blocos principais",
      meta: "Manha, tarde e fechamento",
      items: ["Estudo profundo", "Trabalho operacional", "Flashcards e journal"],
    },
  ],
  executionSteps: [
    { label: "Tarefa atual", value: "Research" },
    { label: "Status", value: "Em progresso" },
    { label: "Tempo corrido", value: "00:42" },
    { label: "Proxima acao", value: "Finalizar referencias e consolidar sintese" },
  ],
  reviewMetrics: [
    { label: "Conclusao", value: "74%" },
    { label: "Aderencia", value: "69%" },
    { label: "Tarefas adiadas", value: "5" },
    { label: "Bloqueadas", value: "2" },
  ],
  weeklyBottlenecks: [
    "Subestimacao de tarefas de estudo.",
    "Carga noturna ainda muito alta.",
    "Atividades longas demais para um unico bloco.",
  ],
  recommendations: [
    "Reduzir a noite para revisao leve e journal.",
    "Quebrar tarefas de 90+ minutos em blocos menores.",
    "Reforcar blocos de alta energia pela manha.",
  ],
  calendarDays: [
    {
      label: "Sex",
      date: "17 Apr",
      focus: "Deep work",
      items: [
        { id: "cal-1", title: "Research", time: "09:00", track: "Biology", status: "Em progresso", tone: "medium" },
        { id: "cal-2", title: "Flashcards", time: "15:00", track: "Review", status: "Concluida", tone: "soft" },
      ],
    },
    {
      label: "Sab",
      date: "18 Apr",
      focus: "Formulas",
      items: [
        { id: "cal-3", title: "Formula Derivation", time: "08:30", track: "Math", status: "Bloqueada", tone: "high" },
      ],
    },
    {
      label: "Dom",
      date: "19 Apr",
      focus: "Revisao",
      items: [
        { id: "cal-4", title: "Weekly Review Draft", time: "18:00", track: "System", status: "Planejada", tone: "soft" },
      ],
    },
    { label: "Seg", date: "20 Apr", focus: "Chemistry", items: [] },
    { label: "Ter", date: "21 Apr", focus: "Essay", items: [] },
    { label: "Qua", date: "22 Apr", focus: "Agent sync", items: [] },
    { label: "Qui", date: "23 Apr", focus: "Buffer", items: [] },
  ],
  calendarInbox: [
    { id: "inbox-1", title: "Reduzir carga da noite", detail: "Mover tarefas densas para o inicio do dia.", source: "Agente GPT" },
    { id: "inbox-2", title: "Quebrar tarefa longa", detail: "Dividir Formula Derivation em 2 blocos de 55 min.", source: "Planejamento" },
  ],
};
