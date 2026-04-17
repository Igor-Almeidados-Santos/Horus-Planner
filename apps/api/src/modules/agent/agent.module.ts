import { Body, Controller, Get, Module, Param, Post } from "@nestjs/common";
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

  @IsObject()
  @ValidateNested()
  @Type(() => AgentGoalDto)
  goal!: AgentGoalDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AgentConstraintsDto)
  constraints?: AgentConstraintsDto;

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
  constructor(private readonly database: FirebaseDataService) {}

  @Post("plan")
  async ingestPlan(@Body() payload: AgentPlanPayloadDto) {
    const userId = await this.database.resolveUserId(undefined, payload.userId);
    return this.database.ingestAgentPlan(userId, payload);
  }

  @Post("replan")
  async replan(@Body() payload: AgentReplanDto) {
    const userId = await this.database.resolveUserId();
    return this.database.replan(userId, payload);
  }

  @Get("context/:userId")
  async context(@Param("userId") userId: string) {
    const resolvedUserId = await this.database.resolveUserId(undefined, userId);
    return this.database.getAgentContext(resolvedUserId);
  }
}

@Module({
  controllers: [AgentController],
})
export class AgentModule {}
