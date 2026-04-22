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
import { OpenAiPlannerService, type AgentPlanPayload, type NormalizedAgentPlanPayload } from "./openai-planner.service";

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

@Controller("agent")
class AgentController {
  constructor(
    private readonly database: FirebaseDataService,
    private readonly openAiPlanner: OpenAiPlannerService,
  ) {}

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

  @Get("context")
  async currentContext(@Headers("authorization") authorization?: string) {
    const resolvedUserId = await this.database.resolveUserId(authorization);
    const context = await this.database.getAgentContext(resolvedUserId);
    return {
      ...context,
      assistant: this.openAiPlanner.getConfig(),
    };
  }

  @Get("context/:userId")
  async context(@Param("userId") userId: string) {
    const resolvedUserId = await this.database.resolveUserId(undefined, userId);
    const context = await this.database.getAgentContext(resolvedUserId);
    return {
      ...context,
      assistant: this.openAiPlanner.getConfig(),
    };
  }
}

@Module({
  providers: [OpenAiPlannerService],
  controllers: [AgentController],
})
export class AgentModule {}
