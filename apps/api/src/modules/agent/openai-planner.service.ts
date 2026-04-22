import { Injectable, Logger } from "@nestjs/common";

type PriorityLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
type DifficultyLevel = "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

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
