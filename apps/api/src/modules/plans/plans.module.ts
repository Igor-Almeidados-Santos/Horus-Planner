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
  async findOne(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getPlan(userId, id);
  }

  @Post()
  async create(@Headers("authorization") authorization: string | undefined, @Body() payload: CreatePlanDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.createPlan(userId, payload);
  }

  @Patch(":id")
  async update(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() payload: UpdatePlanDto,
  ) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.updatePlan(userId, id, payload);
  }

  @Post(":id/activate")
  async activate(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.activatePlan(userId, id);
  }

  @Post(":id/archive")
  async archive(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.archivePlan(userId, id);
  }
}

@Module({
  controllers: [PlansController],
})
export class PlansModule {}
