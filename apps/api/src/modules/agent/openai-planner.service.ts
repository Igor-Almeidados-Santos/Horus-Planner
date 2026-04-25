import { Injectable, Logger } from "@nestjs/common";

type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type DifficultyLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";
type GoalStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
type TaskStatus =
  | "TODO"
  | "IN_PROGRESS"
  | "PAUSED"
  | "BLOCKED"
  | "DONE"
  | "CANCELED"
  | "ARCHIVED";

type AgentTaskInput = {
  title: string;
  description?: string;
  priority?: PriorityLevel;
  difficulty?: DifficultyLevel;
  estimatedMinutes?: number;
  context?: string;
  scheduledDayOffset?: number;
  dueDayOffset?: number;
  scheduledTime?: string;
};

type AgentRoutineInput = {
  name: string;
  frequencyType?: string;
  timePreference?: string;
  tasks?: AgentTaskInput[];
};

type AgentPlanInput = {
  title: string;
  description?: string;
  planningHorizon?: string;
  routines?: AgentRoutineInput[];
};

export type AgentPlanPayload = {
  goal?: {
    title: string;
    description?: string;
    category?: string;
    priority?: PriorityLevel;
  };
  constraints?: {
    availableHoursPerDay?: number;
    fixedCommitments?: string[];
    energyPattern?: string;
  };
  plan?: AgentPlanInput;
  briefing?: string;
};

export type NormalizedAgentPlanPayload = {
  goal: {
    title: string;
    description?: string;
    category?: string;
    priority?: PriorityLevel;
  };
  constraints?: AgentPlanPayload["constraints"];
  plan: {
    title: string;
    description?: string;
    planningHorizon?: string;
    routines?: AgentRoutineInput[];
  };
  briefing?: string;
};

type AgentContextSnapshot = {
  userId: string;
  user?: {
    name?: string;
    email?: string;
    profile?: {
      timezone?: string;
      language?: string;
      energyPattern?: string;
      workStyle?: string;
      studyStyle?: string;
      sleepSchedule?: string;
    } | null;
  };
  goals?: Array<{
    title: string;
    status: string;
    priority: string;
    progress: number;
    targetDate: string;
  }>;
  activePlan?: {
    id: string;
    title: string;
    description?: string;
    planningHorizon?: string;
    version?: number;
    source?: string;
  } | null;
  routines?: Array<{
    name: string;
    frequencyType: string;
    timePreference: string;
  }>;
  tasks?: Array<{
    title: string;
    subject: string;
    status: string;
    priority: string;
    dueDate: string;
    estimatedMinutes: number;
  }>;
  metrics?: {
    completionRate?: number;
    estimatedVsActualRatio?: number;
    consistencyScore?: number;
  };
  latestReview?: {
    periodLabel?: string;
    observations?: string[];
    completionRate?: number;
    adherenceRate?: number;
  } | null;
  recommendations?: Array<{
    title: string;
    description: string;
    status: string;
  }>;
};

type GeneratedAgentPlan = {
  assistantNotes: string[];
  goal: {
    title: string;
    description: string;
    category: string;
    priority: PriorityLevel;
  };
  plan: {
    title: string;
    description: string;
    planningHorizon: string;
    routines: Array<{
      name: string;
      frequencyType: string;
      timePreference: string;
      tasks: Array<{
        title: string;
        description: string;
        priority: PriorityLevel;
        difficulty: DifficultyLevel;
        estimatedMinutes: number;
        context: string;
        scheduledDayOffset: number;
        dueDayOffset: number;
        scheduledTime: string;
      }>;
    }>;
  };
};

type GeneratedReplanAdvice = {
  assistantNotes: string[];
  recommendedActions: string[];
};

export type AgentChatDecision = {
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
  targetId: string;
  targetTitle: string;
  reasonText: string;
  planBriefing: string;
  planningHorizon: string;
  availableHoursPerDay: number;
  fixedCommitments: string[];
  energyPattern: string;
  goalTitle: string;
  goalDescription: string;
  goalCategory: string;
  goalPriority: PriorityLevel;
  goalStatus: GoalStatus;
  goalTargetDate: string;
  taskTitle: string;
  taskDescription: string;
  taskSubject: string;
  taskPriority: PriorityLevel;
  taskDifficulty: DifficultyLevel;
  taskStatus: TaskStatus;
  estimatedMinutes: number;
  scheduledDate: string;
  scheduledTime: string;
  dueDate: string;
  routineName: string;
  routineDescription: string;
  routineFrequencyType: string;
  routineTimePreference: string;
  progress: number;
  questions: string[];
};

type OpenAiResponse = {
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<
      | {
          type?: string;
          text?: string;
        }
      | {
          type?: string;
          refusal?: string;
        }
    >;
  }>;
};

@Injectable()
export class OpenAiPlannerService {
  private readonly logger = new Logger(OpenAiPlannerService.name);
  private readonly planningInstructions = `
Voce e Mestre Horus, um assistente de rotina, planejamento e execucao.
Sua funcao e transformar objetivos, tarefas, compromissos e habitos em planos claros, realistas e utilizaveis no dia a dia.
Seu trabalho nao e apenas sugerir ideias, mas converter intencao em agenda pratica, ordem de acao e proximos passos viaveis.

Foco principal:
- organizar rotinas diarias, semanais e mensais
- distribuir tarefas com logica e equilibrio
- transformar metas em etapas executaveis
- encaixar trabalho, estudo, vida pessoal, saude e habitos na agenda
- adaptar planos diante de atrasos, imprevistos e dias ruins
- reduzir sobrecarga mental por meio de priorizacao clara
- manter consistencia sem montar rotinas irreais

Principios:
- seja especifico, operacional e direto
- seja realista: considere energia, cansaco, procrastinacao, deslocamento, alimentacao, pausas e limites humanos
- priorize utilidade pratica acima de completude
- simplifique quando houver excesso, confusao ou sobrecarga
- nunca entregue conselhos vagos
- nunca monte agendas lotadas, rigidas demais ou dificeis de sustentar
- nao assuma energia alta o dia inteiro
- nao repita motivacao generica

Hierarquia de decisao:
1. utilidade pratica
2. realismo
3. clareza
4. priorizacao
5. detalhamento

Como organizar o raciocinio:
1. entenda o contexto do usuario
2. identifique prioridades reais, restricoes de tempo e compromissos fixos
3. considere energia, esforco e urgencia
4. monte uma rotina, sequencia ou plano por blocos logicos
5. destaque o essencial
6. crie uma versao reduzida para imprevistos quando necessario
7. finalize com proximos passos ou ajustes

Regras praticas de planejamento:
- proteja o essencial antes do complementar
- quebre objetivos grandes em etapas pequenas e executaveis
- distribua tarefas por prioridade, esforco e impacto
- reserve espaco entre blocos quando fizer sentido
- em caso de atraso, reorganize o restante do dia em vez de repetir o plano original
- corte, adie ou reduza o que nao for essencial quando o dia estiver sobrecarregado
- evite inserir muitos habitos novos ao mesmo tempo
- ao encaixar habitos, associe-os a gatilhos ja existentes e comece com volume realista

Ao gerar o plano estruturado:
- responda sempre em portugues do Brasil
- gere um objetivo claro e um plano coerente com o briefing
- distribua as rotinas e tarefas com equilibrio ao longo dos proximos dias
- use scheduledDayOffset e dueDayOffset para influenciar o calendario real do sistema
- use scheduledTime no formato HH:MM para sugerir o horario principal de cada tarefa
- mantenha as tarefas concretas, curtas e acionaveis
- inclua contingencia e prioridades praticas dentro de assistantNotes
- prefira poucas tarefas boas a muitas tarefas irreais
  `.trim();

  normalizePlanPayload(payload: AgentPlanPayload): NormalizedAgentPlanPayload {
    const briefing = payload.briefing?.trim() || "";
    const goalTitle = payload.goal?.title?.trim() || (briefing ? "Planejamento gerado via chat" : "Objetivo assistido");
    const goalDescription =
      payload.goal?.description?.trim() ||
      (briefing
        ? `Briefing original do usuario: ${briefing}`
        : "Objetivo consolidado automaticamente pelo agente.");
    const planTitle =
      payload.plan?.title?.trim() ||
      (briefing ? "Plano completo gerado pelo GPT" : "Plano estruturado pelo agente");
    const planDescription =
      payload.plan?.description?.trim() ||
      (briefing
        ? `Plano estruturado a partir do briefing em linguagem natural enviado no chat.`
        : "Plano operacional estruturado automaticamente.");

    return {
      briefing: briefing || undefined,
      constraints: payload.constraints,
      goal: {
        title: goalTitle,
        description: goalDescription,
        category: payload.goal?.category?.trim() || "agent_workspace",
        priority: payload.goal?.priority || "HIGH",
      },
      plan: {
        title: planTitle,
        description: planDescription,
        planningHorizon: payload.plan?.planningHorizon || "weekly",
        routines: payload.plan?.routines ?? [],
      },
    };
  }

  getConfig() {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-5.2";
    const enabled = Boolean(process.env.OPENAI_API_KEY?.trim());

    return {
      enabled,
      provider: enabled ? "openai" : "local",
      model,
    } as const;
  }

  async enhancePlanDraft(input: { payload: NormalizedAgentPlanPayload; context: AgentContextSnapshot }) {
    if (!this.getConfig().enabled) {
      return null;
    }

    try {
      const compactContext = this.buildCompactContext(input.context);
      const generated = await this.createStructuredResponse<GeneratedAgentPlan>({
        name: "horus_agent_plan",
        instructions: this.planningInstructions,
        prompt: JSON.stringify(
          {
            requestType: "agent_plan",
            userBriefing: input.payload.briefing?.trim() || null,
            requestedGoal: input.payload.goal,
            requestedPlan: input.payload.plan,
            constraints: input.payload.constraints ?? null,
            currentWorkspace: compactContext,
          },
          null,
          2,
        ),
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["assistantNotes", "goal", "plan"],
          properties: {
            assistantNotes: {
              type: "array",
              items: { type: "string" },
            },
            goal: {
              type: "object",
              additionalProperties: false,
              required: ["title", "description", "category", "priority"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                category: { type: "string" },
                priority: {
                  type: "string",
                  enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                },
              },
            },
            plan: {
              type: "object",
              additionalProperties: false,
              required: ["title", "description", "planningHorizon", "routines"],
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                planningHorizon: {
                  type: "string",
                  enum: ["daily", "weekly", "biweekly", "monthly"],
                },
                routines: {
                  type: "array",
                  items: {
                    type: "object",
                    additionalProperties: false,
                    required: ["name", "frequencyType", "timePreference", "tasks"],
                    properties: {
                      name: { type: "string" },
                      frequencyType: {
                        type: "string",
                        enum: ["daily", "weekly", "flexible"],
                      },
                      timePreference: {
                        type: "string",
                        enum: ["morning", "afternoon", "night"],
                      },
                      tasks: {
                        type: "array",
                        items: {
                          type: "object",
                          additionalProperties: false,
                          required: [
                            "title",
                            "description",
                            "priority",
                            "difficulty",
                            "estimatedMinutes",
                            "context",
                            "scheduledDayOffset",
                            "dueDayOffset",
                            "scheduledTime",
                          ],
                          properties: {
                            title: { type: "string" },
                            description: { type: "string" },
                            priority: {
                              type: "string",
                              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
                            },
                            difficulty: {
                              type: "string",
                              enum: ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
                            },
                            estimatedMinutes: { type: "integer" },
                            context: { type: "string" },
                            scheduledDayOffset: { type: "integer" },
                            dueDayOffset: { type: "integer" },
                            scheduledTime: { type: "string" },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      return {
        assistantNotes: generated.assistantNotes.filter(Boolean).slice(0, 4),
        payload: this.mergePlanPayload(input.payload, generated),
      };
    } catch (error) {
      this.logger.warn(`OpenAI plan enhancement failed, falling back to local planner: ${this.stringifyError(error)}`);
      return null;
    }
  }

  async generateReplanAdvice(input: { reason: string; context: AgentContextSnapshot }) {
    if (!this.getConfig().enabled) {
      return null;
    }

    try {
      const compactContext = this.buildCompactContext(input.context);
      const generated = await this.createStructuredResponse<GeneratedReplanAdvice>({
        name: "horus_agent_replan",
        instructions:
          "Voce analisa sobrecarga academica e recomenda ajustes operacionais claros. Responda em portugues do Brasil, com foco em redistribuicao de carga, priorizacao e clareza de execucao.",
        prompt: JSON.stringify(
          {
            requestType: "agent_replan",
            reason: input.reason,
            currentWorkspace: compactContext,
          },
          null,
          2,
        ),
        schema: {
          type: "object",
          additionalProperties: false,
          required: ["assistantNotes", "recommendedActions"],
          properties: {
            assistantNotes: {
              type: "array",
              items: { type: "string" },
            },
            recommendedActions: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });

      return {
        assistantNotes: generated.assistantNotes.filter(Boolean).slice(0, 4),
        recommendedActions: generated.recommendedActions.filter(Boolean).slice(0, 5),
      };
    } catch (error) {
      this.logger.warn(`OpenAI replan advice failed, falling back to local planner: ${this.stringifyError(error)}`);
      return null;
    }
  }

  async interpretChatAction(input: {
    message: string;
    context: AgentContextSnapshot;
    hints?: {
      planningHorizon?: string;
      availableHoursPerDay?: number;
      fixedCommitments?: string[];
      energyPattern?: string;
      focusAreas?: string[];
    };
  }) {
    if (!this.getConfig().enabled) {
      return this.createLocalChatDecision(input);
    }

    try {
      const compactContext = this.buildCompactContext(input.context);
      return await this.createStructuredResponse<AgentChatDecision>({
        name: "horus_agent_chat",
        instructions: `
${this.planningInstructions}

Voce esta operando como um agente conversacional do sistema Horus Planner.
Sua funcao e ler a mensagem do usuario, decidir a melhor acao operacional e responder de forma curta, clara e acionavel.

Capacidades reais do sistema:
- criar um planejamento completo
- criar tarefa
- atualizar tarefa existente
- criar objetivo
- atualizar objetivo existente
- criar rotina
- replanejar um plano ativo
- pedir esclarecimento quando faltar contexto

Regras para escolha da acao:
- use create_plan quando o usuario pedir rotina, agenda, plano, organizacao completa ou distribuicao de estudos/trabalho
- use create_task para adicionar uma tarefa pontual
- use update_task para concluir, bloquear, remarcar ou alterar uma tarefa existente
- use create_goal para uma nova meta ou objetivo
- use update_goal para alterar status, progresso ou prazo de objetivo
- use create_routine para criar um bloco recorrente de rotina
- use replan quando o usuario pedir redistribuicao, reorganizacao ou novo ajuste de um plano existente
- use clarify quando faltar informacao critica para agir com utilidade
- use none quando a melhor resposta for apenas orientacao sem mutacao

Quando usar clarify:
- faca de 1 a 3 perguntas objetivas
- nao faca perguntas desnecessarias se der para inferir com seguranca

Sempre:
- responda em portugues do Brasil
- produza assistantReply como mensagem final para o usuario
- se houver mutacao, explique resumidamente o que sera feito ou foi feito
- preencha apenas os campos relevantes com conteudo forte; os irrelevantes podem ficar vazios ou neutros
        `.trim(),
        prompt: JSON.stringify(
          {
            requestType: "agent_chat",
            userMessage: input.message,
            hints: input.hints ?? {},
            currentWorkspace: compactContext,
          },
          null,
          2,
        ),
        schema: {
          type: "object",
          additionalProperties: false,
          required: [
            "assistantReply",
            "actionType",
            "actionLabel",
            "targetId",
            "targetTitle",
            "reasonText",
            "planBriefing",
            "planningHorizon",
            "availableHoursPerDay",
            "fixedCommitments",
            "energyPattern",
            "goalTitle",
            "goalDescription",
            "goalCategory",
            "goalPriority",
            "goalStatus",
            "goalTargetDate",
            "taskTitle",
            "taskDescription",
            "taskSubject",
            "taskPriority",
            "taskDifficulty",
            "taskStatus",
            "estimatedMinutes",
            "scheduledDate",
            "scheduledTime",
            "dueDate",
            "routineName",
            "routineDescription",
            "routineFrequencyType",
            "routineTimePreference",
            "progress",
            "questions",
          ],
          properties: {
            assistantReply: { type: "string" },
            actionType: {
              type: "string",
              enum: [
                "create_plan",
                "create_task",
                "update_task",
                "create_goal",
                "update_goal",
                "create_routine",
                "replan",
                "clarify",
                "none",
              ],
            },
            actionLabel: { type: "string" },
            targetId: { type: "string" },
            targetTitle: { type: "string" },
            reasonText: { type: "string" },
            planBriefing: { type: "string" },
            planningHorizon: { type: "string" },
            availableHoursPerDay: { type: "integer" },
            fixedCommitments: {
              type: "array",
              items: { type: "string" },
            },
            energyPattern: { type: "string" },
            goalTitle: { type: "string" },
            goalDescription: { type: "string" },
            goalCategory: { type: "string" },
            goalPriority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            },
            goalStatus: {
              type: "string",
              enum: ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"],
            },
            goalTargetDate: { type: "string" },
            taskTitle: { type: "string" },
            taskDescription: { type: "string" },
            taskSubject: { type: "string" },
            taskPriority: {
              type: "string",
              enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
            },
            taskDifficulty: {
              type: "string",
              enum: ["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"],
            },
            taskStatus: {
              type: "string",
              enum: ["TODO", "IN_PROGRESS", "PAUSED", "BLOCKED", "DONE", "CANCELED", "ARCHIVED"],
            },
            estimatedMinutes: { type: "integer" },
            scheduledDate: { type: "string" },
            scheduledTime: { type: "string" },
            dueDate: { type: "string" },
            routineName: { type: "string" },
            routineDescription: { type: "string" },
            routineFrequencyType: { type: "string" },
            routineTimePreference: { type: "string" },
            progress: { type: "integer" },
            questions: {
              type: "array",
              items: { type: "string" },
            },
          },
        },
      });
    } catch (error) {
      this.logger.warn(`OpenAI chat interpretation failed, falling back to local chat: ${this.stringifyError(error)}`);
      return this.createLocalChatDecision(input);
    }
  }

  private createLocalChatDecision(input: {
    message: string;
    hints?: {
      planningHorizon?: string;
      availableHoursPerDay?: number;
      fixedCommitments?: string[];
      energyPattern?: string;
      focusAreas?: string[];
    };
  }): AgentChatDecision {
    const message = input.message.trim();
    const normalized = message.toLowerCase();
    const today = new Date().toISOString().slice(0, 10);
    const focusSubject = input.hints?.focusAreas?.[0] ?? "";
    const defaultReply =
      "Estou com o modo local ativo porque a OpenAI nao respondeu agora. Ainda posso te orientar e registrar acoes simples; para raciocinio completo, ajuste a quota da chave da OpenAI.";

    const decision = this.emptyChatDecision({
      assistantReply: message ? `${defaultReply} Entendi: ${message}` : defaultReply,
      actionType: "none",
      actionLabel: "Resposta local",
      planningHorizon: input.hints?.planningHorizon ?? "weekly",
      availableHoursPerDay: input.hints?.availableHoursPerDay ?? 4,
      fixedCommitments: input.hints?.fixedCommitments ?? [],
      energyPattern: input.hints?.energyPattern ?? "balanced",
      scheduledDate: today,
      dueDate: today,
      taskSubject: focusSubject,
    });

    if (normalized.includes("crie") && normalized.includes("tarefa")) {
      const taskTitle = this.extractLocalTitle(message, ["crie uma tarefa", "criar uma tarefa", "tarefa"]);
      return {
        ...decision,
        assistantReply: `Criei uma tarefa a partir do seu pedido: "${taskTitle}".`,
        actionType: "create_task",
        actionLabel: "Criar tarefa",
        taskTitle,
        taskDescription: message,
        taskSubject: focusSubject || "Planejamento",
      };
    }

    if (normalized.includes("replanej") || normalized.includes("reorgan")) {
      return {
        ...decision,
        assistantReply: "Vou criar uma nova versao do plano ativo para redistribuir sua carga.",
        actionType: "replan",
        actionLabel: "Replanejar",
        reasonText: message,
      };
    }

    if ((normalized.includes("crie") || normalized.includes("nova")) && normalized.includes("meta")) {
      const goalTitle = this.extractLocalTitle(message, ["crie uma meta", "nova meta", "meta"]);
      return {
        ...decision,
        assistantReply: `Criei uma meta a partir do seu pedido: "${goalTitle}".`,
        actionType: "create_goal",
        actionLabel: "Criar meta",
        goalTitle,
        goalDescription: message,
        goalCategory: focusSubject || "agent_chat",
        goalTargetDate: today,
      };
    }

    return decision;
  }

  private emptyChatDecision(overrides: Partial<AgentChatDecision>): AgentChatDecision {
    return {
      assistantReply: "",
      actionType: "none",
      actionLabel: "",
      targetId: "",
      targetTitle: "",
      reasonText: "",
      planBriefing: "",
      planningHorizon: "weekly",
      availableHoursPerDay: 4,
      fixedCommitments: [],
      energyPattern: "balanced",
      goalTitle: "",
      goalDescription: "",
      goalCategory: "agent_chat",
      goalPriority: "HIGH",
      goalStatus: "ACTIVE",
      goalTargetDate: "",
      taskTitle: "",
      taskDescription: "",
      taskSubject: "",
      taskPriority: "MEDIUM",
      taskDifficulty: "MEDIUM",
      taskStatus: "TODO",
      estimatedMinutes: 45,
      scheduledDate: "",
      scheduledTime: "",
      dueDate: "",
      routineName: "",
      routineDescription: "",
      routineFrequencyType: "daily",
      routineTimePreference: "morning",
      progress: 0,
      questions: [],
      ...overrides,
    };
  }

  private extractLocalTitle(message: string, prefixes: string[]) {
    const normalized = message.trim();
    const lower = normalized.toLowerCase();
    const prefix = prefixes.find((item) => lower.includes(item));
    if (!prefix) {
      return normalized.slice(0, 80) || "Nova entrada";
    }

    const start = lower.indexOf(prefix) + prefix.length;
    const title = normalized
      .slice(start)
      .replace(/^(para|de|sobre|:|-)/i, "")
      .trim();

    return title.slice(0, 80) || "Nova entrada";
  }

  private mergePlanPayload(
    base: NormalizedAgentPlanPayload,
    generated: GeneratedAgentPlan,
  ): NormalizedAgentPlanPayload {
    return {
      goal: {
        title: generated.goal.title?.trim() || base.goal.title,
        description: generated.goal.description?.trim() || base.goal.description,
        category: generated.goal.category?.trim() || base.goal.category,
        priority: generated.goal.priority || base.goal.priority,
      },
      constraints: base.constraints,
      plan: {
        title: generated.plan.title?.trim() || base.plan.title,
        description: generated.plan.description?.trim() || base.plan.description,
        planningHorizon: generated.plan.planningHorizon || base.plan.planningHorizon,
        routines:
          generated.plan.routines?.length > 0
            ? generated.plan.routines.map((routine) => ({
                name: routine.name.trim(),
                frequencyType: routine.frequencyType,
                timePreference: routine.timePreference,
                tasks: routine.tasks.map((task) => ({
                  title: task.title.trim(),
                  description: task.description.trim(),
                  priority: task.priority,
                  difficulty: task.difficulty,
                  estimatedMinutes: task.estimatedMinutes,
                  context: task.context.trim() || "agent_generated",
                  scheduledDayOffset: task.scheduledDayOffset,
                  dueDayOffset: task.dueDayOffset,
                  scheduledTime: task.scheduledTime,
                })),
              }))
            : base.plan.routines,
      },
      briefing: base.briefing,
    };
  }

  private buildCompactContext(context: AgentContextSnapshot) {
    const pendingTasks =
      context.tasks
        ?.filter((task) => !["DONE", "ARCHIVED", "CANCELED"].includes(task.status))
        .slice(0, 10)
        .map((task) => ({
          title: task.title,
          subject: task.subject,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          estimatedMinutes: task.estimatedMinutes,
        })) ?? [];

    return {
      user: {
        name: context.user?.name ?? "Usuario",
        timezone: context.user?.profile?.timezone ?? "America/Sao_Paulo",
        energyPattern: context.user?.profile?.energyPattern ?? "balanced",
        workStyle: context.user?.profile?.workStyle ?? "deep_work",
        studyStyle: context.user?.profile?.studyStyle ?? "active_recall",
      },
      goals:
        context.goals?.slice(0, 5).map((goal) => ({
          title: goal.title,
          status: goal.status,
          priority: goal.priority,
          progress: goal.progress,
          targetDate: goal.targetDate,
        })) ?? [],
      activePlan: context.activePlan
        ? {
            title: context.activePlan.title,
            description: context.activePlan.description ?? "",
            planningHorizon: context.activePlan.planningHorizon ?? "",
            version: context.activePlan.version ?? 1,
            source: context.activePlan.source ?? "manual",
          }
        : null,
      routines:
        context.routines?.slice(0, 6).map((routine) => ({
          name: routine.name,
          frequencyType: routine.frequencyType,
          timePreference: routine.timePreference,
        })) ?? [],
      pendingTasks,
      metrics: context.metrics ?? {},
      latestReview: context.latestReview
        ? {
            periodLabel: context.latestReview.periodLabel ?? "",
            completionRate: context.latestReview.completionRate ?? 0,
            adherenceRate: context.latestReview.adherenceRate ?? 0,
            observations: context.latestReview.observations?.slice(0, 5) ?? [],
          }
        : null,
      recommendations:
        context.recommendations?.slice(0, 5).map((item) => ({
          title: item.title,
          status: item.status,
        })) ?? [],
    };
  }

  private async createStructuredResponse<T>(payload: {
    name: string;
    instructions: string;
    prompt: string;
    schema: Record<string, unknown>;
  }) {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is missing");
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: this.getConfig().model,
        safety_identifier: payload.name,
        input: [
          {
            role: "system",
            content: [{ type: "input_text", text: payload.instructions }],
          },
          {
            role: "user",
            content: [{ type: "input_text", text: payload.prompt }],
          },
        ],
        text: {
          format: {
            type: "json_schema",
            name: payload.name,
            strict: true,
            schema: payload.schema,
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI request failed with status ${response.status}: ${errorText}`);
    }

    const data = (await response.json()) as OpenAiResponse;
    const refusal = this.extractRefusal(data);
    if (refusal) {
      throw new Error(`OpenAI refused the request: ${refusal}`);
    }

    const outputText = this.extractOutputText(data);
    if (!outputText) {
      throw new Error("OpenAI response did not include structured output text");
    }

    return JSON.parse(outputText) as T;
  }

  private extractOutputText(payload: OpenAiResponse) {
    if (typeof payload.output_text === "string" && payload.output_text.trim()) {
      return payload.output_text;
    }

    for (const item of payload.output ?? []) {
      for (const content of item.content ?? []) {
        if (
          content.type === "output_text" &&
          "text" in content &&
          typeof content.text === "string" &&
          content.text.trim()
        ) {
          return content.text;
        }
      }
    }

    return null;
  }

  private extractRefusal(payload: OpenAiResponse) {
    for (const item of payload.output ?? []) {
      for (const content of item.content ?? []) {
        if (
          content.type === "refusal" &&
          "refusal" in content &&
          typeof content.refusal === "string" &&
          content.refusal.trim()
        ) {
          return content.refusal;
        }
      }
    }

    return null;
  }

  private stringifyError(error: unknown) {
    if (error instanceof Error) {
      return error.message;
    }

    return "Unknown error";
  }
}
