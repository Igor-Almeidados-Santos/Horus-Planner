import { Body, Controller, Get, Headers, Module, Post } from "@nestjs/common";
import { IsIn, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class StartExecutionDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

class StopExecutionDto {
  @IsString()
  taskId!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  actualMinutes?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

class LogExecutionDto {
  @IsString()
  taskId!: string;

  @IsIn(["TODO", "IN_PROGRESS", "PAUSED", "BLOCKED", "DONE", "CANCELED", "ARCHIVED"])
  status!: "TODO" | "IN_PROGRESS" | "PAUSED" | "BLOCKED" | "DONE" | "CANCELED" | "ARCHIVED";

  @IsNumber()
  actualMinutes!: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  focusScore!: number;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  startedAt?: string;

  @IsOptional()
  @IsString()
  endedAt?: string;
}

@Controller("executions")
class ExecutionsController {
  constructor(private readonly database: FirebaseDataService) {}

  @Post("start")
  async start(@Headers("authorization") authorization: string | undefined, @Body() payload: StartExecutionDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.startExecution(userId, payload.taskId, payload.notes);
  }

  @Post("stop")
  async stop(@Headers("authorization") authorization: string | undefined, @Body() payload: StopExecutionDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.stopExecution(userId, payload.taskId, payload.actualMinutes, payload.notes);
  }

  @Post("log")
  async log(@Headers("authorization") authorization: string | undefined, @Body() payload: LogExecutionDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.logExecution(userId, payload);
  }

  @Get("today")
  async findToday(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getExecutionsToday(userId);
  }

  @Get("week")
  async findWeek(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getExecutionsWeek(userId);
  }
}

@Module({
  controllers: [ExecutionsController],
})
export class ExecutionsModule {}
