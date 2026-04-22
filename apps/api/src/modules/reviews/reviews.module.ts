import { Body, Controller, Get, Headers, Module, Post } from "@nestjs/common";
import { IsOptional, IsString } from "class-validator";
import { FirebaseDataService } from "../../firebase/firebase-data.service";

class GenerateWeeklyReviewDto {
  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  periodLabel?: string;
}

@Controller("reviews")
class ReviewsController {
  constructor(private readonly database: FirebaseDataService) {}

  @Get()
  async findAll(@Headers("authorization") authorization?: string) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.getReviews(userId);
  }

  @Post("weekly")
  async generateWeekly(@Headers("authorization") authorization: string | undefined, @Body() payload: GenerateWeeklyReviewDto) {
    const userId = await this.database.resolveUserId(authorization);
    return this.database.generateWeeklyReview(userId, payload);
  }
}

@Module({
  controllers: [ReviewsController],
})
export class ReviewsModule {}
