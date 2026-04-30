import { Body, Controller, Get, Headers, Module, Param, Patch, Post } from "@nestjs/common";
import { IsIn } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class UpdateRecommendationStatusDto {
  @IsIn(["OPEN", "APPLIED", "DISMISSED", "ARCHIVED"])
  status!: "OPEN" | "APPLIED" | "DISMISSED" | "ARCHIVED";
}

@Controller("recommendations")
class RecommendationsController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getRecommendations(userId);
  }

  @Post(":id/apply")
  async apply(@Headers("authorization") authorization: string | undefined, @Param("id") id: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.applyRecommendation(userId, id);
  }

  @Patch(":id/status")
  async updateStatus(
    @Headers("authorization") authorization: string | undefined,
    @Param("id") id: string,
    @Body() payload: UpdateRecommendationStatusDto,
  ) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.updateRecommendationStatus(userId, id, payload.status);
  }
}

@Module({
  controllers: [RecommendationsController],
})
export class RecommendationsModule {}
