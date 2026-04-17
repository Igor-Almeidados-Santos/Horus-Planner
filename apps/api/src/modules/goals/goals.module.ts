import { Body, Controller, Delete, Get, Headers, Module, Param, Patch, Post } from "@nestjs/common";
import { IsIn, IsOptional, IsString, IsNumber } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class CreateGoalDto {
  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsString()
  category!: string;

  @IsIn(["LOW", "MEDIUM", "HIGH", "CRITICAL"])
  priority!: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

  @IsIn(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"])
  status!: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsString()
  targetDate!: string;
}

class UpdateGoalDto {
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
  @IsIn(["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"])
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";

  @IsOptional()
  @IsNumber()
  progress?: number;

  @IsOptional()
  @IsString()
  targetDate?: string;
}

@Controller("goals")
class GoalsController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getGoals(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.database.getGoal(id);
  }

  @Post()
  async create(@Headers("authorization") authorization: string | undefined, @Body() payload: CreateGoalDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.createGoal(userId, payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdateGoalDto) {
    return this.database.updateGoal(id, payload);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.database.deleteGoal(id);
  }
}

@Module({
  controllers: [GoalsController],
})
export class GoalsModule {}
