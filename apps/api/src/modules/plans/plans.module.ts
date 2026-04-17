import { Body, Controller, Get, Headers, Module, Param, Patch, Post } from "@nestjs/common";
import { IsBoolean, IsIn, IsOptional, IsString } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class CreatePlanDto {
  @IsOptional()
  @IsString()
  goalId?: string;

  @IsString()
  title!: string;

  @IsString()
  description!: string;

  @IsIn(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
  status!: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

  @IsString()
  planningHorizon!: string;

  @IsString()
  source!: string;

  @IsBoolean()
  createdByAgent!: boolean;
}

class UpdatePlanDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(["DRAFT", "ACTIVE", "PAUSED", "ARCHIVED"])
  status?: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";

  @IsOptional()
  @IsString()
  planningHorizon?: string;

  @IsOptional()
  @IsString()
  source?: string;
}

@Controller("plans")
class PlansController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getPlans(userId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.database.getPlan(id);
  }

  @Post()
  async create(@Headers("authorization") authorization: string | undefined, @Body() payload: CreatePlanDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.createPlan(userId, payload);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() payload: UpdatePlanDto) {
    return this.database.updatePlan(id, payload);
  }

  @Post(":id/activate")
  activate(@Param("id") id: string) {
    return this.database.activatePlan(id);
  }

  @Post(":id/archive")
  archive(@Param("id") id: string) {
    return this.database.archivePlan(id);
  }
}

@Module({
  controllers: [PlansController],
})
export class PlansModule {}
