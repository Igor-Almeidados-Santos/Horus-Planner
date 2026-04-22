import { Body, Controller, Delete, Get, Headers, Module, Param, Patch, Post } from "@nestjs/common";
import { IsIn, IsNumber, IsOptional, IsString } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class CreateTaskDto {
  @IsString()
  planId!: string;

  @IsOptional()
  @IsString()
  routineId?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  priority!: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @IsIn(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"])
  difficulty!: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

  @IsIn(["TODO", "IN_PROGRESS", "PAUSED", "BLOCKED", "DONE", "CANCELED", "ARCHIVED"])
  status!: "TODO" | "IN_PROGRESS" | "PAUSED" | "BLOCKED" | "DONE" | "CANCELED" | "ARCHIVED";

  @IsNumber()
  estimatedMinutes!: number;

  @IsString()
  scheduledDate!: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsString()
  dueDate!: string;

  @IsString()
  subject!: string;
}

class UpdateTaskDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  priority?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @IsOptional()
  @IsIn(["VERY_LOW", "LOW", "MEDIUM", "HIGH", "VERY_HIGH"])
  difficulty?: "VERY_LOW" | "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

  @IsOptional()
  @IsIn(["TODO", "IN_PROGRESS", "PAUSED", "BLOCKED", "DONE", "CANCELED", "ARCHIVED"])
  status?: "TODO" | "IN_PROGRESS" | "PAUSED" | "BLOCKED" | "DONE" | "CANCELED" | "ARCHIVED";

  @IsOptional()
  @IsNumber()
  estimatedMinutes?: number;

  @IsOptional()
  @IsString()
  scheduledDate?: string;

  @IsOptional()
  @IsString()
  scheduledTime?: string;

  @IsOptional()
  @IsString()
  dueDate?: string;

  @IsOptional()
  @IsString()
  subject?: string;
}

class UpdateTaskStatusDto {
  @IsIn(["TODO", "IN_PROGRESS", "PAUSED", "BLOCKED", "DONE", "CANCELED", "ARCHIVED"])
  status!: "TODO" | "IN_PROGRESS" | "PAUSED" | "BLOCKED" | "DONE" | "CANCELED" | "ARCHIVED";
}

@Controller("tasks")
class TasksController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getTasks(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.database.getTask(id);
  }

  @Post()
  async create(@Headers("authorization") authorization: string | undefined, @Body() payload: CreateTaskDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.createTask(userId, payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateTaskDto) {
    return this.database.updateTask(id, payload);
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() payload: UpdateTaskStatusDto) {
    return this.database.updateTaskStatus(id, payload.status);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.database.deleteTask(id);
  }
}

@Module({
  controllers: [TasksController],
})
export class TasksModule {}
