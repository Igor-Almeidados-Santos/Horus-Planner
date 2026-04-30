import { BadRequestException, Body, Controller, Get, Headers, Module, Param, Post } from "@nestjs/common";
import {
  IsArray,
  IsIn,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { FirebaseDataService } from "../../firebase/firebase-data.service";
import {
  OpenAiPlannerService,
  type AgentChatDecision,
  type AgentPlanPayload,
  type NormalizedAgentPlanPayload,
} from "./openai-planner.service";

class AgentTaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @IsOptional()
  @IsIn(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"])
  difficulty?: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsNumber()
  scheduledDayOffset?: number;

  @IsOptional()
  @IsNumber()
  dueDayOffset?: number;

  @IsOptional()
  @IsString()
  scheduledTime?: string;
}

class AgentRoutineDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  frequencyType?: string;

  @IsOptional()
  @IsString()
  timePreference?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentTaskDto)
  tasks?: AgentTaskDto[];
}

class AgentGoalDto {
  @IsOptional()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

class AgentConstraintsDto {
  @IsOptional()
  @IsNumber()
  availableHoursPerDay?: number;

  @IsOptional()
  @IsArray()
  fixedCommitments?: string[];

  @IsOptional()
  @IsString()
  energyPattern?: string;
}

class AgentChatHintsDto {
  @IsOptional()
  @IsString()
  planningHorizon?: string;

  @IsOptional()
  @IsNumber()
  availableHoursPerDay?: number;

  @IsOptional()
  @IsArray()
  fixedCommitments?: string[];

  @IsOptional()
  @IsString()
  energyPattern?: string;

  @IsOptional()
  @IsArray()
  focusAreas?: string[];
}

class AgentPlanDto {
  @IsOptional()
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  planningHorizon?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AgentRoutineDto)
  routines?: AgentRoutineDto[];
}

class AgentPlanPayloadDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  briefing?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentGoalDto)
  goal!: AgentGoalDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentConstraintsDto)
  constraints?: AgentConstraintsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentPlanDto)
  plan!: AgentPlanDto;
}

class AgentReplanDto {
  @IsString()
  reason!: string;

  @IsOptional()
  @IsString()
  planId?: string;
}

class AgentChatDto {
  @IsString()
  message!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentChatHintsDto)
  hints?: AgentChatHintsDto;
}

@Controller("agent")
class AgentController {
  constructor(
    private readonly database: FirebaseDataService,
    private readonly openAiPlanner: OpenAiPlannerService,
  ) {}

  private normalizeText(value?: string) {
    return value?.trim().toLowerCase() ?? "";
  }

  private async buildAgentContextResponse(userId: string) {
    const context = await this.database.getAgentContext(userId);
    return {
      ...context,
      assistant: this.openAiPlanner.getConfig(),
    };
  }

  private async resolvePlanByTarget(userId: string, decision: AgentChatDecision) {
    const plans = await this.database.getPlans(userId);
    const byId = decision.targetId
      ? plans.find((plan) => plan.id === decision.targetId)
      : null;
    if (byId) {
      return byId;
    }

    const normalizedTarget = this.normalizeText(decision.targetTitle);
    if (normalizedTarget) {
      const exactMatch = plans.find((plan) => this.normalizeText(plan.title) === normalizedTarget);
      if (exactMatch) {
        return exactMatch;
      }

      const looseMatch = plans.find((plan) => this.normalizeText(plan.title).includes(normalizedTarget));
      if (looseMatch) {
        return looseMatch;
      }
    }

    return plans.find((plan) => plan.status === "ACTIVE") ?? plans[0] ?? null;
  }

  private async resolveRoutineByName(userId: string, planId: string | undefined, routineName: string) {
    if (!routineName.trim()) {
      return null;
    }

    const routines = await this.database.getRoutines(userId);
    const scopedRoutines = planId ? routines.filter((routine) => routine.planId === planId) : routines;
    const normalizedName = this.normalizeText(routineName);

    return (
      scopedRoutines.find((routine) => this.normalizeText(routine.name) === normalizedName) ??
      scopedRoutines.find((routine) => this.normalizeText(routine.name).includes(normalizedName)) ??
      null
    );
  }

  private async resolveTaskByTarget(userId: string, decision: AgentChatDecision) {
    const tasks = await this.database.getTasks(userId);
    const byId = decision.targetId ? tasks.find((task) => task.id === decision.targetId) : null;
    if (byId) {
      return byId;
    }

    const normalizedTarget = this.normalizeText(decision.targetTitle || decision.taskTitle);
    if (!normalizedTarget) {
      return null;
    }

    return (
      tasks.find((task) => this.normalizeText(task.title) === normalizedTarget) ??
      tasks.find((task) => this.normalizeText(task.title).includes(normalizedTarget)) ??
      null
    );
  }

  private async resolveGoalByTarget(userId: string, decision: AgentChatDecision) {
    const goals = await this.database.getGoals(userId);
    const byId = decision.targetId ? goals.find((goal) => goal.id === decision.targetId) : null;
    if (byId) {
      return byId;
    }

    const normalizedTarget = this.normalizeText(decision.targetTitle || decision.goalTitle);
    if (!normalizedTarget) {
      return null;
    }

    return (
      goals.find((goal) => this.normalizeText(goal.title) === normalizedTarget) ??
      goals.find((goal) => this.normalizeText(goal.title).includes(normalizedTarget)) ??
      null
    );
  }

  private async executeChatDecision(userId: string, decision: AgentChatDecision) {
    const today = new Date().toISOString().slice(0, 10);

    switch (decision.actionType) {
      case "create_plan": {
        const normalizedPayload = this.openAiPlanner.normalizePlanPayload({
          briefing: decision.planBriefing || decision.assistantReply,
          constraints: {
            availableHoursPerDay: decision.availableHoursPerDay || 4,
            fixedCommitments: decision.fixedCommitments ?? [],
            energyPattern: decision.energyPattern || "balanced",
          },
          plan: {
            title: decision.targetTitle || decision.goalTitle || "Plano criado pelo agente",
            planningHorizon: decision.planningHorizon || "weekly",
          },
        });
        const context = await this.database.getAgentContext(userId);
        const assistedPlan = await this.openAiPlanner.enhancePlanDraft({
          payload: normalizedPayload,
          context,
        });
        const persistedPayload = assistedPlan?.payload ?? normalizedPayload;
        const result = await this.database.ingestAgentPlan(userId, persistedPayload);
        return {
          actionType: decision.actionType,
          mutationSummary: `Plano "${result.plan.title}" aplicado com ${result.tasksCreated} tarefas.`,
          planningBlueprint: persistedPayload,
        };
      }
      case "create_task": {
        const plan = await this.resolvePlanByTarget(userId, decision);
        if (!plan) {
          throw new BadRequestException("Nenhum plano disponivel para vincular a tarefa.");
        }

        const routine = await this.resolveRoutineByName(userId, plan.id, decision.routineName);
        const task = await this.database.createTask(userId, {
          planId: plan.id,
          routineId: routine?.id,
          title: decision.taskTitle,
          description: decision.taskDescription || "Tarefa criada pelo agente conversacional.",
          category: "agent_chat",
          priority: decision.taskPriority || "MEDIUM",
          difficulty: decision.taskDifficulty || "MEDIUM",
          status: decision.taskStatus || "TODO",
          estimatedMinutes: Math.max(15, decision.estimatedMinutes || 45),
          scheduledDate: decision.scheduledDate || today,
          scheduledTime: decision.scheduledTime || undefined,
          dueDate: decision.dueDate || decision.scheduledDate || today,
          subject: decision.taskSubject || routine?.name || plan.title,
        });

        return {
          actionType: decision.actionType,
          mutationSummary: `Tarefa "${task.title}" criada no plano "${plan.title}".`,
        };
      }
      case "update_task": {
        const task = await this.resolveTaskByTarget(userId, decision);
        if (!task) {
          throw new BadRequestException("Nao encontrei a tarefa mencionada para atualizar.");
        }

        await this.database.updateTask(userId, task.id, {
          ...(decision.taskTitle ? { title: decision.taskTitle } : {}),
          ...(decision.taskDescription ? { description: decision.taskDescription } : {}),
          ...(decision.taskPriority ? { priority: decision.taskPriority } : {}),
          ...(decision.taskDifficulty ? { difficulty: decision.taskDifficulty } : {}),
          ...(decision.taskStatus ? { status: decision.taskStatus } : {}),
          ...(decision.estimatedMinutes ? { estimatedMinutes: Math.max(15, decision.estimatedMinutes) } : {}),
          ...(decision.scheduledDate ? { scheduledDate: decision.scheduledDate } : {}),
          ...(decision.scheduledTime ? { scheduledTime: decision.scheduledTime } : {}),
          ...(decision.dueDate ? { dueDate: decision.dueDate } : {}),
        });

        return {
          actionType: decision.actionType,
          mutationSummary: `Tarefa "${task.title}" atualizada.`,
        };
      }
      case "create_goal": {
        const targetDate = decision.goalTargetDate || today;
        const goal = await this.database.createGoal(userId, {
          title: decision.goalTitle,
          description: decision.goalDescription || "Objetivo criado pelo agente conversacional.",
          category: decision.goalCategory || "agent_chat",
          priority: decision.goalPriority || "HIGH",
          status: decision.goalStatus || "ACTIVE",
          progress: decision.progress || 0,
          targetDate,
        });

        return {
          actionType: decision.actionType,
          mutationSummary: `Objetivo "${goal.title}" criado.`,
        };
      }
      case "update_goal": {
        const goal = await this.resolveGoalByTarget(userId, decision);
        if (!goal) {
          throw new BadRequestException("Nao encontrei o objetivo mencionado para atualizar.");
        }

        await this.database.updateGoal(userId, goal.id, {
          ...(decision.goalTitle ? { title: decision.goalTitle } : {}),
          ...(decision.goalDescription ? { description: decision.goalDescription } : {}),
          ...(decision.goalCategory ? { category: decision.goalCategory } : {}),
          ...(decision.goalPriority ? { priority: decision.goalPriority } : {}),
          ...(decision.goalStatus ? { status: decision.goalStatus } : {}),
          ...(decision.goalTargetDate ? { targetDate: decision.goalTargetDate } : {}),
          ...(decision.progress >= 0 ? { progress: Math.min(100, decision.progress) } : {}),
        });

        return {
          actionType: decision.actionType,
          mutationSummary: `Objetivo "${goal.title}" atualizado.`,
        };
      }
      case "create_routine": {
        const plan = await this.resolvePlanByTarget(userId, decision);
        if (!plan) {
          throw new BadRequestException("Nenhum plano disponivel para vincular a rotina.");
        }

        const routine = await this.database.createRoutine(userId, {
          planId: plan.id,
          name: decision.routineName,
          description: decision.routineDescription || "Rotina criada pelo agente conversacional.",
          frequencyType: decision.routineFrequencyType || "daily",
          timePreference: decision.routineTimePreference || "morning",
        });

        return {
          actionType: decision.actionType,
          mutationSummary: `Rotina "${routine.name}" criada no plano "${plan.title}".`,
        };
      }
      case "replan": {
        const plan = await this.resolvePlanByTarget(userId, decision);
        const result = await this.database.replan(userId, {
          reason: decision.reasonText || decision.assistantReply,
          planId: plan?.id,
        });
        return {
          actionType: decision.actionType,
          mutationSummary: `Plano replanejado para a versao ${result.newVersion}.`,
        };
      }
      case "clarify":
      case "none":
      default:
        return {
          actionType: decision.actionType,
          mutationSummary: "",
        };
    }
  }

  @Post("plan")
  async ingestPlan(
    @Headers("authorization") authorization: string | undefined,
    @Body() payload: AgentPlanPayloadDto,
  ) {
    if (!payload.briefing?.trim() && (!payload.goal || !payload.plan)) {
      throw new BadRequestException(
        "Envie um briefing no chat ou informe goal e plan estruturados para o agente montar o planejamento.",
      );
    }

    if (
      payload.briefing?.trim() &&
      !this.openAiPlanner.getConfig().enabled &&
      !(payload.plan?.routines && payload.plan.routines.length > 0)
    ) {
      throw new BadRequestException(
        "Configure OPENAI_API_KEY no backend para gerar um planejamento completo a partir do briefing em linguagem natural.",
      );
    }

    const userId = await this.database.resolveUserId(authorization, payload.userId);
    const normalizedPayload: NormalizedAgentPlanPayload = this.openAiPlanner.normalizePlanPayload(
      payload as AgentPlanPayload,
    );
    const context = await this.database.getAgentContext(userId);
    const assistedPlan = await this.openAiPlanner.enhancePlanDraft({
      payload: normalizedPayload,
      context,
    });
    const persistedPayload = assistedPlan?.payload ?? normalizedPayload;
    const result = await this.database.ingestAgentPlan(userId, persistedPayload);

    return {
      ...result,
      generator: assistedPlan ? "openai" : "local",
      assistantNotes: assistedPlan?.assistantNotes ?? [],
      planningBlueprint: persistedPayload,
    };
  }

  @Post("replan")
  async replan(@Headers("authorization") authorization: string | undefined, @Body() payload: AgentReplanDto) {
    const userId = await this.database.resolveUserId(authorization);
    const context = await this.database.getAgentContext(userId);
    const assistedAdvice = await this.openAiPlanner.generateReplanAdvice({
      reason: payload.reason,
      context,
    });
    const result = await this.database.replan(userId, payload);

    return {
      ...result,
      generator: assistedAdvice ? "openai" : "local",
      assistantNotes: assistedAdvice?.assistantNotes ?? [],
      recommendedActions:
        assistedAdvice && assistedAdvice.recommendedActions.length > 0
          ? assistedAdvice.recommendedActions
          : result.recommendedActions,
    };
  }

  @Post("chat")
  async chat(
    @Headers("authorization") authorization: string | undefined,
    @Body() payload: AgentChatDto,
  ) {
    if (!this.openAiPlanner.getConfig().enabled) {
      throw new BadRequestException("Configure OPENAI_API_KEY no backend para habilitar o agente conversacional.");
    }

    const userId = await this.database.resolveUserId(authorization);
    const context = await this.database.getAgentContext(userId);
    const decision = await this.openAiPlanner.interpretChatAction({
      message: payload.message,
      context,
      hints: payload.hints,
    });

    if (!decision) {
      throw new BadRequestException("Nao foi possivel interpretar a mensagem do agente agora.");
    }

    const execution = await this.executeChatDecision(userId, decision);
    await this.database.createAgentSession(userId, {
      inputSummary: payload.message,
      outputSummary: decision.assistantReply,
      contextSnapshot: {
        actionType: decision.actionType,
        mutationSummary: execution.mutationSummary,
      },
    });

    return {
      assistantReply: decision.assistantReply,
      actionType: decision.actionType,
      actionLabel: decision.actionLabel,
      mutationSummary: execution.mutationSummary,
      planningBlueprint: "planningBlueprint" in execution ? execution.planningBlueprint : undefined,
      questions: decision.questions,
      context: await this.buildAgentContextResponse(userId),
    };
  }

  @Get("context")
  async currentContext(@Headers("authorization") authorization?: string) {
    const resolvedUserId = await this.database.resolveUserId(authorization);
    return this.buildAgentContextResponse(resolvedUserId);
  }

  @Get("context/:userId")
  async context(@Param("userId") userId: string) {
    const resolvedUserId = await this.database.resolveUserId(undefined, userId);
    return this.buildAgentContextResponse(resolvedUserId);
  }
}

@Module({
  providers: [OpenAiPlannerService],
  controllers: [AgentController],
})
export class AgentModule {}
