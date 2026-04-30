import { Body, Controller, Delete, Get, Headers, Module, Param, Patch, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class CreateRoutineDto {
  @IsString()
  planId!: string;

  @IsString()
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  frequencyType!: string;

  @IsString()
  timePreference!: string;
}

class UpdateRoutineDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  frequencyType?: string;

  @IsOptional()
  @IsString()
  timePreference?: string;
}

@Controller("routines")
class RoutinesController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getRoutines(userId);
  }

  @Get(":id")
  async findOne(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getRoutine(userId, id);
  }

  @Post()
  async create(@Headers("authorization") authorization: string | undefined, @Body() payload: CreateRoutineDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.createRoutine(userId, payload);
  }

  @Patch(":id")
  async update(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() payload: UpdateRoutineDto,
  ) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.updateRoutine(userId, id, payload);
  }

  @Delete(":id")
  async remove(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.deleteRoutine(userId, id);
  }
}

@Module({
  controllers: [RoutinesController],
})
export class RoutinesModule {}
